/**
 * Second-model check of a chapter's route steps against the facts they cite (accuracy pass, after rw:write).
 *
 *   npx tsx scripts/pipeline/check-directions.ts <gameId> [chapterN ...]      (npm run rw:directions -- <gameId>)
 *
 * rw:qa already compares step counts and room numbers with the cited facts, deterministically. This asks a cheap
 * model (the extraction backend: Gemini Flash through agy by default, so no Claude tokens) the question a regex
 * cannot: does this step contradict, extend or reorder what its quotes say? Findings go to 09_directions.json
 * with a hash of the chapter text; rw:qa reports them as warnings only while the chapter is unchanged, and
 * rw:write --fix revises the chapter with the source passages in view.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { type Roadmap } from "./graph.ts";
import { addUsage, formatUsage, parseJsonReply, runAll, type LlmRequest, type Usage } from "./llm.ts";
import { CITE_RE, type VerifiedFact, chapterFile, gameIdArg, paths, readJson, readJsonOr, readText, routeTokens, writeJson } from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
const roadmap = readJson<Roadmap>(P.roadmap);
const verified = readJson<{ facts: VerifiedFact[] }>(P.verified);
const factById = new Map(verified.facts.map((f) => [f.id, f]));
const wanted = process.argv.slice(3).filter((a) => /^\d+$/.test(a));
const chapters = roadmap.chapters.map((c) => c.n).filter((n) => !wanted.length || wanted.includes(String(n)));

const DIRECTIONISH = /\b(room|floor|north|south|east|west|left|right|upstairs|downstairs|stairs?|door|exit|entrance|corner|wall|path|bridge|ladder|warp)\b/i;
const sha = (s: string) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);

interface Step { line: number; text: string; quotes: string[] }

function stepsOf(text: string): Step[] {
  const out: Step[] = [];
  text.split(/\r?\n/).forEach((l, i) => {
    if (/^\s*(#|\||>\s*\[!)/.test(l)) return;
    const fids = [...l.matchAll(CITE_RE)].flatMap((m) => m[1].split(",").map((s) => s.trim()));
    if (!fids.length) return;
    if (!routeTokens(l).length && !(/^\s*(\d+\.|[-*])\s/.test(l) && DIRECTIONISH.test(l))) return;
    const quotes = [...new Set(fids.flatMap((fid) => {
      const f = factById.get(fid);
      return f ? [`${f.text}`, ...(f.evidence ?? []).filter((e) => e.stance !== "contradicts").map((e) => e.quote ?? "")] : [];
    }))].map((q) => q.replace(/\s+/g, " ").trim().slice(0, 420)).filter(Boolean);
    if (quotes.length) out.push({ line: i + 1, text: l.replace(CITE_RE, "").replace(/\s+/g, " ").trim(), quotes });
  });
  return out;
}

const SYSTEM = `You check the route steps of a video-game walkthrough against the source quotes each step cites. You reply with JSON only.

For every STEP decide whether the step is supported by its QUOTES. Mark "issue" only when the step
- gives a direction, step count, room number, floor or order that differs from the quotes (north/up/forward count the same; "left" is not "right"),
- adds a route action, item location or condition that no quote states (including turning an "if" branch into a plain statement),
- puts rooms, floors or actions in an order the quotes contradict, or repeats a room the quotes mention once.
A step that is merely shorter, rephrased or friendlier than the quotes is "ok". Quotes may hold more than the step uses. Ignore style, spelling and citations.

Reply: {"results":[{"n":<step number>,"verdict":"ok"|"issue","issue":"<one sentence naming the exact difference, only for issue>"}]}`;

const BATCH = 35;
const reqs: LlmRequest[] = [];
const meta = new Map<string, Step[]>();
const hashes = new Map<number, string>();
for (const n of chapters) {
  const file = path.join(P.chaptersDir, chapterFile(n));
  if (!fs.existsSync(file)) continue;
  const text = readText(file);
  hashes.set(n, sha(text));
  const steps = stepsOf(text);
  for (let i = 0; i < steps.length; i += BATCH) {
    const batch = steps.slice(i, i + BATCH);
    const key = `ch${n}.${i / BATCH}`;
    meta.set(key, batch);
    reqs.push({
      key,
      tier: "extract",
      system: SYSTEM,
      user: batch.map((s, k) => `STEP ${k + 1}: ${s.text}\nQUOTES:\n${s.quotes.map((q) => `- ${q}`).join("\n")}`).join("\n\n"),
      maxTokens: 4000,
    });
  }
}

const found = new Map<number, { line: number; text: string; issue: string }[]>();
let usage: Usage = { input: 0, output: 0, cache_read: 0, cache_write: 0 };
let errors = 0;
await runAll(reqs, {
  usageLog: path.join(P.dir, "_usage.jsonl"),
  stage: "directions",
  onResult: (r) => {
    usage = addUsage(usage, r.usage);
    const batch = meta.get(r.key)!;
    const n = Number(r.key.match(/^ch(\d+)/)![1]);
    try {
      const res = parseJsonReply<{ results?: { n: number; verdict: string; issue?: string }[] }>(r.text).results ?? [];
      for (const x of res)
        if (x.verdict === "issue" && batch[x.n - 1]) found.set(n, [...(found.get(n) ?? []), { line: batch[x.n - 1].line, text: batch[x.n - 1].text.slice(0, 120), issue: String(x.issue ?? "").slice(0, 240) }]);
    } catch {
      errors++;
      console.log(`  ${r.key}: no usable reply${r.error ? ` (${r.error.slice(0, 80)})` : ""}`);
    }
  },
});

const prior = readJsonOr<{ chapters?: Record<string, unknown> }>(path.join(P.dir, "09_directions.json"), {});
const outChapters: Record<string, unknown> = { ...(wanted.length ? prior.chapters : {}) };
for (const n of chapters) if (hashes.has(n)) outChapters[String(n)] = { hash: hashes.get(n), findings: found.get(n) ?? [] };
writeJson(path.join(P.dir, "09_directions.json"), { generated_at: new Date().toISOString(), chapters: outChapters });
const total = [...found.values()].reduce((s, l) => s + l.length, 0);
console.log(`directions check: ${reqs.length} batch(es), ${total} step(s) flagged${errors ? `, ${errors} batch(es) unreadable` : ""} · ${formatUsage(usage)}`);
for (const [n, list] of found) for (const f of list.slice(0, 3)) console.log(`  ch${n}:${f.line}: ${f.issue}`);
