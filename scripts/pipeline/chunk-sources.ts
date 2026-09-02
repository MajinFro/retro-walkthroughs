/**
 * Stage 3 - Source Parser.
 *
 * Splits every registered source into provenance-preserving chunks.
 * No summarizing, no interpretation: chunk text is the verbatim source text.
 *
 *   npx tsx scripts/pipeline/chunk-sources.ts <gameId>
 */
import fs from "node:fs";
import path from "node:path";
import {
  type Chunk,
  type SourceEntry,
  gameIdArg,
  paths,
  readJson,
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

const id = gameIdArg();
const P = paths(id);
requireFile(P.sourcesManifest, "run Stage 1 (npm run rw:fetch) and Stage 2 (rw:collect) first");
const manifest = readJson<SourceEntry[]>(P.sourcesManifest);

const all: Chunk[] = [];
for (const src of manifest) {
  const f = path.join(P.sourcesDir, src.file);
  if (!fs.existsSync(f)) {
    console.warn(`! source file missing for ${src.id}: ${src.file}`);
    continue;
  }
  const c = chunkSource(src, readText(f));
  const maps = c.filter((x) => x.has_ascii_map).length;
  const sections = new Set(c.map((x) => x.section)).size;
  console.log(`${src.id.padEnd(12)} ${String(c.length).padStart(4)} chunks  ${String(sections).padStart(4)} sections  ${String(maps).padStart(3)} w/ ASCII maps  (${src.site}: ${src.title})`);
  all.push(...c);
}
writeJsonl(P.chunks, all);
console.log(`\nStage 3: wrote ${all.length} chunks -> ${path.relative(P.root, P.chunks)}`);
console.log(`Next: extract facts. List chunks with: npm run rw:chunks -- ${id} --source <id> --list`);
