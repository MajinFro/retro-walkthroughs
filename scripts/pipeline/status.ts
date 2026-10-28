/**
 * Pipeline status / resume helper.
 *
 *   npx tsx scripts/pipeline/status.ts <gameId>
 *
 * Prints which stages are complete and the exact next action.
 */
import path from "node:path";
import { type Graph, type Roadmap, usableFactIds, validateGraph, validateRoadmap } from "./graph.ts";
import {
  CITE_RE,
  type AchievementsFile,
  type Chunk,
  isSubstantiveGuide,
  isUsedSource,
  pendingSourceDecisions,
  lateAdditions,
  MIN_GUIDES,
  type SourceEntry,
  type VerifiedFact,
  chapterFile,
  chapterInputFiles,
  chunkProgress,
  exists,
  fingerprintFiles,
  gameIdArg,
  loadFacts,
  loadSkipped,
  paths,
  qaInputFiles,
  verifyInputFiles,
  readJson,
  readJsonl,
  readText,
  readActivity,
  fmtDuration,
  type ActivityRow,
} from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
const rows: [string, string, string][] = [];
let next = "";
const setNext = (s: string) => { if (!next) next = s; };

// 1
if (exists(P.achievements)) {
  const a = readJson<any>(P.achievements);
  rows.push(["1 Achievements", "✅", `${a.achievements.length} achievements — ${a.title}`]);
} else { rows.push(["1 Achievements", "⬜", ""]); setNext(`npm run rw:fetch -- ${id}`); }

// 2
const allSources = exists(P.sourcesManifest) ? readJson<SourceEntry[]>(P.sourcesManifest) : [];
const sources = allSources.filter(isUsedSource);
const guides = sources.filter(isSubstantiveGuide);
const extras = sources.filter((s) => !isSubstantiveGuide(s) && s.kind !== "ra-comments" && s.kind !== "map").map((s) => s.id);
const mapCount = sources.filter((s) => s.kind === "map").length;
const held = allSources.filter((s) => !isUsedSource(s));
const pending = pendingSourceDecisions(allSources);
rows.push(["2 Sources", pending.length ? "🟡" : guides.length >= MIN_GUIDES ? "✅" : guides.length || extras.length ? "🟡" : "⬜", `${guides.length} substantive guide(s): ${guides.map((s) => s.id).join(", ") || "—"}${guides.length < MIN_GUIDES ? ` (need ${MIN_GUIDES}+)` : ""}${extras.length ? ` · extras (not counted): ${extras.join(", ")}` : ""}${mapCount ? ` · ${mapCount} map(s)` : ""}${held.length ? ` · held (not used): ${held.map((s) => `${s.id} [${s.platform?.match ?? "?"}${s.decision ? `, ${s.decision}` : ""}]`).join(", ")}` : ""}`]);
// Guides for another console, or for several versions, are saved but not used until the user decides.
if (pending.length)
  setNext(
    `Ask the user about held guide(s) (not for this game's console only): ${pending.map((s) => `${s.id} "${s.title}" [${s.platform?.match}: ${Object.entries(s.platform?.counts ?? {}).map(([k, n]) => `${k} ${n}`).join(", ")}]`).join("; ")} — then npm run rw:collect -- ${id} --id <sourceId> --approve (use it) or --decline (keep it unused)`,
  );
// blocks every later stage: the RA guide and comments from rw:fetch are extras and never stand in for guides.
// The only way past with fewer guides: Stage 2 searched and wrote why in _fewer_guides.txt.
const fewerOk = guides.length > 0 && exists(path.join(P.sourcesDir, "_fewer_guides.txt"));
if (fewerOk && guides.length < MIN_GUIDES) rows[rows.length - 1][2] += " · fewer accepted (_fewer_guides.txt)";
if (guides.length < MIN_GUIDES && !fewerOk) setNext(guides.length || extras.length
  ? `Collect more sources (ra-source-collector skill): ${guides.length} of ${MIN_GUIDES} substantive guides (10k+ chars; the RA guide, maps and short pages don't count)`
  : "Collect sources (ra-source-collector skill): npm run rw:collect -- " + id + " <url> --id gf1 --site GameFAQs --title \"...\"");
// achievements added after the original set: say so up front, so Stage 2 searches for them and any
// "no source exists" decision reaches the user once, early, instead of after verification
const late = exists(P.achievements) ? lateAdditions(readJson<AchievementsFile>(P.achievements).achievements) : null;
const lateNote = late ? `${late.ids.length} achievement(s) added in a later set revision (from ${late.since}): ${late.ids.join(", ")} — guides for the original set may not cover them; Stage 2 should look for sources on them specifically` : "";

// 3
const chunks = exists(P.chunks) ? readJsonl<Chunk>(P.chunks) : [];
const chunkSrcs = new Set(chunks.map((c) => c.source_id));
const stale = sources.some((s) => !chunkSrcs.has(s.id));
rows.push(["3 Chunks", chunks.length && !stale ? "✅" : chunks.length ? "🟡" : "⬜", chunks.length ? `${chunks.length} chunks${stale ? " — new sources not chunked yet" : ""}` : ""]);
if (!chunks.length || stale) setNext(`npm run rw:chunk -- ${id}`);

// 4
const facts = loadFacts(P.factsDir);
const { bySource, unprocessed } = chunkProgress(chunks, facts, loadSkipped(P.factsDir));
const sum = (pick: (src: string) => boolean, key: "done" | "total") =>
  [...bySource].filter(([s]) => pick(s)).reduce((n, [, v]) => n + v[key], 0);
const isRa = (s: string) => s === "ra-comments";
const doneAll = chunks.length - unprocessed.length;
const pct4 = chunks.length ? Math.floor((doneAll / chunks.length) * 100) : 0;
rows.push([
  "4 Facts",
  chunks.length && !unprocessed.length ? "✅" : facts.length ? "🟡" : "⬜",
  `${facts.length} facts · guide chunks ${sum((s) => !isRa(s), "done")}/${sum((s) => !isRa(s), "total")} · RA comments ${sum(isRa, "done")}/${sum(isRa, "total")} (${pct4}%)${unprocessed.length ? ` — ${unprocessed.length} chunk(s) unprocessed, 100% required` : ""}`,
]);
if (unprocessed.length) setNext(`npm run rw:extract -- ${id}  then  npm run rw:verify -- ${id}  (${unprocessed.length} chunk(s) left; re-run rw:extract until none remain)`);

// 5
if (exists(P.verified)) {
  const v = readJson<any>(P.verified);
  const s = v.stats;
  // stale when the fact files no longer match the fingerprint rw:verify recorded (older files carry none)
  const newer = Boolean(v.inputs && v.inputs !== fingerprintFiles(verifyInputFiles(P)));
  rows.push(["5 Verify", s.conflict ? "⛔" : newer ? "🟡" : "✅", `✅${s.verified} 🟡${s.single_source} ⚠${s.conflict} ✔${s.resolved} ❌${s.rejected}${s.duplicate ? ` ⧉${s.duplicate}` : ""} · ach unsupported: ${s.achievements_unsupported}${newer ? " (facts changed — re-run)" : ""}`]);
  if (s.conflict) setNext(`Resolve ${s.conflict} conflict(s) (ra-fact-verifier skill: resolve conflicts in 05_resolutions.json), then npm run rw:verify -- ${id}`);
  else if (newer) setNext(`npm run rw:verify -- ${id}  (fact files changed since the last run)`);
} else { rows.push(["5 Verify", "⬜", ""]); setNext(`npm run rw:verify -- ${id}`); }

// Downstream artifacts are only valid if they still match the current verified facts and the files they were built from.
const verified = exists(P.verified) ? readJson<{ facts: VerifiedFact[] }>(P.verified) : null;
const usable = verified ? usableFactIds(verified.facts) : new Set<string>();

// 6-7
const graph = exists(P.graph) ? readJson<Graph>(P.graph) : null;
const rm = exists(P.roadmap) ? readJson<Roadmap>(P.roadmap) : null;
let planErrors = 0;
if (graph && verified && exists(P.achievements)) {
  const achs = readJson<any>(P.achievements).achievements;
  planErrors += validateGraph(graph, usable, new Set(achs.map((a: any) => a.id))).length;
  if (rm) planErrors += validateRoadmap(rm, graph, usable, achs).errors.length;
}
rows.push(["6 Graph", graph ? (planErrors ? "⛔" : "✅") : "⬜", graph ? `${graph.nodes.length} nodes` : ""]);
rows.push([
  "7 Roadmap",
  rm ? (planErrors ? "⛔" : "✅") : "⬜",
  rm ? `${rm.chapters.length} chapters, ${rm.playthroughs} playthrough(s)${planErrors ? ` — ${planErrors} graph/roadmap error(s) against current facts` : ""}` : "",
]);
if (!rm) setNext(`Plan route (ra-route-planner skill), then npm run rw:plan -- ${id}`);
else if (planErrors) setNext(`Fix 06_graph.json / 07_roadmap.json (ra-route-planner skill): npm run rw:plan -- ${id} lists the ${planErrors} error(s)`);

// 8
const chapterFiles = rm ? ["00_overview.md", ...rm.chapters.map((c) => chapterFile(c.n))] : [];
const chapterPaths = chapterFiles.map((f) => path.join(P.chaptersDir, f)).filter(exists);
if (rm) {
  const have = chapterFiles.filter((f) => exists(path.join(P.chaptersDir, f)));
  let badCites = 0;
  for (const p of chapterPaths)
    for (const m of readText(p).matchAll(CITE_RE)) for (const fid of m[1].split(/\s*,\s*/)) if (!usable.has(fid)) badCites++;
  const complete = have.length === chapterFiles.length;
  rows.push([
    "8 Writing",
    complete && !badCites ? "✅" : have.length ? "🟡" : "⬜",
    `${have.length}/${chapterFiles.length} files written${!complete ? ` — next: ${chapterFiles.find((f) => !have.includes(f))}` : ""}${badCites ? ` — ${badCites} citation(s) to missing/rejected facts` : ""}`,
  ]);
  if (!complete) {
    const f = chapterFiles.find((x) => !have.includes(x))!;
    setNext(`npm run rw:write -- ${id}  (writes every missing chapter, then runs assemble + qa; next missing: ${f})`);
  } else if (badCites) setNext(`npm run rw:write -- ${id} --fix  (${badCites} citation(s) point to facts that no longer exist or were rejected; rw:qa flags them, --fix revises those chapters)`);
} else rows.push(["8 Writing", "⬜", ""]);

// 9-10: stale when the fingerprints recorded by rw:qa / rw:score no longer match their inputs
// (artifacts written before fingerprints existed carry none and are not judged)
const chapterNs = rm ? rm.chapters.map((c) => c.n) : [];
const score = exists(P.score) ? readJson<any>(P.score) : null;
const chaptersChanged = Boolean(score?.inputs && score.inputs.chapters !== fingerprintFiles(chapterInputFiles(P, chapterNs)));
const reviewChanged = Boolean(score?.inputs && score.inputs.review !== fingerprintFiles([P.review]));
if (exists(P.qa)) {
  const q = readJson<any>(P.qa);
  const stale = Boolean(q.inputs && rm && q.inputs !== fingerprintFiles(qaInputFiles(P, chapterNs)));
  rows.push(["9 QA (script)", q.errors.length ? "❌" : stale ? "🟡" : "✅", `${q.errors.length} errors, ${q.warnings.length} warnings${stale ? " (stale — inputs changed, re-run)" : ""}`]);
  if (q.errors.length) setNext(`npm run rw:write -- ${id} --fix  (revises the chapters with QA errors, then re-runs assemble + qa)`);
  else if (stale) setNext(`npm run rw:assemble -- ${id} && npm run rw:qa -- ${id}`);
} else { rows.push(["9 QA (script)", "⬜", ""]); setNext(`npm run rw:assemble -- ${id} && npm run rw:qa -- ${id}`); }
if (exists(P.review)) {
  const r = readJson<any>(P.review);
  const open = r.issues.filter((i: any) => i.status !== "fixed");
  const stale = chaptersChanged && !reviewChanged; // chapters were edited after scoring but the review was not redone
  rows.push(["9 QA (review)", open.some((i: any) => i.severity === "critical") ? "❌" : stale ? "🟡" : "✅", `${open.length} open issues, beginner-friendliness ${r.beginner_friendliness}${stale ? " (stale — chapters or facts changed, re-review)" : ""}`]);
  if (stale) setNext("Re-run the strict review (ra-qa-auditor skill) -> 09_review.json");
} else { rows.push(["9 QA (review)", "⬜", ""]); setNext("Strict review (ra-qa-auditor skill) -> 09_review.json"); }
if (score) {
  const s = score;
  const stale = Boolean(
    s.inputs && (s.inputs.qa !== fingerprintFiles([P.qa]) || reviewChanged || s.inputs.verified !== fingerprintFiles([P.verified]) || chaptersChanged),
  );
  rows.push(["10 Score", s.verdict !== "ACCEPTED" ? "❌" : stale ? "🟡" : "✅", `${s.overall}% ${s.verdict}${stale ? " (stale — re-score)" : ""}`]);
  if (s.verdict !== "ACCEPTED") setNext("Address score blockers (see 10_score.json), then re-run qa/review/score");
  else if (stale) setNext(`npm run rw:score -- ${id}`);
} else { rows.push(["10 Score", "⬜", ""]); setNext(`npm run rw:score -- ${id}`); }

console.log(`Pipeline status — game ${id}\n`);
for (const [s, i, d] of rows) console.log(`${i}  ${s.padEnd(15)} ${d}`);
console.log(`\nNEXT: ${next || "Done 🎉 — content/walkthroughs/" + id + ".md is accepted."}`);
if (lateNote && /source-collector/i.test(next)) console.log(`NOTE: ${lateNote}`);
// Coordinator mode: judgment stages go to a fresh rw-stage agent (Opus) so the coordinator's context stays small;
// command stages the coordinator runs itself.
if (next) {
  const judgment = /source-collector|resolve conflicts|route-planner|qa-auditor|score blockers/i.test(next);
  // source collection is mostly scripted (rw:find-guides, rw:maps, rw:collect); its choices fit Sonnet
  const sonnet = /source-collector/i.test(next);
  console.log(
    /^Ask the user/.test(next)
      ? "WHO: user — the coordinator asks the user once, then runs the --approve / --decline commands"
      : !judgment
      ? "WHO: coordinator — command stage: run it yourself and read only the summary lines"
      : sonnet
        ? "WHO: rw-stage (Sonnet) — spawn a fresh rw-stage agent (.claude/agents/rw-stage.md) with model: sonnet for this one stage"
        : "WHO: rw-stage — judgment stage: spawn a fresh rw-stage agent (.claude/agents/rw-stage.md, Opus) for this one stage",
  );
}
// model usage recorded by rw:extract / rw:write
const usageFile = path.join(P.dir, "_usage.jsonl");
if (exists(usageFile)) {
  const calls = readText(usageFile).split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  const total = calls.reduce((s, r) => s + r.input + r.output + r.cache_read + r.cache_write, 0);
  const output = calls.reduce((s, r) => s + r.output, 0);
  const other = calls.filter((r) => r.backend === "agy" || r.backend === "gemini").reduce((s, r) => s + r.input + r.output + r.cache_read + r.cache_write, 0);
  console.log(`USAGE: rw:extract / rw:write made ${calls.length} model call(s), ${(total / 1e6).toFixed(2)}M tokens (${(output / 1e3).toFixed(0)}k output)${other ? ` · Claude ${((total - other) / 1e6).toFixed(2)}M, agy/gemini ${(other / 1e6).toFixed(2)}M` : ""}`);
}
// active time and agent tokens recorded by rw:auto / rw:log-agent (waits for the user or a limit reset are not in it)
const activity = readActivity(id);
if (activity.length) {
  const sum = (rows: ActivityRow[]) => rows.reduce((s, r) => s + r.active_ms, 0);
  const steps = activity.filter((r) => r.kind === "step");
  const agents = activity.filter((r) => r.kind === "agent");
  const agentTokens = agents.reduce((s, r) => s + (r.tokens ?? 0), 0);
  console.log(
    `ACTIVE: ${fmtDuration(sum(activity))} (scripts ${fmtDuration(sum(steps))} in ${steps.length} step(s), agents ${fmtDuration(sum(agents))} in ${agents.length} run(s))` +
      (agentTokens ? ` · agent tokens ${(agentTokens / 1e3).toFixed(0)}k` : ""),
  );
}
