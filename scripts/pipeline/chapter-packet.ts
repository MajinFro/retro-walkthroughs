/**
 * Stage 8 support - build a self-contained "writer packet" for one chapter.
 *
 *   npx tsx scripts/pipeline/chapter-packet.ts <gameId> <chapterN|overview>
 *
 * The packet contains ONLY:
 *   - the roadmap entry for the chapter (achievements, missables, PONRs)
 *   - the usable facts relevant to the chapter (with status + verbatim quotes)
 *   - the full source passages those facts came from (+ neighbouring chunks)
 * The writer must not use anything outside the packet.
 */
import path from "node:path";
import { chapterMaps, chapterMermaid, checkpointTotals, sourceUrl, type Graph, type Roadmap } from "./graph.ts";
import {
  type AchievementsFile,
  type Chunk,
  type SourceEntry,
  exists,
  type VerifiedFact,
  canon,
  chapterFile,
  gameIdArg,
  loadAliases,
  loadChunks,
  paths,
  readJson,
  requireFile,
  writeText,
} from "./lib.ts";

// 80k cut the first writing call ~18% on Spyro, but 4/4 test chapters then needed a repair call
// (vs 6/13 at 160k), so it saved nothing overall. RW_PASSAGE_CHARS overrides.
const MAX_PASSAGE_CHARS = Number(process.env.RW_PASSAGE_CHARS) || 160_000;
const OVERVIEW_PASSAGE_CHARS = 40_000;

const id = gameIdArg();
const which = process.argv[3];
if (!which) {
  console.error("Usage: chapter-packet.ts <gameId> <chapterN|overview>");
  process.exit(1);
}
const P = paths(id);
for (const [f, h] of [[P.verified, "rw:verify"], [P.graph, "route planner"], [P.roadmap, "route planner"]] as const) requireFile(f, h);

const ach = readJson<AchievementsFile>(P.achievements);
const verified = readJson<{ facts: VerifiedFact[]; coverage: Record<string, any> }>(P.verified);
const graph = readJson<Graph>(P.graph);
const roadmap = readJson<Roadmap>(P.roadmap);
const chunks = loadChunks(P.chunks);
const aliases = loadAliases(P.aliases);
const sources = exists(P.sourcesManifest) ? readJson<SourceEntry[]>(P.sourcesManifest) : [];
const usable = verified.facts.filter((f) => ["verified", "single_source", "resolved"].includes(f.status));
const factById = new Map(usable.map((f) => [f.id, f]));
const achById = new Map(ach.achievements.map((a) => [a.id, a]));
const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
const badge = (s: string) => (s === "verified" ? "✅" : s === "resolved" ? "✔" : "🟡");

const factIds = new Set<string>();
const lines: string[] = [];
let title: string;
let outName: string;
let chapterAch: number[] = [];

if (which === "overview") {
  title = `${ach.title} — Overview packet`;
  outName = "00_overview.md";
  (roadmap.fact_ids ?? []).forEach((f) => factIds.add(f));
  roadmap.missables.forEach((m) => m.fact_ids.forEach((f) => factIds.add(f)));
  roadmap.ponr.forEach((p) => p.fact_ids.forEach((f) => factIds.add(f)));
  usable.filter((f) => f.type === "mechanic").forEach((f) => factIds.add(f.id));
  lines.push(
    `# ${title}`, "",
    "Write `08_chapters/00_overview.md`: **Game Overview** (premise, controls/mechanics a first-timer needs, how RetroAchievements/hardcore applies) and a plain-language explanation of the 100% plan.",
    "The assembler auto-generates the roadmap tables, missables summary, PONR summary, Mermaid diagrams and checklists — do NOT duplicate those.", "",
    "## Game", "",
    `- Title: ${ach.title}`, `- Console: ${ach.console}`, `- Developer: ${ach.developer ?? "?"}`, `- Publisher: ${ach.publisher ?? "?"}`, `- Genre: ${ach.genre ?? "?"}`, `- Released: ${ach.released ?? "?"}`,
    `- Achievements: ${ach.achievements.length} (${ach.achievements.reduce((s, a) => s + a.points, 0)} points)`, "",
    "## Roadmap (authoritative)", "",
    `- Playthroughs required: **${roadmap.playthroughs}** — ${roadmap.playthrough_notes}`,
    roadmap.settings_notes ? `- Settings: ${roadmap.settings_notes}` : "",
    ...roadmap.chapters.map((c) => `- Chapter ${c.n}: ${c.title} (${c.achievement_ids.length} achievements)`), "",
  );
} else {
  const n = Number(which);
  const ch = roadmap.chapters.find((c) => c.n === n);
  if (!ch) {
    console.error(`Chapter ${which} not in roadmap (1..${roadmap.chapters.length})`);
    process.exit(1);
  }
  title = `Chapter ${ch.n}: ${ch.title}`;
  outName = chapterFile(ch.n);
  chapterAch = ch.achievement_ids;
  ch.fact_ids.forEach((f) => factIds.add(f));
  // facts linked to chapter achievements
  for (const f of usable) if ((f.achievement_ids ?? []).some((a) => chapterAch.includes(Number(a)))) factIds.add(f.id);
  // facts behind the chapter's graph nodes and their direct neighbours
  const areaSet = new Set(ch.areas);
  const neigh = new Set(ch.areas);
  for (const e of graph.edges) if (areaSet.has(e.from) || areaSet.has(e.to)) {
    neigh.add(e.from);
    neigh.add(e.to);
    (e.fact_ids ?? []).forEach((f) => factIds.add(f));
  }
  for (const nid of neigh) (nodeById.get(nid)?.fact_ids ?? []).forEach((f) => factIds.add(f));
  // facts whose location matches one of the chapter's area labels
  const areaLabels = new Set(ch.areas.map((a) => canon(aliases, nodeById.get(a)?.label)));
  for (const f of usable) if (f.location && areaLabels.has(canon(aliases, f.location))) factIds.add(f.id);
  const missables = roadmap.missables.filter((m) => m.chapter === n);
  const ponrs = roadmap.ponr.filter((p) => p.chapter === n);
  missables.forEach((m) => m.fact_ids.forEach((f) => factIds.add(f)));
  ponrs.forEach((p) => p.fact_ids.forEach((f) => factIds.add(f)));

  const prev = roadmap.chapters.find((c) => c.n === n - 1);
  const next = roadmap.chapters.find((c) => c.n === n + 1);
  lines.push(
    `# Writer packet — ${title}`, "",
    `Write \`08_chapters/${outName}\`. Previous chapter: ${prev ? `${prev.n}. ${prev.title}` : "(start of game)"}. Next chapter: ${next ? `${next.n}. ${next.title}` : "(end of game)"}.`,
    ch.notes ? `Planner notes: ${ch.notes}` : "", "",
    "## Areas in this chapter (in order)", "",
    ...ch.areas.map((a) => `- \`${a}\` — ${nodeById.get(a)?.label ?? a}`), "",
    "## Achievements to place in this chapter (each EXACTLY once as `[ACHIEVEMENT:<id>]`)", "",
    ...chapterAch.map((aid) => {
      const a = achById.get(aid)!;
      const cov = verified.coverage[aid];
      const support = cov?.facts?.length ? `supporting facts: ${cov.facts.join(", ")}` : "**NO supporting facts → write \"Unable to verify from collected sources.\" for the method**";
      return `- **${aid}** — ${a.title} (${a.points} pts${a.type ? `, ${a.type}` : ""}): ${a.description}  \n  ${support}`;
    }), "",
  );
  if (missables.length) lines.push("## ⚠ Missables in this chapter (each needs a `> [!WARNING]` BEFORE the point it can be missed)", "", ...missables.map((m) => `- ${m.label}${m.achievement_id ? ` (achievement ${m.achievement_id})` : ""} — deadline: ${m.deadline} [${m.fact_ids.join(", ")}]`), "");
  if (ponrs.length) lines.push("## ⛔ Points of no return in this chapter (each needs a `> [!CAUTION]` containing the words \"Point of No Return\"; write no others)", "", ...ponrs.map((p) => `- ${p.label}: ${p.warning} [${p.fact_ids.join(", ")}]`), "");
  else lines.push("## ⛔ Points of no return in this chapter", "", "None. Do not write any \"Point of No Return\" callout. To remind the player to finish an area before moving on, use a `> [!TIP]` (\"Before you leave …\").", "");
  const maps = chapterMaps(sources, graph, ch, aliases);
  if (maps.length)
    lines.push(
      "## Visual maps for this chapter (link EACH one directly under the heading of the area it shows; `rw:qa` checks every URL)", "",
      ...maps.map((s) => `- 🗺️ **Map:** [View ${s.title}${s.author ? ` by ${s.author}` : ""}](${sourceUrl(s)})`), "",
    );
  const mm = chapterMermaid(graph, ch.areas);
  if (mm) lines.push("## Route diagram (inserted automatically where you write `[MERMAID]`)", "", "```mermaid", mm, "```", "");
  const t = checkpointTotals(roadmap, n, ach.achievements);
  lines.push(
    "## Cumulative checkpoint totals (use EXACTLY these numbers in this chapter's `> [!IMPORTANT]` checkpoint; never write notes about other chapters' files)", "",
    `- RetroAchievements Unlocked: ${t.achievements} / ${t.achievements_total} (${t.points} / ${t.points_total} points)`,
    ...t.counters.map((c) => `- ${c.name}: ${c.done} / ${c.total}`), "",
  );
}

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------
const facts = [...factIds].map((f) => factById.get(f)).filter(Boolean) as VerifiedFact[];
facts.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

// ---------------------------------------------------------------------------
// Source passages (the detail-preserving part) — chosen first, so fact lines can point to them
// ---------------------------------------------------------------------------
const primary = new Set<string>();
for (const f of facts) for (const e of f.evidence) primary.add(e.chunk_id);
const neighbours = new Set<string>();
for (const cid of primary) {
  const c = chunks.get(cid);
  if (!c) continue;
  if (c.prev && !primary.has(c.prev)) neighbours.add(c.prev);
  if (c.next && !primary.has(c.next)) neighbours.add(c.next);
}
const order = (a: Chunk, b: Chunk) => a.source_id.localeCompare(b.source_id) || a.n - b.n;
const prim = [...primary].map((c) => chunks.get(c)).filter(Boolean) as Chunk[];
const neigh = [...neighbours].map((c) => chunks.get(c)).filter(Boolean) as Chunk[];
// the overview is a ~2,000-word summary (the assembler builds its tables), so it gets far fewer passages
const passageCap = which === "overview" ? Math.min(MAX_PASSAGE_CHARS, OVERVIEW_PASSAGE_CHARS) : MAX_PASSAGE_CHARS;
let budget = passageCap;
const chosen: { c: Chunk; neighbour: boolean }[] = [];
for (const c of prim.sort(order)) if (budget - c.text.length > 0) { chosen.push({ c, neighbour: false }); budget -= c.text.length; }
for (const c of neigh.sort(order)) if (budget - c.text.length > 0) { chosen.push({ c, neighbour: true }); budget -= c.text.length; }
const dropped = prim.length + neigh.length - chosen.length;
chosen.sort((a, b) => order(a.c, b.c));

// Opt-in (RW_PACKET_DEDUPE=1): a quote whose chunk is printed below is replaced by a pointer to it.
// Off by default: on Spyro it cut first writing calls 7-10%, but chapter 5 then used 11% fewer facts
// (308 vs 348; chapter 8 unchanged), and a 0.15M-token saving per game is not worth that risk.
const dedupe = process.env.RW_PACKET_DEDUPE === "1" && process.env.RW_PACKET_QUOTES !== "1";
const inPassages = new Set(dedupe ? chosen.map((x) => x.c.chunk_id) : []);
lines.push(`## Usable facts (${facts.length}) — cite as [[fact-id]]`, "", `Legend: ✅ verified (2+ sources) · ✔ conflict resolved · 🟡 single source${dedupe ? ". `evidence: gf1#9 ↓` = the supporting quote is in that source passage below." : ""}`, "");
for (const f of facts) {
  const ev = f.evidence.filter((e) => e.stance !== "contradicts").map((e) => (inPassages.has(e.chunk_id) ? `${e.chunk_id} ↓` : `${e.chunk_id}: "${e.quote}"`)).join(" | ");
  const extra = [f.location ? `@${f.location}` : "", f.requires?.length ? `requires: ${f.requires.join("; ")}` : "", f.achievement_ids?.length ? `ach: ${f.achievement_ids.join(",")}` : "", f.missable ? "MISSABLE" : ""].filter(Boolean).join(" · ");
  lines.push(`- ${badge(f.status)} **${f.id}** (${f.type}) ${f.text}${extra ? ` — ${extra}` : ""}  \n  evidence: ${ev}`);
}
lines.push("");

lines.push(
  `## Source passages (${chosen.length} chunks${dropped ? `, ${dropped} omitted for size — use \`npm run rw:chunks -- ${id} --id <chunk>\`` : ""})`, "",
  "Use these for detail (directions, chest contents, enemy names, boss patterns, ASCII maps). Every statement you take from a passage must cite a fact id; if no fact covers a detail you need, add a fact to `04_facts/` first (with a verbatim quote) and re-run `rw:verify`.", "",
);
for (const { c, neighbour } of chosen) {
  lines.push(`### ${c.chunk_id} — ${c.site}: ${c.source_title} — [${c.section}]${neighbour ? " (context neighbour)" : ""}${c.has_ascii_map ? " — contains ASCII map (copy verbatim if used)" : ""}`, "", "```text", c.text.replace(/```/g, "'''"), "```", "");
}

const out = path.join(P.packetsDir, outName);
writeText(out, lines.filter((l) => l !== undefined).join("\n"));
console.log(`Packet: ${title}`);
console.log(`  ${facts.length} facts, ${chosen.length} source chunks (${passageCap - budget} chars)${dropped ? `, ${dropped} chunks omitted for size` : ""}`);
if (chapterAch.length) console.log(`  ${chapterAch.length} achievements to place`);
// thin packets mean the writer has nothing to route with (usually graph labels that match no fact location — fix 05_aliases.json)
if (which !== "overview" && facts.length < 40) console.log(`  ⚠ only ${facts.length} facts — check that the chapter's area labels match fact locations (npm run rw:plan -- ${id} lists unmatched areas)`);
console.log(`  -> ${path.relative(P.root, out)}`);
