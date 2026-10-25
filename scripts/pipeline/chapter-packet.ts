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
import { chapterMaps, chapterMermaid, chapterTitle, checkpointTotals, duplicateMap, packetFactIds, sourceUrl, type Graph, type Roadmap } from "./graph.ts";
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
  readUsedSources,
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
const sources = readUsedSources(P.sourcesManifest);
const usable = verified.facts.filter((f) => ["verified", "single_source", "resolved"].includes(f.status));
const factById = new Map(usable.map((f) => [f.id, f]));
const achById = new Map(ach.achievements.map((a) => [a.id, a]));
const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
const badge = (s: string) => (s === "verified" ? "✅" : s === "resolved" ? "✔" : "🟡");

const packetIds = packetFactIds(roadmap, graph, usable, (s) => canon(aliases, s), duplicateMap(verified.facts));
const factIds = new Set<string>();
// Questions no source answers: the writer must call them unconfirmed and follow the safe guidance,
// never recommend the risky option (593: a chapter told players to use a power-up code on the V.Hard run).
const openQuestions = (n: number | null): string[] => {
  const qs = (roadmap.open_questions ?? []).filter((q) => n === null || !q.chapters?.length || q.chapters.includes(n));
  if (!qs.length) return [];
  return [
    "## ❓ Open questions (no collected source answers these)", "",
    "Say each one is unconfirmed where it matters, follow its guidance, and never recommend the option it warns against (not even as a tip or a fallback).", "",
    ...qs.map((q) => `- **${q.question}** — ${q.guidance}`), "",
  ];
};

const lines: string[] = [];
let title: string;
let outName: string;
let chapterAch: number[] = [];

if (which === "overview") {
  title = `${ach.title} — Overview packet`;
  outName = "00_overview.md";
  packetIds.overview.forEach((f) => factIds.add(f));
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
    ...roadmap.chapters.map((c) => `- Chapter ${c.n}: ${chapterTitle(c)} (${c.achievement_ids.length} achievements)`), "",
    ...openQuestions(null),
  );
} else {
  const n = Number(which);
  const ch = roadmap.chapters.find((c) => c.n === n);
  if (!ch) {
    console.error(`Chapter ${which} not in roadmap (1..${roadmap.chapters.length})`);
    process.exit(1);
  }
  title = `Chapter ${ch.n}: ${chapterTitle(ch)}`;
  outName = chapterFile(ch.n);
  chapterAch = ch.achievement_ids;
  // roadmap facts, achievement facts, graph area + neighbour facts, location matches, missables/PONRs,
  // and unlocated facts that follow their chunk (packetFactIds in graph.ts)
  packetIds.chapters.get(n)!.forEach((f) => factIds.add(f));
  const missables = roadmap.missables.filter((m) => m.chapter === n);
  const ponrs = roadmap.ponr.filter((p) => p.chapter === n);

  const prev = roadmap.chapters.find((c) => c.n === n - 1);
  const next = roadmap.chapters.find((c) => c.n === n + 1);
  lines.push(
    `# Writer packet — ${title}`, "",
    `Write \`08_chapters/${outName}\`. Previous chapter: ${prev ? `${prev.n}. ${chapterTitle(prev)}` : "(start of game)"}. Next chapter: ${next ? `${next.n}. ${chapterTitle(next)}` : "(end of game)"}.`,
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
  lines.push(...openQuestions(n));
  if (missables.length) lines.push("## ⚠ Missables in this chapter (each needs a `> [!WARNING]` BEFORE the point it can be missed)", "", ...missables.map((m) => `- ${m.label}${m.achievement_id ? ` (achievement ${m.achievement_id})` : ""} — deadline: ${m.deadline} [${m.fact_ids.join(", ")}]`), "");
  if (ponrs.length) lines.push("## ⛔ Points of no return in this chapter (each needs a `> [!CAUTION]` containing the words \"Point of No Return\"; write no others)", "", ...ponrs.map((p) => `- ${p.label}: ${p.warning} [${p.fact_ids.join(", ")}]`), "");
  else lines.push("## ⛔ Points of no return in this chapter", "", "None. Do not write any \"Point of No Return\" callout. To remind the player to finish an area before moving on, use a `> [!TIP]` (\"Before you leave …\").", "");
  const maps = chapterMaps(sources, graph, ch, aliases, roadmap.chapters);
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
  const numbered = Object.entries(ch.collectibles ?? {}).filter(([, nums]) => nums.length);
  const elsewhere = roadmap.chapters.some((c) => c.n !== n && Object.keys(c.collectibles ?? {}).length);
  if (numbered.length || elsewhere)
    lines.push(
      "## Numbered collectibles collected in THIS chapter (the guides' numbering)", "",
      ...(numbered.length ? numbered.map(([k, nums]) => `- ${k}: ${nums.map((x) => `#${x}`).join(", ")}`) : ["- none"]),
      "",
      "Route the player to these numbers only. Every other number belongs to another chapter: never send the player after it again; at most say which chapter collects it. `rw:qa` checks this.", "",
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
// Identify the primary walkthrough (same rule as extract-facts.ts: "primary": true, else largest guide).
// Essential passages: all cited chunks from the primary guide, checklists, ra-guide/ra-comments, any chunk with
// an ASCII map, and any secondary-guide chunk that backs a fact not already present in the primary guide.
// Secondary-guide chunks whose facts are all already corroborated by the primary guide (and have no ASCII map)
// already have their verbatim quotes inline in "Usable facts" above, and secondary neighbour chunks often bleed
// into adjacent chapters; skipping those redundant raw chunks cuts packet size ~25-40% without losing any fact.
// Set RW_FULL_PASSAGES=1 to include all secondary chunks and neighbours up to the cap.
const guides = sources.filter((s) => s.kind === "guide");
const primaryGuide = (guides.find((s) => (s as SourceEntry & { primary?: boolean }).primary) ?? [...guides].sort((a, b) => (b.chars ?? 0) - (a.chars ?? 0))[0])?.id;
const sourceById = new Map(sources.map((s) => [s.id, s]));
const fullPassages = process.env.RW_FULL_PASSAGES === "1";

const primary = new Set<string>();
const uniqueSecondaryChunks = new Set<string>();
for (const f of facts) {
  const backedByPrimary = Boolean(primaryGuide && f.sources.includes(primaryGuide));
  for (const e of f.evidence) {
    primary.add(e.chunk_id);
    if (!backedByPrimary || f.type === "boss" || f.type === "missable" || f.type === "ponr") {
      uniqueSecondaryChunks.add(e.chunk_id);
    }
  }
}
const isEssentialChunk = (c: Chunk): boolean => {
  if (fullPassages || !primaryGuide) return true;
  if (c.source_id === primaryGuide || c.has_ascii_map) return true;
  const s = sourceById.get(c.source_id);
  if (s?.kind === "checklist" || /^checklist/i.test(c.source_id) || c.source_id === "ra-guide" || c.source_id === "ra-comments") return true;
  return uniqueSecondaryChunks.has(c.chunk_id);
};
const neighbours = new Set<string>();
for (const cid of primary) {
  const c = chunks.get(cid);
  if (!c) continue;
  // Context neighbours are only pulled for the primary guide (unless RW_FULL_PASSAGES=1) so secondary guides
  // do not bleed adjacent chapters' collectibles into this chapter's packet.
  if (!fullPassages && primaryGuide && c.source_id !== primaryGuide) continue;
  if (c.prev && !primary.has(c.prev)) neighbours.add(c.prev);
  if (c.next && !primary.has(c.next)) neighbours.add(c.next);
}
const srcRank = (c: Chunk) => (c.has_ascii_map ? 0 : c.source_id === primaryGuide ? 1 : 2);
const priorityOrder = (a: Chunk, b: Chunk) => srcRank(a) - srcRank(b) || a.source_id.localeCompare(b.source_id) || a.n - b.n;
const order = (a: Chunk, b: Chunk) => a.source_id.localeCompare(b.source_id) || a.n - b.n;
const allPrim = [...primary].map((c) => chunks.get(c)).filter(Boolean) as Chunk[];
const prim = allPrim.filter(isEssentialChunk);
const skippedRedundant = allPrim.length - prim.length;
const neigh = [...neighbours].map((c) => chunks.get(c)).filter(Boolean) as Chunk[];
// the overview is a ~2,000-word summary (the assembler builds its tables), so it gets far fewer passages
const passageCap = which === "overview" ? Math.min(MAX_PASSAGE_CHARS, OVERVIEW_PASSAGE_CHARS) : MAX_PASSAGE_CHARS;
let budget = passageCap;
const chosen: { c: Chunk; neighbour: boolean }[] = [];
for (const c of prim.sort(priorityOrder)) if (budget - c.text.length > 0) { chosen.push({ c, neighbour: false }); budget -= c.text.length; }
for (const c of neigh.sort(priorityOrder)) if (budget - c.text.length > 0) { chosen.push({ c, neighbour: true }); budget -= c.text.length; }
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
console.log(`  ${facts.length} facts, ${chosen.length} source chunks (${passageCap - budget} chars)${skippedRedundant ? `, ${skippedRedundant} redundant secondary chunk(s) omitted (quotes inline)` : ""}${dropped ? `, ${dropped} chunks omitted for size` : ""}`);
if (chapterAch.length) console.log(`  ${chapterAch.length} achievements to place`);
// thin packets mean the writer has nothing to route with (usually graph labels that match no fact location — fix 05_aliases.json)
if (which !== "overview" && facts.length < 40) console.log(`  ⚠ only ${facts.length} facts — check that the chapter's area labels match fact locations (npm run rw:plan -- ${id} lists unmatched areas)`);
console.log(`  -> ${path.relative(P.root, out)}`);
