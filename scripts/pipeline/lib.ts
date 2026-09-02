/**
 * Shared helpers for the evidence-first walkthrough pipeline.
 *
 * Every stage reads/writes files under content/research/<gameId>/ so that
 * each stage can be run (or re-run) independently, in any conversation.
 */
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
  kind: "guide" | "wiki" | "forum" | "ra-comments" | "map" | "checklist" | "other";
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
