/**
 * Stages 6-7 gate: validate 06_graph.json and 07_roadmap.json, emit Mermaid.
 *
 *   npx tsx scripts/pipeline/plan-check.ts <gameId>
 */
import path from "node:path";
import { achievementMermaid, chapterMermaid, type Graph, progressionMermaid, type Roadmap, usableFactIds, validateGraph, validateRoadmap } from "./graph.ts";
import {
  type AchievementsFile,
  type Chunk,
  type VerifiedFact,
  canon,
  chunkProgress,
  keyTerms,
  loadAliases,
  compressRanges,
  exists,
  gameIdArg,
  loadFacts,
  loadSkipped,
  nextBatch,
  paths,
  readJson,
  readJsonl,
  readJsonOr,
  readText,
  requireFile,
  writeText,
} from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
requireFile(P.verified, "run rw:verify first");
requireFile(P.graph, "the route planner must write 06_graph.json");

const ach = readJson<AchievementsFile>(P.achievements);
const verified = readJson<{ stats: any; facts: VerifiedFact[] }>(P.verified);
if (verified.stats.conflict > 0) {
  console.error(`⛔ ${verified.stats.conflict} unresolved conflicts in 05_verified.json — resolve before planning.`);
  process.exit(2);
}
// Stage 4 gate: every chunk of every source (including ra-comments) must be processed before planning.
const { bySource, unprocessed } = chunkProgress(readJsonl<Chunk>(P.chunks), loadFacts(P.factsDir), loadSkipped(P.factsDir));
if (unprocessed.length) {
  console.error(`⛔ ${unprocessed.length} chunk(s) have not been processed (no fact cites them and they are not in 04_facts/_skipped.txt):`);
  for (const [s, v] of bySource) if (v.todo.length) console.error(`   ${s}: ${compressRanges(v.todo)}`);
  console.error(`Finish Stage 4 first (ra-fact-extractor skill). Next batch: ${nextBatch(id, bySource)}`);
  process.exit(2);
}
const usable = usableFactIds(verified.facts);
const graph = readJson<Graph>(P.graph);
const gErrs = validateGraph(graph, usable, new Set(ach.achievements.map((a) => a.id)));

let rErrs: string[] = [];
let rWarn: string[] = [];
let roadmap: Roadmap | null = null;
if (exists(P.roadmap)) {
  roadmap = readJson<Roadmap>(P.roadmap);
  ({ errors: rErrs, warnings: rWarn } = validateRoadmap(roadmap, graph, usable, ach.achievements));
  const unsupported = Object.entries((readJson<any>(P.verified)).coverage as Record<string, any>)
    .filter(([, c]) => c.best === "none")
    .map(([aid]) => Number(aid));
  const declared = new Set(roadmap.unverifiable_achievement_ids ?? []);
  for (const a of unsupported)
    if (!declared.has(a)) rErrs.push(`achievement ${a} has no supporting facts — add facts or list it in unverifiable_achievement_ids`);

  // Packet richness: chapter packets pull facts whose location matches an area label (via 05_aliases.json).
  // An area label no fact location matches gives the writer a thin packet, so catch it here, before writing.
  const aliases = loadAliases(P.aliases);
  // A one-word generic alias ("Cave", "Tunnel", "Ruins") folds every fact with that location into one place,
  // which also makes rw:verify count unrelated facts as corroboration (1985 Flash test: 100 -> 96 verified
  // once "Tunnel" and "Cave" were removed). Keep one only when the game has exactly one such place.
  const GENERIC_PLACE = /^(the )?(cave|caves|tunnel|tunnels|dungeon|room|floor|castle|tower|town|village|house|shop|inn|forest|woods|mountain|temple|shrine|island|ship|boss|area|level|stage|world|overworld|basement|cellar|hall|chamber|path|road|field|sea|ocean|lake|river|ruins|mine|mines|maze|bridge|entrance|exit)$/i;
  const generic = Object.entries(readJsonOr<Record<string, string[]>>(P.aliases, {})).flatMap(([c, l]) => l.filter((v) => GENERIC_PLACE.test(v.trim())).map((v) => `"${v}" -> "${c}"`));
  if (generic.length) rWarn.push(`05_aliases.json has one-word generic alias(es) that merge every fact with that location: ${generic.join(", ")} — use the guides' specific names, or keep one only if the game has a single such place`);
  const usableFacts = verified.facts.filter((f) => usable.has(f.id));
  const byLoc = new Map<string, number>();
  for (const f of usableFacts) if (f.location) byLoc.set(canon(aliases, f.location), (byLoc.get(canon(aliases, f.location)) ?? 0) + 1);
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const locLabels = [...new Set(usableFacts.map((f) => f.location).filter(Boolean) as string[])];
  for (const c of roadmap.chapters) {
    const unmatched: string[] = [];
    for (const a of c.areas) {
      const node = nodeById.get(a);
      if (!node || node.kind !== "area" || byLoc.get(canon(aliases, node.label))) continue;
      const terms = keyTerms(node.label);
      const near = locLabels
        .map((l) => ({ l, n: byLoc.get(canon(aliases, l)) ?? 0, hit: keyTerms(l).filter((w) => terms.includes(w)).length }))
        .filter((x) => x.hit > 0)
        .sort((x, y) => y.hit - x.hit || y.n - x.n)
        .slice(0, 3);
      unmatched.push(`"${node.label}"${near.length ? ` (similar: ${near.map((x) => `"${x.l}" ×${x.n}`).join(", ")})` : ""}`);
    }
    if (unmatched.length)
      rWarn.push(`chapter ${c.n}: ${unmatched.length} area label(s) match no fact location, so the packet misses those areas' facts — use the guides' location name as the label or add aliases to 05_aliases.json: ${unmatched.join("; ")}`);
  }

  // Achievement placement: an achievement whose supporting facts all sit in areas of OTHER chapters is probably in the wrong chapter
  const chapterOfLabel = new Map<string, number>();
  for (const c of roadmap.chapters) for (const a of c.areas) { const l = nodeById.get(a)?.label; if (l && !chapterOfLabel.has(canon(aliases, l))) chapterOfLabel.set(canon(aliases, l), c.n); }
  const cov = (readJson<any>(P.verified)).coverage as Record<string, { facts: string[] }>;
  const factById = new Map(usableFacts.map((f) => [f.id, f]));
  for (const c of roadmap.chapters)
    for (const aid of c.achievement_ids) {
      const chs = (cov[aid]?.facts ?? []).map((fid) => chapterOfLabel.get(canon(aliases, factById.get(fid)?.location))).filter((x): x is number => x !== undefined);
      if (chs.length && !chs.includes(c.n)) rWarn.push(`achievement ${aid} is planned in chapter ${c.n}, but its facts are located in chapter(s) ${[...new Set(chs)].join(", ")} — check the placement`);
    }

  // Mutual-exclusion and lockout check against ra-comments
  const raCommentsFile = path.join(P.sourcesDir, "ra-comments.txt");
  if (exists(raCommentsFile) && roadmap.playthroughs === 1) {
    const commentsText = readText(raCommentsFile).toLowerCase();
    const lockoutMatch = commentsText.match(/\b(incompatible|locks out|locked out|redo chapter|second playthrough|another playthrough)\b/);
    if (lockoutMatch) {
      const notes = (roadmap.playthrough_notes || "").toLowerCase();
      const mentionsResolution = /incompat|lockout|mutually exclusive|conflict|chapter replay|second phase|two phase|redo chapter/i.test(notes);
      if (!mentionsResolution) {
        rWarn.push(`ra-comments mentions potential lockout keyword ("${lockoutMatch[1]}") but roadmap specifies playthroughs: 1 and playthrough_notes does not explain how mutual exclusion is handled`);
      }
    }
  }
} else {
  rWarn.push("07_roadmap.json not written yet");
}

// Mermaid output (even when there are errors, to help debugging)
const md: string[] = [`# Knowledge graph — game ${id}`, "", `Nodes: ${graph.nodes.length} · Edges: ${graph.edges.length}`, ""];
const prog = progressionMermaid(graph);
if (prog) md.push("## Progression flow", "", "```mermaid", prog, "```", "");
const deps = achievementMermaid(graph);
if (deps) md.push("## Achievement dependencies", "", "```mermaid", deps, "```", "");
if (roadmap)
  for (const c of roadmap.chapters) {
    const m = chapterMermaid(graph, c.areas);
    if (m) md.push(`## Chapter ${c.n}: ${c.title}`, "", "```mermaid", m, "```", "");
  }
writeText(P.graphMermaid, md.join("\n"));

console.log(`Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges -> Mermaid in ${path.relative(P.root, P.graphMermaid)}`);
if (roadmap) console.log(`Roadmap: ${roadmap.chapters.length} chapters, ${roadmap.missables.length} missables, ${roadmap.ponr.length} PONRs, playthroughs: ${roadmap.playthroughs}`);
for (const w of rWarn) console.log(`  ⚠ ${w}`);
const errs = [...gErrs.map((e) => `graph: ${e}`), ...rErrs.map((e) => `roadmap: ${e}`)];
if (errs.length) {
  console.log(`\n❌ ${errs.length} error(s):`);
  for (const e of errs.slice(0, 60)) console.log(`  - ${e}`);
  if (errs.length > 60) console.log(`  … and ${errs.length - 60} more`);
  process.exit(1);
}
console.log("\n✅ Graph and roadmap are valid. Next: npm run rw:packet -- " + id + " overview  (then 1..N)");
