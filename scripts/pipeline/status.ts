/**
 * Pipeline status / resume helper.
 *
 *   npx tsx scripts/pipeline/status.ts <gameId>
 *
 * Prints which stages are complete and the exact next action.
 */
import fs from "node:fs";
import path from "node:path";
import { type Chunk, type SourceEntry, chapterFile, exists, gameIdArg, loadFacts, paths, readJson, readJsonl } from "./lib.ts";

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
const sources = exists(P.sourcesManifest) ? readJson<SourceEntry[]>(P.sourcesManifest) : [];
const guides = sources.filter((s) => s.kind !== "ra-comments");
rows.push(["2 Sources", guides.length >= 3 ? "✅" : guides.length ? "🟡" : "⬜", `${guides.length} guide source(s): ${guides.map((s) => s.id).join(", ") || "—"}${guides.length < 3 ? " (aim for 3+)" : ""}`]);
if (!guides.length) setNext("Collect sources (ra-source-collector skill): npm run rw:collect -- " + id + " <url> --id gf1 --site GameFAQs --title \"...\"");

// 3
const chunks = exists(P.chunks) ? readJsonl<Chunk>(P.chunks) : [];
const chunkSrcs = new Set(chunks.map((c) => c.source_id));
const stale = sources.some((s) => !chunkSrcs.has(s.id));
rows.push(["3 Chunks", chunks.length && !stale ? "✅" : chunks.length ? "🟡" : "⬜", chunks.length ? `${chunks.length} chunks${stale ? " — new sources not chunked yet" : ""}` : ""]);
if (!chunks.length || stale) setNext(`npm run rw:chunk -- ${id}`);

// 4
const facts = loadFacts(P.factsDir);
const done = new Set(facts.flatMap((f) => (f.evidence ?? []).map((e) => e.chunk_id)));
const skip = path.join(P.factsDir, "_skipped.txt");
if (fs.existsSync(skip)) fs.readFileSync(skip, "utf-8").split(/\r?\n/).forEach((l) => l.trim() && done.add(l.trim().split(/\s/)[0]));
const guideChunks = chunks.filter((c) => c.source_id !== "ra-comments");
const doneGuide = guideChunks.filter((c) => done.has(c.chunk_id)).length;
const raChunks = chunks.filter((c) => c.source_id === "ra-comments");
const doneRa = raChunks.filter((c) => done.has(c.chunk_id)).length;
const pct4 = chunks.length ? Math.round(((doneGuide + doneRa) / chunks.length) * 100) : 0;
rows.push(["4 Facts", pct4 >= 95 ? "✅" : facts.length ? "🟡" : "⬜", `${facts.length} facts · guide chunks ${doneGuide}/${guideChunks.length} · RA comments ${doneRa}/${raChunks.length} (${pct4}%)`]);
if (pct4 < 95) setNext(`Extract facts (ra-fact-extractor skill). See: npm run rw:chunks -- ${id} --progress`);

// 5
if (exists(P.verified)) {
  const v = readJson<any>(P.verified);
  const s = v.stats;
  const newer = facts.length && fs.statSync(P.verified).mtimeMs < Math.max(...fs.readdirSync(P.factsDir).map((f) => fs.statSync(path.join(P.factsDir, f)).mtimeMs));
  rows.push(["5 Verify", s.conflict ? "⛔" : newer ? "🟡" : "✅", `✅${s.verified} 🟡${s.single_source} ⚠${s.conflict} ✔${s.resolved} ❌${s.rejected} · ach unsupported: ${s.achievements_unsupported}${newer ? " (facts changed — re-run)" : ""}`]);
  if (s.conflict || newer) setNext(`npm run rw:verify -- ${id}  (resolve conflicts with ra-fact-verifier skill)`);
} else { rows.push(["5 Verify", "⬜", ""]); setNext(`npm run rw:verify -- ${id}`); }

// 6-7
rows.push(["6 Graph", exists(P.graph) ? "✅" : "⬜", exists(P.graph) ? `${readJson<any>(P.graph).nodes.length} nodes` : ""]);
const rm = exists(P.roadmap) ? readJson<any>(P.roadmap) : null;
rows.push(["7 Roadmap", rm ? "✅" : "⬜", rm ? `${rm.chapters.length} chapters, ${rm.playthroughs} playthrough(s)` : ""]);
if (!rm) setNext(`Plan route (ra-route-planner skill), then npm run rw:plan -- ${id}`);

// 8
if (rm) {
  const files = ["00_overview.md", ...rm.chapters.map((c: any) => chapterFile(c.n))];
  const have = files.filter((f) => exists(path.join(P.chaptersDir, f)));
  rows.push(["8 Writing", have.length === files.length ? "✅" : have.length ? "🟡" : "⬜", `${have.length}/${files.length} files written${have.length < files.length ? ` — next: ${files.find((f) => !have.includes(f))}` : ""}`]);
  if (have.length < files.length) {
    const f = files.find((x) => !have.includes(x))!;
    setNext(`npm run rw:packet -- ${id} ${f === "00_overview.md" ? "overview" : Number(f.slice(0, 2))}  then write 08_chapters/${f} (ra-walkthrough-writer skill)`);
  }
} else rows.push(["8 Writing", "⬜", ""]);

// 9-10
if (exists(P.qa)) {
  const q = readJson<any>(P.qa);
  rows.push(["9 QA (script)", q.errors.length ? "❌" : "✅", `${q.errors.length} errors, ${q.warnings.length} warnings`]);
  if (q.errors.length) setNext(`Fix QA errors in 08_chapters/, then npm run rw:assemble -- ${id} && npm run rw:qa -- ${id}`);
} else { rows.push(["9 QA (script)", "⬜", ""]); setNext(`npm run rw:assemble -- ${id} && npm run rw:qa -- ${id}`); }
if (exists(P.review)) {
  const r = readJson<any>(P.review);
  const open = r.issues.filter((i: any) => i.status !== "fixed");
  rows.push(["9 QA (review)", open.some((i: any) => i.severity === "critical") ? "❌" : "✅", `${open.length} open issues, beginner-friendliness ${r.beginner_friendliness}`]);
} else { rows.push(["9 QA (review)", "⬜", ""]); setNext("Strict review (ra-qa-auditor skill) -> 09_review.json"); }
if (exists(P.score)) {
  const s = readJson<any>(P.score);
  rows.push(["10 Score", s.verdict === "ACCEPTED" ? "✅" : "❌", `${s.overall}% ${s.verdict}`]);
  if (s.verdict !== "ACCEPTED") setNext("Address score blockers (see 10_score.json), then re-run qa/review/score");
} else { rows.push(["10 Score", "⬜", ""]); setNext(`npm run rw:score -- ${id}`); }

console.log(`Pipeline status — game ${id}\n`);
for (const [s, i, d] of rows) console.log(`${i}  ${s.padEnd(15)} ${d}`);
console.log(`\nNEXT: ${next || "Done 🎉 — content/walkthroughs/" + id + ".md is accepted."}`);
