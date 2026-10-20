/**
 * Knowledge-graph + roadmap types, validation and Mermaid generation.
 * Mermaid is ONLY ever produced from 06_graph.json, so no node can be invented.
 */
import { norm, type SourceEntry, type VerifiedFact } from "./lib.ts";

export type NodeKind = "area" | "boss" | "npc" | "item" | "key_item" | "quest" | "achievement" | "missable" | "ponr" | "save_point";
export type EdgeKind = "leads_to" | "requires" | "unlocks" | "contains" | "missable_before";

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  fact_ids?: string[];
  achievement_id?: number;
}
export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  label?: string;
  fact_ids?: string[];
}
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface True100Criteria {
  genre: string;
  categories: { name: string; description: string; tracked_per_chapter?: boolean }[];
  chapter_checkpoints?: string[];
}

export interface Roadmap {
  format?: "command_steps" | "prose";
  true_100_criteria?: True100Criteria;
  playthroughs: number;
  playthrough_notes: string;
  settings_notes?: string;
  fact_ids?: string[];
  missables: { achievement_id?: number; label: string; deadline: string; chapter: number; fact_ids: string[] }[];
  ponr: { label: string; chapter: number; warning: string; fact_ids: string[] }[];
  /** chapter.counters: how many of each tracked collectible the chapter collects; totals here (e.g. {"Hidden Treasure Boxes": 39}) */
  counter_totals?: Record<string, number>;
  /** game_chapter: the game's own chapter number when the roadmap splits or merges the game's chapters */
  chapters: { n: number; title: string; game_chapter?: number; areas: string[]; achievement_ids: number[]; fact_ids: string[]; notes?: string; counters?: Record<string, number> }[];
  unverifiable_achievement_ids?: number[];
  /**
   * Questions no source answers (e.g. "are in-game codes allowed during the V.Hard run?"). Every packet
   * that covers them gets the question and the safe-play guidance, so writers present them as
   * unconfirmed and never recommend the risky option. chapters omitted = applies to every chapter.
   */
  open_questions?: { question: string; guidance: string; chapters?: number[] }[];
}

/**
 * The visual maps (sources.json kind "map") that cover a roadmap chapter: the map title names one of the
 * chapter's areas or the chapter's own title, or says "Chapter <n>" (games whose chapters are the roadmap's).
 */
// map titles and area labels word the same place differently ("Dragon's Horn South Tower" vs "South
// Dragon's Horn"), so compare word sets; "southern" etc. count as "south"
const MAP_STOP = new Set(["of", "the", "a", "an", "to", "in", "and", "map", "maps"]);
// words that never identify a place on their own ("chapter 1" must not match every "Chapter N" map)
const MAP_GENERIC = new Set(["chapter", "part", "level", "stage", "world", "area", "floor", "room", "dungeon", "overworld", "guide", "solution"]);
const mapWords = (s: string) =>
  norm(s).replace(/'s\b/g, "").replace(/\b(north|south|east|west)ern\b/g, "$1").split(/\s+/).filter((w) => (w.length >= 2 || /^\d$/.test(w)) && !MAP_STOP.has(w));
const distinctive = (ws: string[]) => ws.some((w) => !MAP_GENERIC.has(w) && !/^\d+$/.test(w));

/**
 * Registered maps that cover a chapter: the map title contains every word of the chapter title, an area
 * label, or one of that label's 05_aliases.json names (pass `aliases` from loadAliases).
 */
export function chapterMaps(sources: SourceEntry[], g: Graph, ch: Roadmap["chapters"][number], aliases?: Map<string, string>, all?: Roadmap["chapters"]): SourceEntry[] {
  const labels = ch.areas.map((a) => g.nodes.find((n) => n.id === a)?.label ?? a.replace(/_/g, " "));
  const names = [ch.title.replace(/^chapter\s+\d+\s*[:.\-]?\s*/i, ""), ...labels];
  if (aliases) {
    const canons = new Set(labels.map((l) => aliases.get(norm(l)) ?? norm(l)));
    for (const [alias, c] of aliases) if (canons.has(c)) names.push(alias);
  }
  const wanted = names.filter((s) => norm(s).length >= 4).map(mapWords).filter(distinctive);
  // "Chapter N" in a map title is the game's chapter, which differs from the roadmap's when chapters are split
  const gameChapterOf = (c: Roadmap["chapters"][number]) => c.game_chapter ?? Number(c.title.match(/^chapter\s+(\d+)/i)?.[1] ?? c.n);
  const gameChapter = gameChapterOf(ch);
  // a game chapter split over several roadmap chapters: each "Chapter N" map belongs to one part, so only
  // the place-name match below can tell which (pass `all` = roadmap.chapters)
  const split = (all ?? []).filter((c) => gameChapterOf(c) === gameChapter).length > 1;
  const chapterRe = split ? null : new RegExp(`\\bchapter\\s*${gameChapter}\\b`, "i");
  return sources.filter((s) => {
    if (s.kind !== "map") return false;
    if (chapterRe?.test(s.title)) return true;
    const title = new Set(mapWords(s.title));
    return wanted.some((ws) => ws.every((w) => title.has(w)));
  });
}

/**
 * A chapter's display title. The assembler writes "Chapter <n>: <title>", so a title that starts with
 * "Chapter N" is stripped of it (1984 and the 1985 Flash test printed "Chapter 1: Chapter 1: …"), and a
 * game chapter that the roadmap split or renumbered is named at the end.
 */
export function chapterTitle(c: Roadmap["chapters"][number]): string {
  const m = c.title.match(/^chapter\s+(\d+)\s*[:.\-–—]?\s*/i);
  const title = m ? c.title.slice(m[0].length) : c.title;
  const gc = c.game_chapter ?? (m ? Number(m[1]) : undefined);
  return gc && gc !== c.n ? `${title} (in-game Chapter ${gc})` : title;
}

/** First URL of a source (some list several pages). */
export const sourceUrl = (s: SourceEntry) => (Array.isArray(s.url) ? s.url[0] : s.url);

/** Running totals for a chapter's Cumulative 100% Checkpoint, computed from the roadmap (writers must not count by hand). */
export function checkpointTotals(r: Roadmap, n: number, achs: { id: number; points: number }[]) {
  const upTo = r.chapters.filter((c) => c.n <= n);
  const pts = new Map(achs.map((a) => [a.id, a.points]));
  const achIds = upTo.flatMap((c) => c.achievement_ids);
  const counters = Object.entries(r.counter_totals ?? {}).map(([name, total]) => ({
    name,
    done: upTo.reduce((s, c) => s + (c.counters?.[name] ?? 0), 0),
    total,
  }));
  return {
    achievements: achIds.length,
    achievements_total: achs.length,
    points: achIds.reduce((s, a) => s + (pts.get(a) ?? 0), 0),
    points_total: achs.reduce((s, a) => s + a.points, 0),
    counters,
  };
}

const NODE_KINDS = new Set(["area", "boss", "npc", "item", "key_item", "quest", "achievement", "missable", "ponr", "save_point"]);
const EDGE_KINDS = new Set(["leads_to", "requires", "unlocks", "contains", "missable_before"]);

export function usableFactIds(facts: VerifiedFact[]): Set<string> {
  return new Set(facts.filter((f) => ["verified", "single_source", "resolved"].includes(f.status)).map((f) => f.id));
}

export function validateGraph(g: Graph, usable: Set<string>, achIds: Set<number>): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  for (const n of g.nodes) {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(n.id)) errs.push(`node "${n.id}": id must be alphanumeric/underscore`);
    if (ids.has(n.id)) errs.push(`node "${n.id}": duplicate id`);
    ids.add(n.id);
    if (!NODE_KINDS.has(n.kind)) errs.push(`node "${n.id}": unknown kind ${n.kind}`);
    if (n.kind === "achievement") {
      if (!n.achievement_id || !achIds.has(Number(n.achievement_id))) errs.push(`node "${n.id}": achievement node needs a valid achievement_id`);
    } else {
      const fids = n.fact_ids ?? [];
      if (!fids.length) errs.push(`node "${n.id}": no supporting fact_ids (never invent nodes)`);
      for (const f of fids) if (!usable.has(f)) errs.push(`node "${n.id}": fact ${f} is missing, rejected or in conflict`);
    }
  }
  for (const e of g.edges) {
    const tag = `edge ${e.from}->${e.to}`;
    if (!ids.has(e.from)) errs.push(`${tag}: unknown from-node`);
    if (!ids.has(e.to)) errs.push(`${tag}: unknown to-node`);
    if (!EDGE_KINDS.has(e.kind)) errs.push(`${tag}: unknown kind ${e.kind}`);
    const fids = e.fact_ids ?? [];
    if (!fids.length) errs.push(`${tag}: no supporting fact_ids`);
    for (const f of fids) if (!usable.has(f)) errs.push(`${tag}: fact ${f} is missing, rejected or in conflict`);
  }
  return errs;
}

export function validateRoadmap(r: Roadmap, g: Graph, usable: Set<string>, achs: { id: number; title: string; type?: string | null }[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeIds = new Set(g.nodes.map((n) => n.id));
  const placed = new Map<number, number[]>();
  if (!Number.isInteger(r.playthroughs) || r.playthroughs < 1) errors.push("playthroughs must be an integer >= 1");
  if (r.format && !["command_steps", "prose"].includes(r.format)) errors.push(`unknown format "${r.format}" (must be "command_steps" or "prose")`);
  if (r.true_100_criteria) {
    if (!r.true_100_criteria.genre) errors.push("true_100_criteria: missing genre");
    if (!Array.isArray(r.true_100_criteria.categories) || !r.true_100_criteria.categories.length) {
      errors.push("true_100_criteria: categories must be a non-empty array");
    }
  }
  r.chapters.forEach((c, i) => {
    if (c.n !== i + 1) errors.push(`chapter ${c.n}: chapters must be numbered 1..N in order`);
    if (!c.title) errors.push(`chapter ${c.n}: missing title`);
    for (const a of c.areas) if (!nodeIds.has(a)) errors.push(`chapter ${c.n}: area "${a}" is not a graph node`);
    for (const f of c.fact_ids) if (!usable.has(f)) errors.push(`chapter ${c.n}: fact ${f} is missing, rejected or in conflict`);
    for (const a of c.achievement_ids) placed.set(a, [...(placed.get(a) ?? []), c.n]);
    if (!c.fact_ids.length) warnings.push(`chapter ${c.n}: no fact_ids assigned — writer will have nothing to work from`);
  });
  for (const a of achs) {
    const where = placed.get(a.id) ?? [];
    if (!where.length) errors.push(`achievement ${a.id} "${a.title}" is not assigned to any chapter`);
    if (where.length > 1) errors.push(`achievement ${a.id} "${a.title}" assigned to multiple chapters: ${where.join(", ")}`);
  }
  for (const id of placed.keys()) if (!achs.some((a) => a.id === id)) errors.push(`unknown achievement id ${id} in roadmap`);
  const maxCh = r.chapters.length;
  for (const m of r.missables) {
    if (m.chapter < 1 || m.chapter > maxCh) errors.push(`missable "${m.label}": bad chapter ${m.chapter}`);
    if (!m.fact_ids?.length) errors.push(`missable "${m.label}": needs fact_ids`);
    for (const f of m.fact_ids ?? []) if (!usable.has(f)) errors.push(`missable "${m.label}": fact ${f} unusable`);
  }
  for (const p of r.ponr) {
    if (p.chapter < 1 || p.chapter > maxCh) errors.push(`PONR "${p.label}": bad chapter ${p.chapter}`);
    if (!p.fact_ids?.length) errors.push(`PONR "${p.label}": needs fact_ids`);
    for (const f of p.fact_ids ?? []) if (!usable.has(f)) errors.push(`PONR "${p.label}": fact ${f} unusable`);
  }
  const totals = r.counter_totals ?? {};
  for (const c of r.chapters)
    for (const k of Object.keys(c.counters ?? {})) if (!(k in totals)) errors.push(`chapter ${c.n}: counter "${k}" is not in counter_totals`);
  for (const [k, total] of Object.entries(totals)) {
    const sum = r.chapters.reduce((s, c) => s + (c.counters?.[k] ?? 0), 0);
    if (sum !== total) errors.push(`counter "${k}": chapters add up to ${sum} but counter_totals says ${total}`);
  }
  for (const a of achs.filter((x) => x.type === "missable"))
    if (!r.missables.some((m) => Number(m.achievement_id) === a.id))
      errors.push(`achievement ${a.id} "${a.title}" is flagged missable by RA but not listed in roadmap.missables`);
  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Mermaid
// ---------------------------------------------------------------------------
// labels are always written inside quotes (edge labels too: "|(needs the prince)|" broke 1470's overview)
const esc = (s: string) => s.replace(/"/g, "'").replace(/[\[\]{}<>|]/g, " ").replace(/\s{2,}/g, " ").trim();
const shape = (n: GraphNode) => {
  const l = esc(n.label);
  switch (n.kind) {
    case "boss": return `${n.id}{{"⚔ ${l}"}}`;
    case "ponr": return `${n.id}>"⛔ ${l}"]`;
    case "achievement": return `${n.id}(["🏆 ${l}"])`;
    case "missable": return `${n.id}(["⚠ ${l}"])`;
    case "key_item":
    case "item": return `${n.id}[/"${l}"/]`;
    default: return `${n.id}["${l}"]`;
  }
};

/** Progression flow: areas, bosses, PONRs joined by leads_to edges. */
export function progressionMermaid(g: Graph, onlyNodes?: Set<string>): string {
  const keep = new Set(["area", "boss", "ponr", "save_point"]);
  let nodes = g.nodes.filter((n) => keep.has(n.kind));
  if (onlyNodes) nodes = nodes.filter((n) => onlyNodes.has(n.id));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = g.edges.filter((e) => e.kind === "leads_to" && ids.has(e.from) && ids.has(e.to));
  if (!nodes.length) return "";
  const out = ["flowchart TD", ...nodes.map((n) => `  ${shape(n)}`), ...edges.map((e) => `  ${e.from} -->${e.label ? `|"${esc(e.label)}"|` : ""} ${e.to}`)];
  out.push("  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;", "  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;");
  const p = nodes.filter((n) => n.kind === "ponr").map((n) => n.id);
  const b = nodes.filter((n) => n.kind === "boss").map((n) => n.id);
  if (p.length) out.push(`  class ${p.join(",")} ponr;`);
  if (b.length) out.push(`  class ${b.join(",")} boss;`);
  return out.join("\n");
}

/** Achievement dependency graph: requires / unlocks / missable_before edges touching achievements or missables. */
export function achievementMermaid(g: Graph, onlyNodes?: Set<string>): string {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const edges = g.edges.filter((e) => {
    if (!["requires", "unlocks", "missable_before"].includes(e.kind)) return false;
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) return false;
    if (onlyNodes && !(onlyNodes.has(a.id) || onlyNodes.has(b.id))) return false;
    return [a.kind, b.kind].some((k) => k === "achievement" || k === "missable");
  });
  if (!edges.length) return "";
  const used = new Set(edges.flatMap((e) => [e.from, e.to]));
  const arrow = (k: EdgeKind) => (k === "missable_before" ? "-.->|missable before|" : k === "requires" ? "-->|requires|" : "-->|unlocks|");
  return ["flowchart LR", ...[...used].map((id) => `  ${shape(byId.get(id)!)}`), ...edges.map((e) => `  ${e.from} ${arrow(e.kind)} ${e.to}`)].join("\n");
}

/** Chapter route: the chapter's areas plus their direct boss/ponr/achievement neighbours. */
export function chapterMermaid(g: Graph, areas: string[]): string {
  const set = new Set(areas);
  for (const e of g.edges) {
    if (set.has(e.from)) set.add(e.to);
  }
  // keep only neighbours that are bosses/ponr/save points, plus the chapter's own areas
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const keep = new Set([...set].filter((id) => areas.includes(id) || ["boss", "ponr", "save_point"].includes(byId.get(id)?.kind ?? "")));
  return progressionMermaid(g, keep);
}
