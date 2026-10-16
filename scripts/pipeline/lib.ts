/**
 * Shared helpers for the evidence-first walkthrough pipeline.
 *
 * Every stage reads/writes files under content/research/<gameId>/ so that
 * each stage can be run (or re-run) independently, in any conversation.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const EOL = "\r\n"; // project rule: CRLF line endings

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Achievement {
  id: number;
  title: string;
  description: string;
  points: number;
  trueRatio?: number;
  badgeName?: string;
  badgeUrl?: string;
  type?: string | null; // "progression" | "win_condition" | "missable" | null
  displayOrder?: number;
  numAwarded?: number;
}

export interface AchievementsFile {
  gameId: number;
  title: string;
  console: string;
  developer?: string;
  publisher?: string;
  genre?: string;
  released?: string;
  boxArt?: string;
  achievements: Achievement[];
}

export interface SourceEntry {
  id: string; // short id, e.g. "gf1", "neo1", "wiki1", "ra-comments"
  site: string;
  title: string;
  author?: string;
  url: string | string[];
  image_url?: string;
  kind: "guide" | "wiki" | "forum" | "ra-comments" | "ra-guide" | "map" | "checklist" | "other";
  file: string; // relative to 02_sources/
  chars?: number;
  collected_at?: string;
}

export interface Chunk {
  chunk_id: string; // "<source_id>#<n>"
  n: number;
  source_id: string;
  site: string;
  source_title: string;
  section: string;
  line_start: number;
  line_end: number;
  has_ascii_map: boolean;
  prev: string | null;
  next: string | null;
  text: string;
}

export interface Evidence {
  source_id: string;
  chunk_id: string;
  quote: string;
  translation?: string; // English translation when the verbatim quote is not in English
  stance?: "supports" | "contradicts";
  note?: string;
}

export type FactType =
  | "location"
  | "transition"
  | "event"
  | "boss"
  | "enemy"
  | "item"
  | "shop"
  | "npc"
  | "quest"
  | "mechanic"
  | "missable"
  | "ponr"
  | "achievement"
  | "map"
  | "save_point"
  | "tip";

export interface Fact {
  id: string; // "<source_id>-<chunk n>-<k>"
  type: FactType;
  subject: string;
  predicate: string;
  object?: string | null;
  location?: string | null;
  requires?: string[];
  achievement_ids?: number[];
  missable?: boolean;
  text: string; // one-sentence plain statement of the fact
  evidence: Evidence[];
}

export type FactStatus =
  | "verified"
  | "single_source"
  | "conflict"
  | "resolved"
  | "rejected";

export interface VerifiedFact extends Fact {
  status: FactStatus;
  sources: string[];
  problems?: string[];
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
export function paths(gameId: string | number) {
  const root = process.cwd();
  const dir = path.join(root, "content", "research", String(gameId));
  const j = (...p: string[]) => path.join(dir, ...p);
  return {
    root,
    dir,
    achievements: j("01_achievements.json"),
    sourcesDir: j("02_sources"),
    sourcesManifest: j("02_sources", "sources.json"),
    chunks: j("03_chunks.jsonl"),
    factsDir: j("04_facts"),
    aliases: j("05_aliases.json"),
    corroborationCandidates: j("05_candidates.md"),
    corroborations: j("05_corroborations.jsonl"),
    resolutions: j("05_resolutions.json"),
    verified: j("05_verified.json"),
    graph: j("06_graph.json"),
    graphMermaid: j("06_graph.md"),
    roadmap: j("07_roadmap.json"),
    packetsDir: j("08_packets"),
    chaptersDir: j("08_chapters"),
    cited: j("08_cited.md"),
    qa: j("09_qa.json"),
    review: j("09_review.json"),
    score: j("10_score.json"),
    final: path.join(root, "content", "walkthroughs", `${gameId}.md`),
    apiDump: path.join(root, "content", "api-dumps", `${gameId}.md`),
  };
}

// ---------------------------------------------------------------------------
// IO
// ---------------------------------------------------------------------------
export function ensureDir(d: string) {
  fs.mkdirSync(d, { recursive: true });
}

export function exists(p: string) {
  return fs.existsSync(p);
}

export function readText(p: string): string {
  return fs.readFileSync(p, "utf-8").replace(/^\uFEFF/, "");
}

export function writeText(p: string, text: string) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, text.replace(/\r?\n/g, EOL), "utf-8");
}

export function readJson<T = any>(p: string): T {
  return JSON.parse(readText(p));
}

export function readJsonOr<T>(p: string, fallback: T): T {
  return exists(p) ? readJson<T>(p) : fallback;
}

export function writeJson(p: string, data: unknown) {
  writeText(p, JSON.stringify(data, null, 2) + EOL);
}

export function readJsonl<T = any>(p: string): T[] {
  if (!exists(p)) return [];
  const out: T[] = [];
  readText(p)
    .split(/\r?\n/)
    .forEach((line, i) => {
      const t = line.trim();
      if (!t) return;
      try {
        out.push(JSON.parse(t));
      } catch (e) {
        throw new Error(`${p}:${i + 1} is not valid JSON: ${(e as Error).message}`);
      }
    });
  return out;
}

export function writeJsonl(p: string, rows: unknown[]) {
  writeText(p, rows.map((r) => JSON.stringify(r)).join(EOL) + EOL);
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
/** Normalize for fuzzy-but-strict quote matching. */
export function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201B`´]/g, "'")
    .replace(/[\u201C\u201D\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9'%+\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slug(s: string): string {
  return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const STOP = new Set(
  "the a an and or of to in on at for from with by is are be you your this that then there it its into after before when once will can must have has get got go use".split(
    " ",
  ),
);

export function keyTerms(s: string): string[] {
  return [...new Set(norm(s).split(" ").filter((w) => w.length >= 4 && !STOP.has(w)))];
}

export function words(s: string): number {
  return (s.match(/\S+/g) || []).length;
}

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------
export function gameIdArg(): string {
  const id = process.argv[2];
  if (!id || !/^\d+$/.test(id)) {
    console.error(`Usage: ${path.basename(process.argv[1])} <gameId> [options]`);
    process.exit(1);
  }
  return id;
}

export function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : "true";
}

export function requireFile(p: string, hint: string) {
  if (!exists(p)) {
    console.error(`Missing ${path.relative(process.cwd(), p)} — ${hint}`);
    process.exit(1);
  }
}

export function loadAliases(p: string): Map<string, string> {
  // 05_aliases.json: { "Canonical Name": ["alias 1", "alias 2"] }
  const raw = readJsonOr<Record<string, string[]>>(p, {});
  const m = new Map<string, string>();
  for (const [canon, list] of Object.entries(raw)) {
    m.set(norm(canon), norm(canon));
    for (const a of list) m.set(norm(a), norm(canon));
  }
  return m;
}

export function canon(aliases: Map<string, string>, s?: string | null): string {
  const n = norm(s || "");
  return aliases.get(n) ?? n;
}

export function loadFacts(factsDir: string): Fact[] {
  if (!exists(factsDir)) return [];
  const files = fs.readdirSync(factsDir).filter((f) => f.endsWith(".jsonl")).sort();
  return files.flatMap((f) => readJsonl<Fact>(path.join(factsDir, f)));
}

/** 04_facts/_skipped.txt: "<chunk_id> <reason>" per line -> chunk_id => reason */
export function loadSkipped(factsDir: string): Map<string, string> {
  const m = new Map<string, string>();
  const f = path.join(factsDir, "_skipped.txt");
  if (!exists(f)) return m;
  for (const line of readText(f).split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const [chunkId, ...reason] = t.split(/\s+/);
    m.set(chunkId, reason.join(" "));
  }
  return m;
}

export interface SourceProgress {
  total: number;
  done: number;
  todo: number[]; // chunk numbers neither cited by a fact nor listed in _skipped.txt
}

/**
 * Stage 4 completeness: a chunk is processed only when a fact cites it or
 * _skipped.txt lists it with a reason. Every source counts, including ra-comments.
 */
export function chunkProgress(chunks: Chunk[], facts: Fact[], skipped: Map<string, string>) {
  // quoting only the "Description:" line rw:fetch writes into ra-comments does not count as reading the chunk
  const isAchMetadata = (e: Evidence) => e.source_id === "ra-comments" && /^\s*description\s*:/i.test(e.quote ?? "");
  const cited = new Set(facts.flatMap((f) => (f.evidence ?? []).filter((e) => !isAchMetadata(e)).map((e) => e.chunk_id)));
  const bySource = new Map<string, SourceProgress>();
  const unprocessed: Chunk[] = [];
  for (const c of chunks) {
    const s = bySource.get(c.source_id) ?? { total: 0, done: 0, todo: [] };
    s.total++;
    if (cited.has(c.chunk_id) || skipped.has(c.chunk_id)) s.done++;
    else {
      s.todo.push(c.n);
      unprocessed.push(c);
    }
    bySource.set(c.source_id, s);
  }
  return { bySource, unprocessed };
}

/** The next extraction batch: up to `max` unprocessed chunks of the first unfinished source, within a span of 10. */
export function nextBatch(gameId: string, bySource: Map<string, SourceProgress>, max = 8): string | null {
  for (const [src, s] of bySource) {
    if (!s.todo.length) continue;
    const from = s.todo[0];
    const within = s.todo.filter((n) => n - from < 10).slice(0, max);
    return `npm run rw:chunks -- ${gameId} --source ${src} --from ${from} --to ${within[within.length - 1]}`;
  }
  return null;
}

/** [1,2,3,5,7,8] -> "1-3, 5, 7-8" */
export function compressRanges(ns: number[]): string {
  if (!ns.length) return "";
  const out: string[] = [];
  let a = ns[0];
  let b = ns[0];
  for (let i = 1; i <= ns.length; i++) {
    if (ns[i] === b + 1) b = ns[i];
    else {
      out.push(a === b ? `${a}` : `${a}-${b}`);
      a = b = ns[i];
    }
  }
  return out.join(", ");
}

// ---------------------------------------------------------------------------
// Fingerprints: detect stale downstream artifacts by content, not mtimes
// (git checkouts and clones reset mtimes).
// ---------------------------------------------------------------------------
export function fingerprint(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return createHash("sha1").update(text.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
}

/** Content of a file for fingerprinting; JSON outputs drop their generated_at timestamp. */
function fpContent(p: string): string {
  if (!exists(p)) return "";
  const text = readText(p);
  if (!p.endsWith(".json")) return text;
  const { generated_at: _ignored, ...rest } = JSON.parse(text);
  return JSON.stringify(rest);
}

export function fingerprintFiles(files: string[]): string {
  return fingerprint(files.map((f) => `${path.basename(f)}\n${fpContent(f)}`).join("\n\u0000\n"));
}

/** What rw:verify reads: every fact file, the chunks, aliases, corroborations and resolutions. */
export function verifyInputFiles(P: ReturnType<typeof paths>): string[] {
  const factFiles = exists(P.factsDir)
    ? fs.readdirSync(P.factsDir).filter((f) => f.endsWith(".jsonl")).sort().map((f) => path.join(P.factsDir, f))
    : [];
  return [...factFiles, P.chunks, P.aliases, P.corroborations, P.resolutions, P.achievements];
}

/** What rw:qa reads: verified facts, graph, roadmap and every chapter draft. */
export function qaInputFiles(P: ReturnType<typeof paths>, chapterNs: number[]): string[] {
  return [P.verified, P.graph, P.roadmap, path.join(P.chaptersDir, "00_overview.md"), ...chapterNs.map((n) => path.join(P.chaptersDir, chapterFile(n)))];
}

export function chapterInputFiles(P: ReturnType<typeof paths>, chapterNs: number[]): string[] {
  return [path.join(P.chaptersDir, "00_overview.md"), ...chapterNs.map((n) => path.join(P.chaptersDir, chapterFile(n)))];
}

export function loadChunks(p: string): Map<string, Chunk> {
  const m = new Map<string, Chunk>();
  for (const c of readJsonl<Chunk>(p)) m.set(c.chunk_id, c);
  return m;
}

export const CITE_RE = /\[\[([A-Za-z0-9_\-]+(?:\s*,\s*[A-Za-z0-9_\-]+)*)\]\]/g;
export const ACH_RE = /\[ACHIEVEMENT:\s*(\d+)\s*\]/g;
export const MERMAID_RE = /\[MERMAID\]/g;

export function chapterFile(n: number | string) {
  return typeof n === "number" ? `${String(n).padStart(2, "0")}.md` : `${n}.md`;
}

// ---------------------------------------------------------------------------
// Per-fact checks shared by rw:verify and rw:extract (deterministic, no model judgement)
// ---------------------------------------------------------------------------
export const FACT_TYPES = new Set<string>([
  "location", "transition", "event", "boss", "enemy", "item", "shop", "npc", "quest",
  "mechanic", "missable", "ponr", "achievement", "map", "save_point", "tip",
]);

/** null when the quote appears verbatim (normalized) in the chunk; "..." may join two verbatim parts in order. */
export function quoteProblem(ev: Evidence, chunk: Chunk | undefined): string | null {
  if (!chunk) return `chunk ${ev.chunk_id} does not exist`;
  if (chunk.source_id !== ev.source_id) return `chunk ${ev.chunk_id} belongs to ${chunk.source_id}, not ${ev.source_id}`;
  const q = ev.quote || "";
  const parts = q.split(/\.\.\.|…/).map(norm).filter(Boolean);
  if (!parts.length || norm(q).length < 12) return `quote too short: "${q}"`;
  const hay = norm(chunk.text);
  let pos = 0;
  for (const p of parts) {
    const i = hay.indexOf(p, pos);
    if (i === -1) return `quote not found verbatim in ${ev.chunk_id}: "${q.slice(0, 80)}"`;
    pos = i + p.length;
  }
  return null;
}

export interface FactCheckContext {
  chunks: Map<string, Chunk>;
  achIds: Set<number>;
  achDescs: Set<string>; // norm(description) of every achievement
}

export function factCheckContext(chunks: Map<string, Chunk>, ach: AchievementsFile): FactCheckContext {
  return { chunks, achIds: new Set(ach.achievements.map((a) => a.id)), achDescs: new Set(ach.achievements.map((a) => norm(a.description))) };
}

const HARD_FAIL_RE = /bad id|unknown type|missing text|achievement description|low quote overlap|unquoted number/;

/**
 * Schema + evidence checks for one fact (everything except duplicate ids, which need the whole set).
 * Returns the problems, the evidence that survived, and whether the fact must be rejected.
 */
export function checkFact(f: Fact, ctx: FactCheckContext): { problems: string[]; evidence: Evidence[]; reject: boolean } {
  const problems: string[] = [];
  const fid = f.id ?? "";
  if (!/^[a-z0-9][a-z0-9\-]*-\d+-\d+$/.test(fid)) problems.push(`bad id format (want <source>-<chunk n>-<k>)`);
  if (!FACT_TYPES.has(f.type)) problems.push(`unknown type "${f.type}"`);
  if (!f.text || !f.subject || !f.predicate) problems.push("missing text/subject/predicate");
  for (const a of f.achievement_ids ?? []) if (!ctx.achIds.has(Number(a))) problems.push(`unknown achievement id ${a}`);

  const goodEv: Evidence[] = [];
  for (const ev of f.evidence ?? []) {
    const err = quoteProblem(ev, ctx.chunks.get(ev.chunk_id));
    if (err) problems.push(err);
    else {
      const qNorm = norm(ev.quote);
      // achievement metadata: the "Description:" line rw:fetch writes into ra-comments, or any quote identical to a description
      const isAchMetadata = ctx.achDescs.has(qNorm) || (ev.source_id === "ra-comments" && qNorm.startsWith("description"));
      if (isAchMetadata || (qNorm.startsWith("description") && f.type !== "achievement")) {
        problems.push(`quote is an achievement description — facts must cite guide text or RA comments, not achievement metadata`);
      } else {
        goodEv.push({ ...ev, stance: ev.stance ?? "supports" });
      }
    }
  }

  // Quote overlap audit for gameplay facts: check if fact text introduces unverified claims
  if (f.type !== "achievement" && goodEv.length > 0 && f.text) {
    // a non-English quote carries an English `translation`; compare the fact text against that
    const quoteTerms = new Set(goodEv.flatMap((e) => keyTerms(e.translation ? `${e.quote} ${e.translation}` : e.quote)));
    const textTerms = keyTerms(f.text);
    if (textTerms.length >= 6) {
      const overlap = textTerms.filter((w) => quoteTerms.has(w)).length;
      const ratio = overlap / textTerms.length;
      if (ratio < 0.2) {
        problems.push(`low quote overlap (${Math.round(ratio * 100)}%): fact text contains words not in evidence quote — ensure fact does not invent details`);
      }
    }
  }

  // Number audit: HP, prices, counts, and other multi-digit numbers in the fact text must appear in its quotes
  // (single digits are tolerated: room/floor ordinals often come from a section heading).
  if (goodEv.length > 0 && f.text) {
    const digits = (s: string) => s.replace(/(\d),(?=\d{3})/g, "$1");
    const quoteNums = new Set(goodEv.flatMap((e) => digits(`${e.quote} ${e.translation ?? ""}`).match(/\d+/g) ?? []));
    const missing = [...new Set(digits(f.text).match(/\b\d{2,}\b/g) ?? [])].filter((n) => !quoteNums.has(n));
    if (missing.length) problems.push(`unquoted number(s) ${missing.join(", ")}: every multi-digit number in the fact text must appear in an evidence quote`);
  }

  const reject = !goodEv.some((e) => e.stance === "supports") || problems.some((p) => HARD_FAIL_RE.test(p));
  return { problems, evidence: goodEv, reject };
}
