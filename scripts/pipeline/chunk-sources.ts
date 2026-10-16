/**
 * Stage 3 - Source Parser.
 *
 * Splits every registered source into provenance-preserving chunks.
 * No summarizing, no interpretation: chunk text is the verbatim source text.
 *
 *   npx tsx scripts/pipeline/chunk-sources.ts <gameId> [--rechunk <source_id|all>]
 */
import fs from "node:fs";
import path from "node:path";
import {
  type Chunk,
  type SourceEntry,
  exists,
  flag,
  gameIdArg,
  loadFacts,
  loadSkipped,
  paths,
  readJson,
  readJsonl,
  readText,
  requireFile,
  writeJsonl,
} from "./lib.ts";

const TARGET = 3500; // preferred chunk size (chars)
const HARD_MAX = 7000; // never exceed (unless a single map block is larger)
const MIN_BEFORE_HEADER = 800; // flush on a new header once we have this much

const isSep = (l: string) => /^\s*([=\-*~#_+])\1{7,}\s*$/.test(l);
const isMapLine = (l: string) =>
  /[|+]/.test(l) && (l.match(/[|+\-=#\/\\\[\]]/g) || []).length >= 4 && l.trim().length >= 6;

function isHeader(lines: string[], i: number): boolean {
  const l = lines[i];
  const t = l.trim();
  if (!t || t.length > 90 || isSep(l)) return false;
  if (/^#{1,4}\s+\S/.test(t)) return true; // markdown header (html2text output)
  const prev = i > 0 ? lines[i - 1] : "";
  const next = i + 1 < lines.length ? lines[i + 1] : "";
  if (isSep(prev) || isSep(next)) return true; // ===== TITLE ===== style
  // GameFAQs section tags, e.g. "4.03 Mt. Kolts [WK403]" or "[WK403]"
  if (/\[[A-Za-z]{1,5}\d{1,4}[A-Za-z]?\]\s*$/.test(t) && /[A-Za-z]{3}/.test(t.replace(/\[.*?\]/g, ""))) return true;
  return false;
}

function cleanHeader(t: string) {
  return t.replace(/^#+\s*/, "").replace(/\s+/g, " ").trim();
}

function chunkSource(src: SourceEntry, text: string): Chunk[] {
  const lines = text.split(/\r?\n/);
  const chunks: Chunk[] = [];
  const minBeforeHeader = src.kind === "ra-comments" ? 0 : MIN_BEFORE_HEADER;
  let section = "(start)";
  let buf: string[] = [];
  let bufStart = 1;
  let bufSection = section;
  let size = 0;
  let mapRun = 0;
  let bufHasMap = false;

  const flush = (endLine: number) => {
    const body = buf.join("\n").replace(/^\s+|\s+$/g, "");
    if (body.length > 0 && !(buf.every((l) => isSep(l) || !l.trim()))) {
      const n = chunks.length + 1;
      chunks.push({
        chunk_id: `${src.id}#${n}`,
        n,
        source_id: src.id,
        site: src.site,
        source_title: src.title,
        section: bufSection,
        line_start: bufStart,
        line_end: endLine,
        has_ascii_map: bufHasMap,
        prev: null,
        next: null,
        text: body,
      });
    }
    buf = [];
    size = 0;
    bufHasMap = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const header = isHeader(lines, i);
    if (header && size >= minBeforeHeader && buf.some((l) => l.trim() && !isSep(l))) {
      // keep a separator line that belongs to the header with the new chunk
      const carry = buf.length && isSep(buf[buf.length - 1]) ? [buf.pop() as string] : [];
      flush(i - carry.length);
      buf = carry;
      size = carry.join("\n").length;
      bufStart = i + 1 - carry.length;
    }
    if (header) section = cleanHeader(line);
    // a buffer holding only a carried separator belongs to the header that follows it
    if (header && buf.every((l) => isSep(l) || !l.trim())) bufSection = section;
    if (buf.length === 0) {
      bufStart = i + 1;
      bufSection = section;
    }
    mapRun = isMapLine(line) ? mapRun + 1 : 0;
    if (mapRun >= 4) bufHasMap = true;

    buf.push(line);
    size += line.length + 1;

    const blank = !line.trim();
    const inMap = mapRun > 0;
    if ((size >= TARGET && blank && !inMap) || size >= HARD_MAX * (inMap ? 2 : 1)) {
      flush(i + 1);
    }
  }
  flush(lines.length);

  for (let k = 0; k < chunks.length; k++) {
    chunks[k].prev = k > 0 ? chunks[k - 1].chunk_id : null;
    chunks[k].next = k + 1 < chunks.length ? chunks[k + 1].chunk_id : null;
  }
  return chunks;
}

/**
 * ra-comments.txt (written by rw:fetch) is a list of blocks:
 *   ====
 *   GAME COMMENTS | ACHIEVEMENT <id> - <title>
 *   ====
 *   Description: ...
 *   [user] comment ...
 * One chunk per block, so a header never ends up alone in its own chunk. Blocks
 * longer than TARGET split only between comments and keep the block's section.
 */
function chunkRaComments(src: SourceEntry, text: string): Chunk[] {
  const lines = text.split(/\r?\n/);
  const isBlockHeader = (i: number) =>
    i > 0 && isSep(lines[i - 1]) && /^(GAME COMMENTS|ACHIEVEMENT \d+ - .+)$/.test(lines[i].trim());
  const starts: number[] = [];
  for (let i = 0; i < lines.length; i++) if (isBlockHeader(i)) starts.push(i - 1);
  if (!starts.length || starts[0] !== 0) starts.unshift(0);

  const chunks: Chunk[] = [];
  const push = (from: number, to: number, section: string) => {
    const body = lines.slice(from, to).join("\n").replace(/^\s+|\s+$/g, "");
    if (!body || lines.slice(from, to).every((l) => isSep(l) || !l.trim())) return;
    const n = chunks.length + 1;
    chunks.push({
      chunk_id: `${src.id}#${n}`,
      n,
      source_id: src.id,
      site: src.site,
      source_title: src.title,
      section,
      line_start: from + 1,
      line_end: to,
      has_ascii_map: false,
      prev: null,
      next: null,
      text: body,
    });
  };

  for (let b = 0; b < starts.length; b++) {
    const from = starts[b];
    const to = b + 1 < starts.length ? starts[b + 1] : lines.length;
    const section = (isBlockHeader(from + 1) ? lines[from + 1].trim() : "(start)") || "(start)";
    // split long blocks between comments: before a "[user]" line that follows a blank line,
    // unless what remains of the block is too short to stand alone
    let remaining = lines.slice(from, to).reduce((n, l) => n + l.length + 1, 0);
    let pieceStart = from;
    let size = 0;
    for (let i = from; i < to; i++) {
      const commentStart = /^\[[^\]]+\]/.test(lines[i]) && i > from && !lines[i - 1].trim();
      if (commentStart && size >= TARGET && remaining >= MIN_BEFORE_HEADER) {
        push(pieceStart, i, section);
        pieceStart = i;
        size = 0;
      }
      size += lines[i].length + 1;
      remaining -= lines[i].length + 1;
    }
    push(pieceStart, to, section);
  }
  return chunks;
}

const id = gameIdArg();
const P = paths(id);
requireFile(P.sourcesManifest, "run Stage 1 (npm run rw:fetch) and Stage 2 (rw:collect) first");
const manifest = readJson<SourceEntry[]>(P.sourcesManifest);

// Re-chunking a source renumbers its chunks and breaks every fact that cites them.
// Keep the existing chunks of any source that facts or _skipped.txt already reference,
// unless --rechunk <source_id|all> is given.
const rechunk = flag("rechunk");
const previous = exists(P.chunks) ? readJsonl<Chunk>(P.chunks) : [];
const referenced = new Set<string>([
  ...loadFacts(P.factsDir).flatMap((f) => (f.evidence ?? []).map((e) => e.chunk_id.split("#")[0])),
  ...[...loadSkipped(P.factsDir).keys()].map((k) => k.split("#")[0]),
]);

const all: Chunk[] = [];
for (const src of manifest) {
  const f = path.join(P.sourcesDir, src.file);
  if (!fs.existsSync(f)) {
    console.warn(`! source file missing for ${src.id}: ${src.file}`);
    continue;
  }
  const kept = previous.filter((c) => c.source_id === src.id);
  if (kept.length && referenced.has(src.id) && rechunk !== src.id && rechunk !== "all") {
    console.log(`${src.id.padEnd(12)} ${String(kept.length).padStart(4)} chunks  (kept: facts reference these chunk ids; --rechunk ${src.id} re-splits and invalidates them)`);
    all.push(...kept);
    continue;
  }
  const c = src.kind === "ra-comments" ? chunkRaComments(src, readText(f)) : chunkSource(src, readText(f));
  const maps = c.filter((x) => x.has_ascii_map).length;
  const sections = new Set(c.map((x) => x.section)).size;
  console.log(`${src.id.padEnd(12)} ${String(c.length).padStart(4)} chunks  ${String(sections).padStart(4)} sections  ${String(maps).padStart(3)} w/ ASCII maps  (${src.site}: ${src.title})`);
  all.push(...c);
}
writeJsonl(P.chunks, all);
console.log(`\nStage 3: wrote ${all.length} chunks -> ${path.relative(P.root, P.chunks)}`);
console.log(`Next: extract facts. List chunks with: npm run rw:chunks -- ${id} --source <id> --list`);
