/**
 * Stage 4 - Fact extraction by direct model calls (replaces one agent per batch).
 *
 *   npx tsx scripts/pipeline/extract-facts.ts <gameId>
 *        [--source gf1] [--max-batches N] [--concurrency N] [--model haiku] [--batch] [--full] [--dry-run]
 *
 * For every unprocessed chunk (no fact cites it, not in _skipped.txt):
 *   1. group chunks into batches (same source, contiguous, size-capped)
 *   2. one model call per batch: the ra-fact-extractor rules + achievements as the system prompt, the chunks as the message
 *   3. check every returned fact with the same rules as rw:verify (verbatim quotes, numbers, overlap, schema)
 *   4. one repair call per batch for rejected facts and chunks the model left unaccounted for
 *   5. renumber ids (<source>-<chunk n>-<k>, unique across all fact files) and write 04_facts/<source>_<from>-<to>.jsonl,
 *      skip reasons to _skipped.txt
 *
 * Secondary full walkthroughs (every guide >= 100k chars after the first one, unless sources.json sets
 * "extract": "full") get a focused prompt: high-value facts only, no story or plain navigation. --full disables that.
 * Re-running continues where it stopped: only chunks that are still unprocessed are sent.
 */
import fs from "node:fs";
import path from "node:path";
import { type LlmRequest, type LlmResult, type Usage, addUsage, backend, defaultConcurrency, formatUsage, modelFor, parseJsonReply, runAll, skillText } from "./llm.ts";
import {
  type AchievementsFile,
  type Chunk,
  type Fact,
  type SourceEntry,
  EOL,
  checkFact,
  chunkProgress,
  factCheckContext,
  flag,
  gameIdArg,
  loadChunks,
  loadFacts,
  loadSkipped,
  norm,
  paths,
  readJson,
  readJsonl,
  requireFile,
} from "./lib.ts";

const MAX_BATCH_CHARS = 16_000;
const MAX_BATCH_CHUNKS = 8;
const MAX_MAP_BATCH = 40; // map sources are one tiny chunk each
const FOCUS_MIN_CHARS = 100_000;

const id = gameIdArg();
const P = paths(id);
requireFile(P.chunks, "run rw:chunk first");
requireFile(P.achievements, "run rw:fetch first");

const ach = readJson<AchievementsFile>(P.achievements);
const sources = readJson<(SourceEntry & { extract?: "full" | "focused" })[]>(P.sourcesManifest);
const chunkList = readJsonl<Chunk>(P.chunks);
const chunks = loadChunks(P.chunks);
const ctx = factCheckContext(chunks, ach);
const sourceById = new Map(sources.map((s) => [s.id, s]));

// ---------------------------------------------------------------------------
// Extraction mode per source
// ---------------------------------------------------------------------------
const primaryGuide = sources.find((s) => s.kind === "guide")?.id;
function mode(src: string): "full" | "focused" {
  const s = sourceById.get(src);
  if (!s || flag("full")) return "full";
  if (s.extract) return s.extract;
  return s.kind === "guide" && s.id !== primaryGuide && (s.chars ?? 0) >= FOCUS_MIN_CHARS ? "focused" : "full";
}
// order: primary guide, the RA achievement guide and comments, then the rest (corroborating sources)
const rank = (src: string) => (src === primaryGuide ? 0 : src === "ra-comments" || src === "ra-guide" ? 1 : sourceById.get(src)?.kind === "map" ? 3 : 2);

// ---------------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------------
interface Batch {
  name: string; // output file stem
  mode: "full" | "focused";
  chunks: Chunk[];
}

const onlySource = flag("source");
const { unprocessed } = chunkProgress(chunkList, loadFacts(P.factsDir), loadSkipped(P.factsDir));
const todo = unprocessed
  .filter((c) => !onlySource || c.source_id === onlySource)
  .sort((a, b) => rank(a.source_id) - rank(b.source_id) || sources.findIndex((s) => s.id === a.source_id) - sources.findIndex((s) => s.id === b.source_id) || a.n - b.n);

const batches: Batch[] = [];
const isMap = (c: Chunk) => sourceById.get(c.source_id)?.kind === "map";
for (const c of todo) {
  const cur = batches[batches.length - 1];
  const last = cur?.chunks[cur.chunks.length - 1];
  const fits =
    cur &&
    (isMap(c)
      ? isMap(last!) && cur.chunks.length < MAX_MAP_BATCH
      : last!.source_id === c.source_id && c.n - cur.chunks[0].n < 12 && cur.chunks.length < MAX_BATCH_CHUNKS && cur.chunks.reduce((n, x) => n + x.text.length, 0) + c.text.length <= MAX_BATCH_CHARS);
  if (fits) cur.chunks.push(c);
  else batches.push({ name: "", mode: mode(c.source_id), chunks: [c] });
}
for (const b of batches) {
  const first = b.chunks[0];
  const last = b.chunks[b.chunks.length - 1];
  let stem = isMap(first) ? `maps_${first.source_id}` : `${first.source_id}_${first.n}-${last.n}`;
  for (let i = 2; fs.existsSync(path.join(P.factsDir, `${stem}.jsonl`)); i++) stem = `${stem.replace(/_r\d+$/, "")}_r${i}`;
  b.name = stem;
}
const maxBatches = Number(flag("max-batches") ?? Infinity);
const run = batches.slice(0, maxBatches);
// medium: same facts as the model default on a 3-batch Spyro test, 13% less output (7% fewer tokens);
// "low" cut output ~30% but extracted ~30% fewer facts. RW_EFFORT_EXTRACT or --effort overrides.
const effort = (flag("effort") ?? process.env.RW_EFFORT_EXTRACT ?? "medium") as LlmRequest["effort"];

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------
const HEADER = `You are the Stage 4 fact extractor of an evidence-first walkthrough pipeline, running non-interactively.
You receive a batch of source chunks and reply with JSON only. You cannot run commands or read files; everything you need is in this prompt and the message.

## Reply format (exactly one fenced json block, nothing else)

\`\`\`json
{"facts": [ <fact objects per the schema below> ],
 "skipped": [ {"chunk_id": "gf1#3", "reason": "table of contents"} ]}
\`\`\`

- Every chunk in the batch must be cited by at least one fact's evidence or listed in "skipped" with a specific reason.
- Compact form: the script fills in what it can derive, so leave these out of each fact: \`id\`, and \`source_id\` in evidence (it comes from \`chunk_id\`). Also leave out any of these that have their default value: \`"object": null\`, \`"location": null\`, \`"requires": []\`, \`"achievement_ids": []\`, \`"missable": false\`. Example: {"type":"item","subject":"Stone Hill","predicate":"contains_item","object":"Dragon Egg","location":"Stone Hill","text":"…","evidence":[{"chunk_id":"gf1#40","quote":"…"}]}
- Evidence must quote the chunk it names, and only chunks in this batch.
- The script checks every fact exactly like rw:verify (quote found verbatim, multi-digit numbers present in a quote, word overlap between text and quote, schema). Facts that fail are sent back to you once, then dropped.`;

const FOCUS = `## FOCUSED MODE for this source

This chunk comes from a SECONDARY full walkthrough. The primary walkthrough has already been extracted in full, so do not restate story or plain navigation ("go north, talk to the guard"). Extract ONLY these, with the same rigor as full mode:
- every treasure chest, hidden item, hidden box and its exact location and contents
- boss HP, weaknesses, rewards and strategy; enemy drops
- puzzle and minigame solutions, rules, counts and timings
- missables, deadlines, points of no return
- anything tied to an RA achievement description
- prices, counts, numbers, and any statement that disagrees with or adds to common walkthrough flow (alternate routes, warnings, tips)
Nearly every walkthrough chunk contains at least one of these; skip a chunk only when it truly has none ("secondary source: story/navigation only").`;

const achList = ach.achievements.map((a) => `- ${a.id}: ${a.title} — ${a.description}${a.type ? ` [${a.type}]` : ""}`).join("\n");
const systemFor = (m: "full" | "focused") =>
  [
    HEADER,
    skillText("ra-fact-extractor", ["Workflow"]),
    m === "focused" ? FOCUS : "",
    `## Achievements of ${ach.title} (${ach.console}) — use these ids in achievement_ids\n\n${achList}`,
  ]
    .filter(Boolean)
    .join("\n\n");

const chunkBlock = (c: Chunk) => {
  const s = sourceById.get(c.source_id);
  return `### CHUNK ${c.chunk_id} — source_id "${c.source_id}" (${s?.kind ?? "?"}: ${c.source_title}) — section: ${c.section}${c.has_ascii_map ? " — contains ASCII map" : ""}\n\`\`\`text\n${c.text.replace(/```/g, "'''")}\n\`\`\``;
};
const batchMessage = (b: Batch) =>
  `Game ${id}: ${ach.title}. Extract facts from these ${b.chunks.length} chunk(s): ${b.chunks.map((c) => c.chunk_id).join(", ")}.\n\n${b.chunks.map(chunkBlock).join("\n\n")}`;

// ---------------------------------------------------------------------------
// Checking replies
// ---------------------------------------------------------------------------
interface Reply {
  facts?: Fact[];
  skipped?: { chunk_id: string; reason: string }[];
}
interface Checked {
  good: Fact[];
  bad: { fact: Fact; problems: string[] }[];
  skipped: Map<string, string>;
  missing: string[]; // chunk ids neither cited by a good fact nor skipped
  widened: number; // facts saved by widening a quote to its sentence (no repair call needed)
  error?: string;
}

/** Expand the compact reply form: fill derivable fields and defaults, in the canonical key order. */
function expand(f: Partial<Fact>): Fact {
  return {
    id: "x-1-1", // placeholder; renumber() assigns the real id
    type: f.type!,
    subject: f.subject!,
    predicate: f.predicate!,
    object: f.object ?? null,
    location: f.location ?? null,
    requires: f.requires ?? [],
    achievement_ids: f.achievement_ids ?? [],
    missable: f.missable ?? false,
    text: f.text!,
    evidence: (f.evidence ?? []).map((e) => ({ ...e, source_id: e.source_id || chunks.get(e.chunk_id)?.source_id || "" })),
  } as Fact;
}

/**
 * "Unquoted number" is the rule a model most often trips: its quote stops short of the number it states.
 * When the number is in the same sentence of the chunk, widen the quote to that verbatim sentence
 * instead of spending a repair call. The fact is then re-checked with the normal rules.
 */
function widenForNumbers(f: Fact): Fact | null {
  let changed = false;
  const evidence = f.evidence.map((e) => {
    const c = chunks.get(e.chunk_id);
    const first = (e.quote ?? "").split(/\.\.\.|…/)[0];
    const words = first.match(/[A-Za-z0-9']+/g);
    if (!c || !words || words.length < 2) return e;
    const m = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^A-Za-z0-9']+"), "i").exec(c.text);
    if (!m) return e;
    const before = c.text.slice(0, m.index);
    const start = Math.max(before.search(/(?:[.!?]\s+|\n\s*\n)(?=[^.!?\n]*$)/) + 1, 0);
    const afterEnd = c.text.slice(m.index + m[0].length).search(/[.!?](\s|$)|\n\s*\n/);
    const end = afterEnd < 0 ? c.text.length : m.index + m[0].length + afterEnd + 1;
    const sentence = c.text.slice(start, end).trim();
    if (sentence.length > 400 || sentence.length <= first.length) return e;
    changed = true;
    return { ...e, quote: sentence };
  });
  return changed ? { ...f, evidence } : null;
}

function check(b: Batch, r: LlmResult, prior?: Checked): Checked {
  const inBatch = new Set(b.chunks.map((c) => c.chunk_id));
  const out: Checked = { good: [...(prior?.good ?? [])], bad: [], skipped: new Map(prior?.skipped ?? []), missing: [], widened: 0 };
  let reply: Reply = {};
  if (r.error && !r.text) out.error = r.error;
  else {
    try {
      reply = parseJsonReply<Reply>(r.text);
    } catch (e) {
      out.error = (e as Error).message;
    }
  }
  for (const raw of reply.facts ?? []) {
    let f = expand(raw);
    const outside = f.evidence.filter((e) => !inBatch.has(e.chunk_id)).map((e) => e.chunk_id);
    let { problems, evidence, reject } = checkFact(f, ctx);
    if (reject && !outside.length && problems.length && problems.every((p) => /^unquoted number/.test(p))) {
      const wide = widenForNumbers(f);
      const again = wide && checkFact(wide, ctx);
      if (again && !again.reject) {
        f = wide!;
        ({ problems, evidence, reject } = again);
        out.widened++;
      }
    }
    if (outside.length) problems.push(`evidence cites chunk(s) outside this batch: ${outside.join(", ")}`);
    if (reject || outside.length) out.bad.push({ fact: f, problems });
    else out.good.push({ ...f, evidence });
  }
  for (const s of reply.skipped ?? []) if (inBatch.has(s.chunk_id) && s.reason?.trim()) out.skipped.set(s.chunk_id, s.reason.trim());
  const cited = new Set(out.good.flatMap((f) => f.evidence.map((e) => e.chunk_id)));
  for (const c of cited) out.skipped.delete(c);
  out.missing = b.chunks.map((c) => c.chunk_id).filter((c) => !cited.has(c) && !out.skipped.has(c));
  return out;
}

function repairMessage(b: Batch, c: Checked): string {
  // resend only the chunks the rejected facts and unaccounted chunks come from (the whole batch after an unusable reply)
  const inBatch = new Set(b.chunks.map((x) => x.chunk_id));
  const needed = new Set([...c.missing, ...c.bad.flatMap((x) => (x.fact.evidence ?? []).map((e) => e.chunk_id))].filter((cid) => inBatch.has(cid)));
  const sub = c.error || !needed.size ? b : { ...b, chunks: b.chunks.filter((x) => needed.has(x.chunk_id)) };
  const parts = [batchMessage(sub), "", "## Your previous reply needs fixing"];
  if (c.error) parts.push(`It could not be used: ${c.error}. Reply again in the required format.`);
  if (c.bad.length) {
    parts.push("These facts were rejected. Return a corrected version of each (fix the quote so it is copied verbatim from the chunk and contains every multi-digit number in the text, or narrow the text to what the quote says), or leave it out if the chunk does not support it:");
    for (const x of c.bad) parts.push(`- ${JSON.stringify(x.fact)}\n  problems: ${x.problems.join("; ")}`);
  }
  if (c.missing.length) parts.push(`These chunks are not accounted for (no valid fact cites them and they are not skipped): ${c.missing.join(", ")}. Extract their facts, or skip them with a specific reason if they contain no gameplay information.`);
  parts.push(`All other facts from your previous reply were ACCEPTED and saved. Reply with ONLY the ${c.bad.length} corrected fact(s)${c.missing.length ? " and the facts/skips for the unaccounted chunks" : ""}. Do not repeat accepted facts.`);
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------
const nextK = new Map<string, number>(); // "<source>-<n>" -> highest k used
for (const f of loadFacts(P.factsDir)) {
  const m = f.id?.match(/^(.*-\d+)-(\d+)$/);
  if (m) nextK.set(m[1], Math.max(nextK.get(m[1]) ?? 0, Number(m[2])));
}
function renumber(f: Fact): Fact {
  const ev = f.evidence[0];
  const chunk = chunks.get(ev.chunk_id)!;
  const base = `${chunk.source_id}-${chunk.n}`;
  const k = (nextK.get(base) ?? 0) + 1;
  nextK.set(base, k);
  const { id: _old, ...rest } = f;
  return { id: `${base}-${k}`, ...rest, achievement_ids: (f.achievement_ids ?? []).map(Number), evidence: f.evidence.map(({ stance, ...e }) => (stance === "contradicts" ? { ...e, stance } : e)) };
}

function write(b: Batch, c: Checked, append: boolean): number {
  const facts = c.good.map(renumber);
  const file = path.join(P.factsDir, `${b.name}.jsonl`);
  fs.mkdirSync(P.factsDir, { recursive: true });
  if (facts.length) {
    const body = facts.map((f) => JSON.stringify(f)).join(EOL) + EOL;
    if (append) fs.appendFileSync(file, body, "utf8");
    else fs.writeFileSync(file, body, "utf8");
  }
  const skipFile = path.join(P.factsDir, "_skipped.txt");
  const skipLines = [...c.skipped].map(([cid, reason]) => `${cid} ${reason.replace(/\s+/g, " ")}`);
  if (skipLines.length) {
    const prefix = fs.existsSync(skipFile) && !/\n$/.test(fs.readFileSync(skipFile, "utf8")) ? EOL : "";
    fs.appendFileSync(skipFile, prefix + skipLines.join(EOL) + EOL, "utf8");
  }
  return facts.length;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const focused = [...new Set(run.filter((b) => b.mode === "focused").flatMap((b) => b.chunks.map((c) => c.source_id)))];
console.log(`Stage 4 extraction for game ${id} — ${todo.length} unprocessed chunk(s) in ${batches.length} batch(es)${run.length < batches.length ? `, running ${run.length}` : ""}`);
console.log(`  backend ${backend()}, model ${modelFor("extract", flag("model"))}${effort ? `, effort ${effort}` : ""}${flag("batch") ? ", Message Batches API" : `, ${Number(flag("concurrency") ?? defaultConcurrency())} at a time`}`);
if (focused.length) console.log(`  focused mode (secondary walkthroughs): ${focused.join(", ")} — pass --full to extract them fully`);
if (flag("dry-run")) {
  for (const b of run) console.log(`  ${b.name.padEnd(28)} ${b.mode.padEnd(8)} ${b.chunks.map((c) => c.chunk_id).join(" ")}`);
  process.exit(0);
}
if (!run.length) {
  console.log("✅ Nothing to extract. Next: npm run rw:verify -- " + id);
  process.exit(0);
}

const usageLog = path.join(P.dir, "_usage.jsonl");
const opts = { concurrency: Number(flag("concurrency") ?? defaultConcurrency()), model: flag("model"), batch: Boolean(flag("batch")), usageLog, stage: "extract" };
let usage: Usage = { input: 0, output: 0, cache_read: 0, cache_write: 0 };
const byKey = new Map(run.map((b) => [b.name, b]));
const pending = new Map<string, Checked>();
const totals = { facts: 0, skipped: 0, dropped: 0, unaccounted: [] as string[], failed: [] as string[] };
let done = 0;

// why facts get rejected, so repair rules can be tuned from data (round 1 = sent to repair, 2 = dropped)
const rejectLog = path.join(P.dir, "_extract_rejects.jsonl");
const rejectKinds = new Map<string, number>();
let widenedTotal = 0;
function logRejects(b: Batch, c: Checked, round: 1 | 2) {
  widenedTotal += c.widened;
  const rows = c.bad.map((x) => ({ at: new Date().toISOString(), round, batch: b.name, problems: x.problems, text: x.fact.text }));
  for (const r of rows) for (const p of r.problems) {
    const k = p.replace(/[:(].*$/, "").trim();
    rejectKinds.set(k, (rejectKinds.get(k) ?? 0) + 1);
  }
  if (round === 1 && c.missing.length) rejectKinds.set("chunk unaccounted for", (rejectKinds.get("chunk unaccounted for") ?? 0) + c.missing.length);
  if (rows.length) fs.appendFileSync(rejectLog, rows.map((r) => JSON.stringify(r)).join(EOL) + EOL, "utf8");
}

const req = (b: Batch, user: string): LlmRequest => ({ key: b.name, tier: "extract", system: systemFor(b.mode), user, maxTokens: 32000, effort });
// a repair reply sometimes repeats facts that were already accepted; never write the same fact twice
const factKey = (f: Fact) => `${f.evidence[0]?.chunk_id}|${norm(f.text)}`;
const accepted = new Map<string, Set<string>>(); // batch name -> fact keys written

await runAll(run.map((b) => req(b, batchMessage(b))), {
  ...opts,
  onResult: (r) => {
    usage = addUsage(usage, r.usage);
    const b = byKey.get(r.key)!;
    const c = check(b, r);
    logRejects(b, c, 1);
    const seenKeys = new Set<string>();
    c.good = c.good.filter((f) => !seenKeys.has(factKey(f)) && Boolean(seenKeys.add(factKey(f))));
    accepted.set(b.name, seenKeys);
    // keep what passed now so an interrupted run loses nothing; the repair pass appends to the same file
    totals.facts += write(b, c, false);
    totals.skipped += c.skipped.size;
    done++;
    const note = c.error ? `error: ${c.error.slice(0, 80)}` : `${c.good.length} facts, ${c.skipped.size} skipped${c.bad.length ? `, ${c.bad.length} rejected` : ""}${c.missing.length ? `, ${c.missing.length} chunk(s) unaccounted` : ""}`;
    console.log(`  [${done}/${run.length}] ${b.name}: ${note}`);
    if (c.error || c.bad.length || c.missing.length) pending.set(b.name, { ...c, good: [], skipped: new Map() });
  },
});

if (pending.size) {
  console.log(`\nRepair pass: ${pending.size} batch(es)`);
  await runAll([...pending].map(([name, c]) => req(byKey.get(name)!, repairMessage(byKey.get(name)!, c))), {
    ...opts,
    stage: "extract-repair",
    onResult: (r) => {
      usage = addUsage(usage, r.usage);
      const b = byKey.get(r.key)!;
      const first = pending.get(b.name)!;
      const c = check(b, r);
      logRejects(b, c, 2);
      // chunks accounted for in the first pass stay accounted for; only the missing ones may be skipped now
      const wasMissing = (cid: string) => Boolean(first.error) || first.missing.includes(cid);
      for (const cid of [...c.skipped.keys()]) if (!wasMissing(cid)) c.skipped.delete(cid);
      const stillMissing = c.missing.filter(wasMissing);
      const keys = accepted.get(b.name)!;
      const before = c.good.length;
      c.good = c.good.filter((f) => !keys.has(factKey(f)) && Boolean(keys.add(factKey(f))));
      const repeated = before - c.good.length;
      totals.facts += write(b, c, true);
      totals.skipped += c.skipped.size;
      totals.dropped += c.bad.length;
      if (c.error) totals.failed.push(b.name);
      totals.unaccounted.push(...stillMissing);
      console.log(`  ${b.name}: +${c.good.length} facts, +${c.skipped.size} skipped${repeated ? `, ${repeated} repeats ignored` : ""}${c.bad.length ? `, ${c.bad.length} dropped` : ""}${stillMissing.length ? `, still unaccounted: ${stillMissing.join(" ")}` : ""}${c.error ? ` (error: ${c.error.slice(0, 80)})` : ""}`);
    },
  });
}

console.log(`\nWrote ${totals.facts} facts, ${totals.skipped} skip(s); dropped ${totals.dropped} fact(s) that failed twice.`);
if (widenedTotal) console.log(`  ${widenedTotal} fact(s) kept by widening a quote to its sentence (no repair call)`);
if (rejectKinds.size)
  console.log(`  rejection reasons: ${[...rejectKinds].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`).join(", ")} (details: ${path.relative(P.root, rejectLog)})`);
if (totals.unaccounted.length) console.log(`  ${totals.unaccounted.length} chunk(s) still unprocessed — re-run rw:extract to retry them.`);
console.log(`  usage: ${formatUsage(usage)} (logged to ${path.relative(P.root, usageLog)})`);
console.log(`Next: npm run rw:verify -- ${id}${batches.length > run.length ? `  (then rw:extract again: ${batches.length - run.length} batch(es) left)` : ""}`);
