/**
 * Run analysis for the end-of-game summary: where the tokens, time and repairs went, and how this game
 * compares with earlier ones. Reads only the logs the pipeline already writes (_usage.jsonl,
 * _activity.jsonl, _extract_rejects.jsonl, _auto.log, 09_qa.json, 09_review.json, 10_score.json), so the
 * coordinator gets the numbers in a few dozen lines without opening any of those files.
 *
 *   npx tsx scripts/pipeline/analyze.ts <gameId>
 */
import fs from "node:fs";
import path from "node:path";
import { type ActivityRow, exists, fmtDuration, gameIdArg, paths, readActivity, readJson, readText } from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
const researchRoot = path.dirname(P.dir);

const jsonl = (f: string): any[] => (exists(f) ? readText(f).split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)) : []);
const tok = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${(n / 1e3).toFixed(0)}k`);
const pctOf = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "—");
const callTokens = (u: any) => (u.input ?? 0) + (u.output ?? 0) + (u.cache_read ?? 0) + (u.cache_write ?? 0);
/** Group free-text problems into kinds: drop quoted text, ids, numbers and lists. */
const kindOf = (p: string) =>
  p
    .replace(/"[^"]*"?/g, "\"…\"")
    .replace(/\[ACHIEVEMENT:\d+\]/g, "[ACHIEVEMENT]")
    .replace(/:\s.*?(—|$)/, ": … $1")
    .replace(/\(\d+%\)/g, "")
    .replace(/\d+/g, "N")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
function countBy<T>(xs: T[], key: (x: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const x of xs) m.set(key(x), (m.get(key(x)) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
}
const top = (xs: [string, number][], n = 6) => xs.slice(0, n).map(([k, v]) => `${k} ×${v}`).join(" · ");

// ---------------------------------------------------------------------------
// Per-game numbers (also used for the comparison table)
// ---------------------------------------------------------------------------
function gameStats(gid: string) {
  const G = paths(gid);
  const usage = jsonl(path.join(G.dir, "_usage.jsonl"));
  const activity: ActivityRow[] = readActivity(gid);
  const score = exists(G.score) ? readJson(G.score) : null;
  const chunks = exists(G.chunks) ? readText(G.chunks).split(/\r?\n/).filter(Boolean).length : 0;
  const title = exists(G.achievements) ? readJson(G.achievements).title : "?";
  const scriptTokens = usage.reduce((s, u) => s + callTokens(u), 0);
  const repairTokens = usage.filter((u) => /repair/.test(u.stage)).reduce((s, u) => s + callTokens(u), 0);
  const fixTokens = usage.filter((u) => /fix/.test(u.stage)).reduce((s, u) => s + callTokens(u), 0);
  const agentTokens = activity.filter((r) => r.kind === "agent").reduce((s, r) => s + (r.tokens ?? 0), 0);
  // calls on another provider's quota (agy = Antigravity) cost no Claude tokens
  const otherTokens = usage.filter((u) => u.backend === "agy" || u.backend === "gemini").reduce((s, u) => s + callTokens(u), 0);
  const activeMs = activity.reduce((s, r) => s + r.active_ms, 0);
  return { gid, title, usage, activity, score, chunks, scriptTokens, repairTokens, fixTokens, agentTokens, otherTokens, activeMs };
}

const g = gameStats(id);
const ach = exists(P.achievements) ? readJson(P.achievements).achievements.length : 0;
const facts = exists(P.verified) ? readJson(P.verified).facts.length : 0;
const chapters = exists(P.chaptersDir) ? fs.readdirSync(P.chaptersDir).filter((f) => f.endsWith(".md")).length : 0;
const out: string[] = [];
out.push(`RUN ANALYSIS — game ${id}: ${g.title} (${ach} achievements, ${g.chunks} chunks, ${facts} facts, ${chapters} chapter files)`);
if (g.score) {
  const low = Object.entries(g.score.scores as Record<string, number>).sort((a, b) => a[1] - b[1]).slice(0, 3);
  out.push(`Score ${g.score.overall}% ${g.score.verdict} · lowest: ${low.map(([k, v]) => `${k} ${v}`).join(", ")}`);
}

// Time
out.push("", `TIME — active ${g.activity.length ? fmtDuration(g.activeMs) : "not logged"} (waits for the user or a usage-limit reset are not counted)`);
for (const r of [...g.activity].sort((a, b) => b.active_ms - a.active_ms))
  out.push(`  ${fmtDuration(r.active_ms).padStart(8)}  ${pctOf(r.active_ms, g.activeMs).padStart(4)}  ${r.kind === "agent" ? `agent ${r.label}${r.tokens ? ` (${tok(r.tokens)} tokens, ${r.tool_uses ?? "?"} tool uses)` : ""}` : r.label.replace(/^npm run /, "")}${r.limit ? " [hit usage limit]" : ""}`);

// Tokens
out.push("", `TOKENS — scripts ${tok(g.scriptTokens)} + agents ${tok(g.agentTokens)} = ${tok(g.scriptTokens + g.agentTokens)} · repair calls ${pctOf(g.repairTokens, g.scriptTokens)} of script tokens · --fix ${pctOf(g.fixTokens, g.scriptTokens)}`);
if (g.otherTokens) out.push(`  of the script tokens, ${tok(g.otherTokens)} ran on a non-Claude backend (agy/gemini): Claude script tokens ${tok(g.scriptTokens - g.otherTokens)}`);
for (const [stage, rows] of countBy(g.usage, (u) => `${u.stage}/${u.model}`).map(([k]) => [k, g.usage.filter((u) => `${u.stage}/${u.model}` === k)] as const)) {
  const t = rows.reduce((s, u) => s + callTokens(u), 0);
  const o = rows.reduce((s, u) => s + (u.output ?? 0), 0);
  const cw = rows.reduce((s, u) => s + (u.cache_write ?? 0), 0);
  const errs = rows.filter((u) => u.error).length;
  out.push(`  ${stage.padEnd(24)} ${String(rows.length).padStart(3)} calls  ${tok(t).padStart(6)}  (output ${tok(o)}, cache write ${tok(cw)}, ${tok(t / rows.length)}/call)${errs ? `  ${errs} error(s)` : ""}`);
}
const extractCalls = g.usage.filter((u) => u.stage === "extract");
if (g.chunks && extractCalls.length) out.push(`  extraction: ${tok(extractCalls.reduce((s, u) => s + callTokens(u), 0) / g.chunks)} tokens per chunk (first calls only)`);

// Call speed per stage and backend (rows logged since call timing was added)
const timed = g.usage.filter((u) => typeof u.call_ms === "number");
if (timed.length) {
  const sec = (ms: number) => `${Math.round(ms / 1000)}s`;
  const q = (xs: number[], p: number) => xs[Math.min(xs.length - 1, Math.floor(xs.length * p))];
  out.push("", "SPEED — per call: median / p90 of the answering attempt, retries, total wall time");
  for (const [k] of countBy(timed, (u) => `${u.stage}/${u.backend}`)) {
    const rows = timed.filter((u) => `${u.stage}/${u.backend}` === k);
    const call = rows.map((u) => u.call_ms).sort((a, b) => a - b);
    const retried = rows.filter((u) => (u.attempts ?? 1) > 1).length;
    out.push(`  ${k.padEnd(28)} ${String(rows.length).padStart(3)} calls  ${sec(q(call, 0.5))} / ${sec(q(call, 0.9))}  ${retried ? `${retried} retried, ` : ""}${sec(rows.reduce((s, u) => s + (u.ms ?? 0), 0))} total`);
  }
}

// Extraction failures
const rejects = jsonl(path.join(P.dir, "_extract_rejects.jsonl"));
const autoLog = exists(path.join(P.dir, "_auto.log")) ? readText(path.join(P.dir, "_auto.log")) : "";
const widened = [...autoLog.matchAll(/(\d+) fact\(s\) kept by widening/g)].reduce((s, m) => s + Number(m[1]), 0);
if (rejects.length || widened) {
  const dropped = rejects.filter((r) => r.round === 2).length;
  out.push("", `EXTRACTION — ${rejects.length} rejected fact(s): ${rejects.length - dropped} sent to repair, ${dropped} dropped after repair · ${widened} kept by quote widening (no repair call)`);
  out.push(`  reasons: ${top(countBy(rejects.flatMap((r) => r.problems as string[]), kindOf))}`);
  out.push(`  worst batches: ${top(countBy(rejects, (r) => r.batch), 5)}`);
}

// Writing repairs (first drafts that failed the deterministic checks)
const writeFails = [...autoLog.matchAll(/^\s*(\S+\.md): .*?→ repair: (.*)$/gm)];
if (writeFails.length) {
  out.push("", `WRITING — ${writeFails.length} first draft(s) needed a repair call`);
  out.push(`  reasons: ${top(countBy(writeFails.flatMap((m) => m[2].split(" | ")), kindOf))}`);
}

// QA + review
if (exists(P.qa)) {
  const qa = readJson(P.qa);
  out.push("", `QA — ${qa.errors.length} error(s), ${qa.warnings.length} warning(s)${qa.warnings.length ? `: ${top(countBy(qa.warnings as string[], (w) => kindOf(w.replace(/^[\w-]+(:\d+)?:\s*/, ""))))}` : ""}`);
}
if (exists(P.review)) {
  const issues: any[] = readJson(P.review).issues ?? [];
  out.push(`REVIEW — ${issues.length} issue(s): ${top(countBy(issues, (i) => i.severity))} · by category: ${top(countBy(issues, (i) => i.category))}`);
  for (const i of issues.filter((x) => /critical|major/.test(x.severity)))
    out.push(`  ${i.severity} ${i.category} (${path.basename(i.file ?? "")}): ${String(i.description).slice(0, 170)}`);
}

// Comparison with earlier games
const others = fs
  .readdirSync(researchRoot)
  .filter((d) => /^\d+$/.test(d) && exists(path.join(researchRoot, d, "_usage.jsonl")) && exists(path.join(researchRoot, d, "10_score.json")))
  .map(gameStats)
  .sort((a, b) => (a.score?.generated_at ?? "").localeCompare(b.score?.generated_at ?? ""))
  .slice(-6);
if (others.length > 1) {
  out.push("", "COMPARISON (latest games; active time only where logged)");
  out.push(`  ${"game".padEnd(7)} ${"score".padStart(5)} ${"active".padStart(8)} ${"script".padStart(7)} ${"agents".padStart(7)} ${"tok/chunk".padStart(9)} ${"repair%".padStart(7)}  title`);
  for (const o of others)
    out.push(
      `  ${o.gid.padEnd(7)} ${String(o.score?.overall ?? "—").padStart(5)} ${(o.activity.length ? fmtDuration(o.activeMs) : "—").padStart(8)} ${tok(o.scriptTokens).padStart(7)} ${(o.agentTokens ? tok(o.agentTokens) : "—").padStart(7)} ${(o.chunks ? tok(o.scriptTokens / o.chunks) : "—").padStart(9)} ${pctOf(o.repairTokens, o.scriptTokens).padStart(7)}  ${o.title}${o.gid === id ? "  ◀" : ""}`,
    );
}

console.log(out.join("\n"));
