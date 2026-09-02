/**
 * Stages 6-7 gate: validate 06_graph.json and 07_roadmap.json, emit Mermaid.
 *
 *   npx tsx scripts/pipeline/plan-check.ts <gameId>
 */
import path from "node:path";
import { achievementMermaid, chapterMermaid, type Graph, progressionMermaid, type Roadmap, usableFactIds, validateGraph, validateRoadmap } from "./graph.ts";
import { type AchievementsFile, type VerifiedFact, exists, gameIdArg, paths, readJson, readText, requireFile, writeText } from "./lib.ts";

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
