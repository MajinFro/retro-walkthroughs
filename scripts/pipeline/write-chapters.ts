/**
 * Stage 8 - Chapter writing by direct model calls (replaces one agent per chapter).
 *
 *   npx tsx scripts/pipeline/write-chapters.ts <gameId> [overview|N ...] [--force] [--fix] [--concurrency N] [--model sonnet]
 *
 * Default: every chapter file that does not exist yet (overview + 1..N). Name chapters to limit the run;
 * --force rewrites chapters that already exist.
 * --fix: runs rw:assemble + rw:qa, then revises every chapter with QA errors (or score-affecting warnings),
 *        plus, with --note "<finding>", the named chapters for a review finding QA cannot see;
 *        sending the current draft, its QA findings and the packet. Use it instead of fixing chapters by hand.
 *
 * Per chapter: build the packet (rw:packet), one model call with the ra-walkthrough-writer rules as the system
 * prompt and the packet as the message, deterministic checks on the reply, one repair call if a check fails,
 * then write 08_chapters/<NN>.md. After the run: rw:assemble + rw:qa.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chapterMermaid, checkpointTotals, type Graph, type Roadmap, usableFactIds } from "./graph.ts";
import { type LlmRequest, type Usage, addUsage, backend, defaultConcurrency, formatUsage, modelFor, runAll, skillText, unwrapMarkdown } from "./llm.ts";
import {
  ACH_RE,
  type AchievementsFile,
  CITE_RE,
  type VerifiedFact,
  chapterFile,
  flag,
  gameIdArg,
  paths,
  readJson,
  guardFlags,
  readText,
  requireFile,
  writeText,
} from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
for (const [f, h] of [[P.verified, "rw:verify"], [P.graph, "route planner"], [P.roadmap, "route planner"]] as const) requireFile(f, h);

const ach = readJson<AchievementsFile>(P.achievements);
const graph = readJson<Graph>(P.graph);
const roadmap = readJson<Roadmap>(P.roadmap);
const verified = readJson<{ facts: VerifiedFact[] }>(P.verified);
const usable = usableFactIds(verified.facts);

const run = (cmd: string) => spawnSync(cmd, { shell: true, encoding: "utf8", cwd: P.root });
const fileOf = (t: string) => (t === "overview" ? "00_overview.md" : chapterFile(Number(t)));
const all = ["overview", ...roadmap.chapters.map((c) => String(c.n))];

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------
guardFlags("fix", "force", "note", "model", "concurrency", "effort"); // before stray values look like chapter names
const named = process.argv.slice(3).filter((a, i, arr) => !a.startsWith("--") && !(arr[i - 1] ?? "").match(/^--(concurrency|model|effort|note)$/));
for (const t of named) if (!all.includes(t)) {
  console.error(`Unknown chapter "${t}" (use overview or 1..${roadmap.chapters.length})`);
  process.exit(1);
}
const fixMode = Boolean(flag("fix"));
const qaFindings = new Map<string, string[]>(); // target -> QA findings to address
if (fixMode) {
  run(`npx tsx scripts/pipeline/assemble.ts ${id}`);
  run(`npx tsx scripts/pipeline/qa-check.ts ${id}`);
  const qa = readJson<{ errors: string[]; warnings: string[] }>(P.qa);
  // warnings that lower the score (see score.ts beginner_friendliness) are worth a revision too
  const scored = /sparse|brief|checkpoint|checklist|word count|unusually low|mermaid|visual map|uncited|no factual overlap|save state|point of no return/i;
  for (const [kind, list] of [["ERROR", qa.errors], ["WARNING", qa.warnings.filter((w) => scored.test(w))]] as const)
    for (const msg of list) {
      const m = msg.match(/^(overview|ch(\d+))\b/) ?? msg.match(/placed in (ch(\d+))|roadmap says (ch(\d+))/);
      const t = !m ? null : m[1] === "overview" ? "overview" : (m[2] ?? m[4] ?? null);
      if (t && all.includes(t)) qaFindings.set(t, [...(qaFindings.get(t) ?? []), `${kind}: ${msg}`]);
    }
}
// --note "<review finding>": an adversarial-review finding QA cannot detect, applied to the named chapters
const note = flag("note");
if (note && fixMode) for (const t of named) qaFindings.set(t, [...(qaFindings.get(t) ?? []), `REVIEW: ${note}`]);
const targets = fixMode
  ? [...qaFindings.keys()].filter((t) => !named.length || named.includes(t))
  : (named.length ? named : all).filter((t) => flag("force") || named.length || !fs.existsSync(path.join(P.chaptersDir, fileOf(t))));

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
const HEADER = `You are the Stage 8 walkthrough writer of an evidence-first pipeline, running non-interactively.
You receive one writer packet (roadmap entry, usable facts with verbatim quotes, raw source passages) and reply with the finished chapter in Markdown, nothing else: no preamble, no notes to the orchestrator, no fence around the whole reply.
You cannot read files or run commands; everything you may use is in the packet. Cite only fact ids listed in the packet's "Usable facts".
Be exhaustive: route every area room by room and use every packet fact that belongs to this chapter (every chest, item, puzzle step, boss detail, shop, sidequest). A chapter typically runs 3,000-6,000 words; never summarize to save space.
The reply is published as-is. Never mention packets, files, other chapters' drafts, or what you were or were not given. If a detail is missing, write "Unable to verify from collected sources."
Roadmap format for this game: ${roadmap.format ?? "prose"}.`;
const system = [HEADER, skillText("ra-walkthrough-writer", ["Workflow: Chapter by Chapter"])].join("\n\n");

function packet(t: string): string {
  const r = run(`npx tsx scripts/pipeline/chapter-packet.ts ${id} ${t}`);
  if (r.status !== 0) throw new Error(`rw:packet ${t} failed: ${r.stderr || r.stdout}`);
  const warn = (r.stdout.match(/⚠.*/g) ?? []).join(" ");
  if (warn) console.log(`  ${fileOf(t)}: ${warn}`);
  return readText(path.join(P.packetsDir, fileOf(t)));
}

// ---------------------------------------------------------------------------
// Deterministic checks on a draft (rw:qa stays the authority; these catch what a repair call can fix)
// ---------------------------------------------------------------------------
const DRAFTING_RE =
  /\b(?:was(?:n't| not) (?:available|provided)|(?:the|this|my) (?:writer )?packet|chapter \d+'s file|I (?:will|would|assume|don't have|do not have|cannot see)|as an AI)\b/i;

function problems(t: string, text: string): string[] {
  const out: string[] = [];
  const bad = [...new Set([...text.matchAll(CITE_RE)].flatMap((m) => m[1].split(/\s*,\s*/)).filter((f) => !usable.has(f)))];
  if (bad.length) out.push(`cites fact ids that are not usable facts: ${bad.slice(0, 20).join(", ")} — cite only ids from the packet`);
  const tags = [...text.matchAll(ACH_RE)].map((m) => Number(m[1]));
  const drafting = text.match(DRAFTING_RE);
  if (drafting) out.push(`contains a drafting note ("${drafting[0]}") — remove it; the reply is published as-is`);
  if (/\(passage only\)/i.test(text)) out.push(`contains "(passage only)" — every statement must cite a fact id from the packet`);
  if (/```mermaid/.test(text)) out.push("contains a hand-written mermaid block — write [MERMAID] instead");
  if (t === "overview") {
    if (tags.length) out.push("the overview must not contain [ACHIEVEMENT:id] tags");
    return out;
  }
  const n = Number(t);
  const ch = roadmap.chapters.find((c) => c.n === n)!;
  for (const a of ch.achievement_ids) {
    const k = tags.filter((x) => x === a).length;
    if (k !== 1) out.push(`[ACHIEVEMENT:${a}] appears ${k} times — place it exactly once`);
  }
  const extra = [...new Set(tags.filter((a) => !ch.achievement_ids.includes(a)))];
  if (extra.length) out.push(`[ACHIEVEMENT:...] tags for achievements not assigned to this chapter: ${extra.join(", ")} — remove them`);
  if (chapterMermaid(graph, ch.areas) && !text.includes("[MERMAID]")) out.push("missing the [MERMAID] placeholder under the chapter title");
  const lines = text.split(/\r?\n/);
  const callouts = lines.filter((l) => /^>\s*\[!(WARNING|CAUTION)\]/i.test(l.trim())).length;
  const missables = roadmap.missables.filter((m) => m.chapter === n).length;
  if (missables && !callouts) out.push(`${missables} missable(s) in this chapter but no > [!WARNING] callout`);
  const ponr = roadmap.ponr.filter((p) => p.chapter === n).length;
  const ponrCallouts = lines.filter((l, i) => /^>\s*\[!CAUTION\]/i.test(l.trim()) && /point of no return/i.test(lines.slice(i, i + 6).join(" "))).length;
  if (ponrCallouts < ponr) out.push(`${ponr} point(s) of no return but ${ponrCallouts} "> [!CAUTION]" callout(s) containing "Point of No Return"`);
  // the callout's own heading first: prose may mention "Cumulative 100% Checkpoint" earlier
  const cpRe = /cumulative\s*(100%|progress)\s*checkpoint/i;
  const inCallout = lines.findIndex((l) => l.trim().startsWith(">") && cpRe.test(l));
  const cpAt = inCallout > -1 ? inCallout : lines.findIndex((l) => cpRe.test(l));
  if (cpAt === -1) out.push("missing the > [!IMPORTANT] Cumulative 100% Checkpoint block");
  else {
    const tot = checkpointTotals(roadmap, n, ach.achievements);
    const am = lines.slice(cpAt, cpAt + 30).find((l) => /retroachievements|achievements unlocked/i.test(l))?.match(/(\d+)\s*\/\s*(\d+)/);
    if (!am || Number(am[1]) !== tot.achievements || Number(am[2]) !== tot.achievements_total)
      out.push(`checkpoint must say "RetroAchievements Unlocked: ${tot.achievements} / ${tot.achievements_total} (${tot.points} / ${tot.points_total} points)"`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
console.log(`Stage 8 writing for game ${id}: ${targets.length ? targets.map(fileOf).join(", ") : "nothing to do"}`);
if (!targets.length) {
  console.log(fixMode ? "✅ No chapter has QA errors or score-affecting warnings." : "All chapter files exist (use --force or name chapters to rewrite).");
  process.exit(0);
}
console.log(`  backend ${backend()}, model ${modelFor("write", flag("model"))}, ${Number(flag("concurrency") ?? defaultConcurrency())} at a time`);

const packets = new Map(targets.map((t) => [t, packet(t)]));
const effort = (flag("effort") ?? process.env.RW_EFFORT_WRITE) as LlmRequest["effort"];
const req = (t: string, user: string): LlmRequest => ({ key: t, tier: "write", system, user, maxTokens: 32000, effort });
const firstMessage = (t: string) => {
  const p = packets.get(t)!;
  if (!fixMode) return p;
  const draft = readText(path.join(P.chaptersDir, fileOf(t)));
  return `${p}\n\n---\n\n# Current draft of ${fileOf(t)}\n\n${draft}\n\n---\n\n# Revise the draft\n\nrw:qa reported:\n${qaFindings.get(t)!.map((f) => `- ${f}`).join("\n")}\n\nReply with the complete revised chapter. Keep everything that is correct; fix every finding (cite a packet fact for each uncited statement or remove it; expand brief area sections with the packet's facts).`;
};

const usageLog = path.join(P.dir, "_usage.jsonl");
const opts = { concurrency: Number(flag("concurrency") ?? defaultConcurrency()), model: flag("model"), usageLog, stage: fixMode ? "write-fix" : "write" };
let usage: Usage = { input: 0, output: 0, cache_read: 0, cache_write: 0 };
const drafts = new Map<string, { text: string; problems: string[] }>();
const repairs: string[] = [];

await runAll(targets.map((t) => req(t, firstMessage(t))), {
  ...opts,
  onResult: (r) => {
    usage = addUsage(usage, r.usage);
    if (r.error && !r.text) {
      console.log(`  ${fileOf(r.key)}: ❌ ${r.error.slice(0, 120)}`);
      return;
    }
    const text = unwrapMarkdown(r.text);
    const ps = problems(r.key, text);
    drafts.set(r.key, { text, problems: ps });
    writeText(path.join(P.chaptersDir, fileOf(r.key)), text);
    console.log(`  ${fileOf(r.key)}: ${text.split(/\s+/).length} words${ps.length ? `, ${ps.length} problem(s) → repair: ${ps.join(" | ").slice(0, 300)}` : " ✅"}`);
    if (ps.length) repairs.push(r.key);
  },
});

if (repairs.length) {
  console.log(`\nRepair pass: ${repairs.map(fileOf).join(", ")}`);
  await runAll(
    repairs.map((t) =>
      req(t, `${packets.get(t)}\n\n---\n\n# Your draft of ${fileOf(t)}\n\n${drafts.get(t)!.text}\n\n---\n\n# Fix these problems\n\n${drafts.get(t)!.problems.map((p) => `- ${p}`).join("\n")}\n\nReply with the complete corrected chapter.`),
    ),
    {
      ...opts,
      stage: `${opts.stage}-repair`,
      onResult: (r) => {
        usage = addUsage(usage, r.usage);
        if (r.error && !r.text) return void console.log(`  ${fileOf(r.key)}: ❌ ${r.error.slice(0, 120)} (first draft kept)`);
        const text = unwrapMarkdown(r.text);
        const ps = problems(r.key, text);
        const before = drafts.get(r.key)!;
        if (ps.length <= before.problems.length) writeText(path.join(P.chaptersDir, fileOf(r.key)), text);
        console.log(`  ${fileOf(r.key)}: ${ps.length ? `${ps.length} problem(s) left: ${ps.join(" | ").slice(0, 300)}` : "✅"}`);
      },
    },
  );
}

console.log(`\nusage: ${formatUsage(usage)} (logged to ${path.relative(P.root, usageLog)})`);
const missing = all.filter((t) => !fs.existsSync(path.join(P.chaptersDir, fileOf(t))));
if (missing.length) console.log(`Still missing: ${missing.map(fileOf).join(", ")} — re-run rw:write.`);
else {
  run(`npx tsx scripts/pipeline/assemble.ts ${id}`);
  const qa = run(`npx tsx scripts/pipeline/qa-check.ts ${id}`);
  console.log(qa.stdout.split(/\r?\n/).filter((l) => /error\(s\)|❌/.test(l)).slice(0, 15).join("\n"));
  console.log(`Next: ${qa.status === 0 ? "adversarial review (ra-qa-auditor skill)" : `npm run rw:write -- ${id} --fix`}`);
}
