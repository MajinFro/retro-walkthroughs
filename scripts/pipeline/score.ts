/**
 * Stage 10 - Final scoring.
 *
 *   npx tsx scripts/pipeline/score.ts <gameId>
 *
 * Combines deterministic metrics (09_qa.json, 05_verified.json, chunk progress)
 * with the strict reviewer's report (09_review.json). Rejects anything < 90%.
 */
import fs from "node:fs";
import path from "node:path";
import {
  type Chunk,
  type SourceEntry,
  type VerifiedFact,
  chapterInputFiles,
  chunkProgress,
  compressRanges,
  fingerprintFiles,
  gameIdArg,
  loadFacts,
  loadSkipped,
  paths,
  readJson,
  readJsonl,
  requireFile,
  writeJson,
} from "./lib.ts";
import { type Roadmap } from "./graph.ts";

interface Review {
  beginner_friendliness: number;
  issues: { id: string; severity: "critical" | "major" | "minor"; category: string; status: "open" | "fixed"; description: string }[];
}

const id = gameIdArg();
const P = paths(id);
requireFile(P.qa, "run rw:qa first");
requireFile(P.review, "the QA auditor agent must write 09_review.json first");

const qa = readJson<{ metrics: any; errors: string[]; warnings?: string[] }>(P.qa);
const review = readJson<Review>(P.review);
const verified = readJson<{ facts: VerifiedFact[] }>(P.verified);
const sources = readJson<SourceEntry[]>(P.sourcesManifest);
const chunks = readJsonl<Chunk>(P.chunks).filter((c) => c.source_id !== "ra-comments");
const roadmap = readJson<Roadmap>(P.roadmap);
const m = qa.metrics;

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 100);
const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)));
const open = review.issues.filter((i) => i.status !== "fixed");
const openOf = (cats: RegExp) => open.filter((i) => cats.test(i.category));
const penalty = (list: Review["issues"]) => list.reduce((s, i) => s + (i.severity === "critical" ? 8 : i.severity === "major" ? 3 : 0.5), 0);

// source coverage: number of substantive independent guide sources (>=10k chars) + share of guide chunks that yielded facts
const guideSources = sources.filter((s) => s.kind !== "ra-comments" && s.kind !== "map" && (s.chars ?? 0) >= 10000).length;
const factChunks = new Set(verified.facts.flatMap((f) => f.evidence.map((e) => e.chunk_id)));
const processed = new Set(factChunks);
const skipFile = path.join(P.factsDir, "_skipped.txt");
if (fs.existsSync(skipFile)) fs.readFileSync(skipFile, "utf-8").split(/\r?\n/).forEach((l) => l.trim() && processed.add(l.trim().split(/\s/)[0]));
// Fact-producing chunks count fully; skipped chunks count at a steep discount (max 20% credit) so skipping doesn't inflate score
const factCount = chunks.filter((c) => factChunks.has(c.chunk_id)).length;
const skippedCount = chunks.filter((c) => !factChunks.has(c.chunk_id) && processed.has(c.chunk_id)).length;
const effectiveChunks = factCount + Math.min(factCount * 0.25, skippedCount * 0.2);
const chunkCov = pct(effectiveChunks, chunks.length);

// Warnings in QA penalize beginner friendliness
const beginnerWarnings = (qa.warnings ?? []).filter((w) =>
  /sparse|brief|checkpoint|checklist|word count|unusually low|mermaid|visual map/i.test(w)
);
const qaWarningPenalty = Math.min(30, beginnerWarnings.length * 5);

// true_100_coverage: checks content depth (words per area), presence of cumulative checkpoints, and map linkage
const isCommandSteps = roadmap.format === "command_steps";
const targetWordsPerArea = isCommandSteps ? 60 : 180;
const wordDepth = pct(m.words, Math.max(1, m.areas * targetWordsPerArea));
const hasCriteria = Boolean(roadmap.true_100_criteria);
const checkpointScore = hasCriteria ? pct(m.chapters_with_checkpoints ?? 0, Math.max(1, roadmap.chapters.length)) : (m.chapters_with_checkpoints ? 100 : 85);
const mapScore = (m.maps_available ?? 0) > 0 ? pct(m.map_links_present ?? 0, Math.min(m.maps_available, m.areas)) : 100;
const sparsityPenalty = Math.min(25, (m.sparse_areas ?? 0) * 3);

const true100Score = clamp(
  (m.maps_available ? 0.45 * Math.min(100, wordDepth) + 0.35 * checkpointScore + 0.2 * mapScore : 0.6 * Math.min(100, wordDepth) + 0.4 * checkpointScore)
  - sparsityPenalty
  - penalty(openOf(/depth|brevity|sparse|missing.*chest|puzzle|map|100%|checkpoint/i))
);

const scores = {
  source_coverage: clamp(0.4 * Math.min(100, (guideSources / 3) * 100) + 0.6 * chunkCov),
  accuracy: clamp(pct(m.paragraphs_cited, m.paragraphs) * (1 - m.citations_broken / Math.max(1, m.citations)) - penalty(openOf(/accura|unsupport|contradict|halluc/i))),
  achievement_coverage: clamp(pct(m.achievements_placed_correctly - 0.5 * (m.achievements_placed_correctly - m.achievements_supported), m.achievements_total) - penalty(openOf(/achiev/i))),
  missable_coverage: clamp(pct(m.missables_warned + m.ponr_warned, m.missables + m.ponr) - penalty(openOf(/missab|ponr|no return/i))),
  beginner_friendliness: clamp(review.beginner_friendliness - qaWarningPenalty),
  route_completeness: clamp(pct(m.areas_mentioned, m.areas) - penalty(openOf(/navig|route|missing|treasure|boss/i))),
  true_100_coverage: true100Score,
};
const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length);
const blockers: string[] = [];
if (overall < 90) blockers.push(`overall ${overall}% < 90%`);
for (const [k, v] of Object.entries(scores)) if (v < 80) blockers.push(`${k} ${v}% < 80%`);
if (qa.errors.length) blockers.push(`${qa.errors.length} deterministic QA error(s)`);
// Stage 4 completeness across every source, including ra-comments (which source_coverage above ignores)
const { bySource, unprocessed } = chunkProgress(readJsonl<Chunk>(P.chunks), loadFacts(P.factsDir), loadSkipped(P.factsDir));
if (unprocessed.length)
  blockers.push(
    `${unprocessed.length} unprocessed chunk(s) (${[...bySource].filter(([, v]) => v.todo.length).map(([s, v]) => `${s}: ${compressRanges(v.todo)}`).join("; ")}) — finish Stage 4`,
  );
const crit = open.filter((i) => i.severity === "critical");
if (crit.length) blockers.push(`${crit.length} open critical review issue(s)`);

// fingerprints of what this score was computed from, so rw:status can flag a stale score or review
const chapterNs = roadmap.chapters.map((c) => c.n);
const inputs = {
  qa: fingerprintFiles([P.qa]),
  review: fingerprintFiles([P.review]),
  verified: fingerprintFiles([P.verified]),
  chapters: fingerprintFiles(chapterInputFiles(P, chapterNs)),
};
const result = { generated_at: new Date().toISOString(), inputs, scores, overall, verdict: blockers.length ? "REJECTED" : "ACCEPTED", blockers };
writeJson(P.score, result);
console.log(`Final score for game ${id}`);
for (const [k, v] of Object.entries(scores)) console.log(`  ${k.padEnd(22)} ${String(v).padStart(3)}%`);
console.log(`  ${"OVERALL".padEnd(22)} ${String(overall).padStart(3)}%  → ${result.verdict}`);
for (const b of blockers) console.log(`  ⛔ ${b}`);
process.exit(blockers.length ? 1 : 0);
