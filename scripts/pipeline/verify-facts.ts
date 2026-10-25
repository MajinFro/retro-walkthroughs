/**
 * Stage 5 - Verification.
 *
 *   npx tsx scripts/pipeline/verify-facts.ts <gameId>                 # classify facts
 *   npx tsx scripts/pipeline/verify-facts.ts <gameId> --candidates    # find corroboration candidates
 *        [--type boss] [--limit 150]
 *
 * Rules (deterministic, no model judgement):
 *  - Every evidence quote must appear verbatim (whitespace/case/punctuation-normalized)
 *    in the cited chunk. "..." may be used to join two verbatim parts. Bad evidence is dropped.
 *  - A fact with no valid evidence is REJECTED.
 *  - Facts with the same (type, subject, predicate, object/location) after alias
 *    normalization are merged for source counting, unless both name different locations.
 *  - >= 2 distinct sources        -> VERIFIED
 *  - exactly 1 source             -> SINGLE_SOURCE (usable, flagged 🟡)
 *  - any valid "contradicts" evidence -> CONFLICT (blocks writing until resolved in 05_resolutions.json)
 */
import path from "node:path";
import { buildPlanDigest } from "./plan-prep.ts";
import {
  type Chunk,
  type Evidence,
  type Fact,
  type FactStatus,
  type VerifiedFact,
  type AchievementsFile,
  canon,
  checkFact,
  factCheckContext,
  quoteProblem,
  exists,
  flag,
  gameIdArg,
  keyTerms,
  loadAliases,
  loadChunks,
  fingerprintFiles,
  loadFacts,
  verifyInputFiles,
  norm,
  paths,
  readJson,
  readJsonOr,
  readJsonl,
  requireFile,
  writeJson,
  writeText,
} from "./lib.ts";

const SINGLE_VALUED = new Set(["boss", "missable", "ponr", "achievement", "npc", "quest", "event", "transition"]);

interface Corroboration extends Evidence {
  fact_id: string;
}
interface Resolution {
  fact_id: string;
  resolution: "accept" | "reject";
  rationale: string;
}

const id = gameIdArg();
const P = paths(id);
requireFile(P.chunks, "run rw:chunk first");
requireFile(P.achievements, "run rw:fetch first");

const chunks = loadChunks(P.chunks);
const aliases = loadAliases(P.aliases);
const ach = readJson<AchievementsFile>(P.achievements);
const facts = loadFacts(P.factsDir);
if (!facts.length) {
  console.error("No facts found in 04_facts/. Run the fact-extraction stage first.");
  process.exit(1);
}

const quoteOk = quoteProblem;

// ---------------------------------------------------------------------------
// 1. Schema + evidence validation
// ---------------------------------------------------------------------------
const seen = new Set<string>();
const problems = new Map<string, string[]>();
const addProblem = (fid: string, p: string) => problems.set(fid, [...(problems.get(fid) ?? []), p]);
const valid: Fact[] = [];
const rejected: VerifiedFact[] = [];

const ctx = factCheckContext(chunks, ach);
for (const f of facts) {
  const fid = f.id ?? "(missing id)";
  const dup = seen.has(fid);
  seen.add(fid);
  const { problems: ps, evidence: goodEv, reject } = checkFact(f, ctx);
  if (dup) addProblem(fid, "duplicate id");
  for (const p of ps) addProblem(fid, p);
  if (reject || dup) {
    rejected.push({ ...f, evidence: goodEv, status: "rejected", sources: [], problems: problems.get(fid) });
    continue;
  }
  valid.push({ ...f, evidence: goodEv });
}

// ---------------------------------------------------------------------------
// 2. Corroborations (added by the verifier agent)
// ---------------------------------------------------------------------------
const byId = new Map(valid.map((f) => [f.id, f]));
const corr = readJsonl<Corroboration>(P.corroborations);
let corrOk = 0;
for (const c of corr) {
  const f = byId.get(c.fact_id);
  if (!f) {
    addProblem(c.fact_id, `corroboration references unknown/rejected fact`);
    continue;
  }
  const err = quoteOk(c, chunks.get(c.chunk_id));
  if (err) {
    addProblem(c.fact_id, `corroboration rejected: ${err}`);
    continue;
  }
  f.evidence.push({ source_id: c.source_id, chunk_id: c.chunk_id, quote: c.quote, stance: c.stance ?? "supports", note: c.note });
  corrOk++;
}

// ---------------------------------------------------------------------------
// 3. Group equivalent facts across sources
// ---------------------------------------------------------------------------
// "describes" is the default predicate rw:extract fills in when a reply leaves it out; it says nothing
// about what the fact claims, so such a fact never corroborates or conflicts with another.
const isGeneric = (f: Fact) => norm(f.predicate) === "describes";
const keyOf = (f: Fact) =>
  isGeneric(f) ? `fact:${f.id}` : [f.type, canon(aliases, f.subject), norm(f.predicate), canon(aliases, f.object || f.location || "")].join("|");
const groups = new Map<string, Fact[]>();
for (const f of valid) groups.set(keyOf(f), [...(groups.get(keyOf(f)) ?? []), f]);
// When an object is set, two facts that both name a location must name the same one:
// "key | contains | key" in two different levels is two facts, not one confirmed twice.
// A fact without a location still matches (e.g. an HP list that omits where the enemy is).
const locOf = (f: Fact) => (f.object && f.location ? canon(aliases, f.location) : "");
const sameFact = (f: Fact) => (g: Fact) => !locOf(f) || !locOf(g) || locOf(f) === locOf(g);

const resolutions = readJsonOr<Resolution[]>(P.resolutions, []);
const resById = new Map(resolutions.map((r) => [r.fact_id, r]));

const out: VerifiedFact[] = [];
for (const f of valid) {
  const group = (groups.get(keyOf(f)) ?? [f]).filter(sameFact(f));
  const supportSources = new Set(group.flatMap((g) => g.evidence.filter((e) => e.stance !== "contradicts").map((e) => e.source_id)));
  const contradicted = group.some((g) => g.evidence.some((e) => e.stance === "contradicts"));
  let status: FactStatus = contradicted ? "conflict" : supportSources.size >= 2 ? "verified" : "single_source";
  const r = resById.get(f.id);
  if (r) status = r.resolution === "accept" ? (status === "conflict" ? "resolved" : status) : "rejected";
  out.push({ ...f, status, sources: [...supportSources], problems: problems.get(f.id) });
}

// Merge facts that make the same claim into one, keeping every quote: 10113 had 1,666 redundant rows,
// 1471 303, 1470 291, and the writer saw each claim two or three times in its packet. Only groups whose
// key names a value (object or location) merge, so different tactics for one boss stay separate. A fact
// without a location joins the group's located facts only when they all name the same place.
{
  const mergeable = (f: VerifiedFact) => (f.status === "verified" || f.status === "single_source") && !isGeneric(f) && !!(f.object || f.location);
  const byKey = new Map<string, VerifiedFact[]>();
  for (const f of out) if (mergeable(f)) byKey.set(keyOf(f), [...(byKey.get(keyOf(f)) ?? []), f]);
  for (const facts of byKey.values()) {
    if (facts.length < 2) continue;
    const places = new Set(facts.map(locOf).filter(Boolean));
    const clusters = new Map<string, VerifiedFact[]>();
    for (const f of facts) {
      const at = locOf(f) || (places.size === 1 ? [...places][0] : places.size === 0 ? "" : null);
      if (at === null) continue; // unlocated, and the group names several places: leave it alone
      clusters.set(at, [...(clusters.get(at) ?? []), f]);
    }
    for (const c of clusters.values()) {
      if (c.length < 2) continue;
      const keep = [...c].sort((a, b) => b.evidence.length - a.evidence.length || (b.text?.length ?? 0) - (a.text?.length ?? 0) || a.id.localeCompare(b.id))[0];
      const seen = new Set<string>();
      const evidence = c.flatMap((f) => f.evidence).filter((e) => {
        const k = `${e.chunk_id}|${norm(e.quote ?? "")}`;
        return seen.has(k) ? false : (seen.add(k), true);
      });
      const sources = [...new Set(c.flatMap((f) => f.sources))];
      Object.assign(keep, {
        evidence,
        sources,
        status: sources.length >= 2 ? "verified" : keep.status,
        achievement_ids: [...new Set(c.flatMap((f) => f.achievement_ids ?? []))],
        requires: [...new Set(c.flatMap((f) => f.requires ?? []))],
        missable: c.some((f) => f.missable),
        location: keep.location ?? c.find((f) => f.location)?.location ?? null,
        merged_ids: c.filter((f) => f !== keep).map((f) => f.id),
      });
      for (const f of c) if (f !== keep) Object.assign(f, { status: "duplicate", duplicate_of: keep.id });
    }
  }
}

// possible conflicts: same subject+predicate, different values, different sources
const loose = new Map<string, VerifiedFact[]>();
for (const f of out)
  if (SINGLE_VALUED.has(f.type) && f.status !== "rejected" && f.status !== "duplicate" && !isGeneric(f)) {
    const k = [f.type, canon(aliases, f.subject), norm(f.predicate)].join("|");
    loose.set(k, [...(loose.get(k) ?? []), f]);
  }
const possibleConflicts: { key: string; facts: { id: string; value: string; sources: string[] }[] }[] = [];
for (const [k, fs] of loose) {
  const values = new Set(fs.map((f) => canon(aliases, f.object || f.location || "")));
  const srcs = new Set(fs.flatMap((f) => f.sources));
  if (values.size > 1 && srcs.size > 1)
    possibleConflicts.push({ key: k, facts: fs.map((f) => ({ id: f.id, value: f.object || f.location || "", sources: f.sources })) });
}

// ---------------------------------------------------------------------------
// 4. Achievement coverage
// ---------------------------------------------------------------------------
const usable = (f: VerifiedFact) => f.status === "verified" || f.status === "single_source" || f.status === "resolved";
const coverage: Record<string, { title: string; facts: string[]; best: FactStatus | "none" }> = {};
for (const a of ach.achievements) {
  const fs = out.filter((f) => usable(f) && (f.achievement_ids ?? []).map(Number).includes(a.id));
  const isCollection = /collect every|all items/i.test(a.title + " " + a.description);
  const guideBacked = fs.filter((f) => f.sources.some((s) => s !== "ra-comments"));
  let best: FactStatus | "none" = fs.some((f) => f.status === "verified") ? "verified" : fs.length ? "single_source" : "none";
  if (isCollection && !guideBacked.length && fs.length) {
    // Cannot claim full support for collection achievements using only tautological ra-comments
    best = "none";
  }
  coverage[a.id] = { title: a.title, facts: (isCollection && !guideBacked.length) ? [] : fs.map((f) => f.id), best };
}

// ---------------------------------------------------------------------------
// --candidates mode: find chunks in OTHER sources that may corroborate single-source facts
// ---------------------------------------------------------------------------
if (flag("candidates")) {
  const priority = ["achievement", "missable", "ponr", "boss", "transition", "item", "event", "quest", "npc", "shop", "save_point", "location", "mechanic", "tip", "enemy", "map"];
  const typeFilter = flag("type");
  const limit = Number(flag("limit") ?? 150);
  const allChunks = [...chunks.values()];
  const todo = out
    .filter((f) => f.status === "single_source" && (!typeFilter || f.type === typeFilter))
    .sort((a, b) => priority.indexOf(a.type) - priority.indexOf(b.type))
    .slice(0, limit);
  const lines: string[] = [
    `# Corroboration candidates for game ${id}`,
    "",
    "For each fact, open the candidate chunk(s) (`npm run rw:chunks -- <id> --id <chunk>`).",
    "If a chunk supports or contradicts the fact, append a line to `05_corroborations.jsonl`:",
    '`{"fact_id":"...","source_id":"...","chunk_id":"...","quote":"<verbatim>","stance":"supports|contradicts","note":"..."}`',
    "",
  ];
  let withCand = 0;
  for (const f of todo) {
    const terms = keyTerms([f.subject, f.object ?? "", f.location ?? ""].join(" "));
    const subjTerms = keyTerms(f.subject);
    if (!terms.length) continue;
    const scored = allChunks
      .filter((c) => !f.sources.includes(c.source_id))
      .map((c) => {
        const t = norm(c.text);
        const hit = terms.filter((w) => t.includes(w));
        const subjHit = subjTerms.length === 0 || subjTerms.some((w) => t.includes(w));
        return { c, score: subjHit ? hit.length : 0, hit };
      })
      .filter((x) => x.score >= Math.min(2, terms.length))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    if (!scored.length) continue;
    withCand++;
    lines.push(`## ${f.id} (${f.type}) — ${f.text}`);
    for (const s of scored) {
      const low = s.c.text.toLowerCase();
      const at = Math.max(0, low.indexOf(s.hit[0]) - 150);
      const snip = s.c.text.slice(at, at + 350).replace(/\s+/g, " ").trim();
      lines.push(`- **${s.c.chunk_id}** [${s.c.section}] terms: ${s.hit.join(", ")}`, `  > …${snip}…`);
    }
    lines.push("");
  }
  writeText(P.corroborationCandidates, lines.join("\n"));
  console.log(`Wrote candidates for ${withCand}/${todo.length} single-source facts -> ${path.relative(P.root, P.corroborationCandidates)}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Write + report
// ---------------------------------------------------------------------------
const all = [...out, ...rejected];
const count = (s: FactStatus) => all.filter((f) => f.status === s).length;
const unresolved = out.filter((f) => f.status === "conflict");
const stats = {
  total: all.length,
  verified: count("verified"),
  single_source: count("single_source"),
  conflict: unresolved.length,
  resolved: count("resolved"),
  rejected: count("rejected"),
  duplicate: count("duplicate"),
  corroborations_accepted: corrOk,
  achievements_total: ach.achievements.length,
  achievements_verified: Object.values(coverage).filter((c) => c.best === "verified").length,
  achievements_single: Object.values(coverage).filter((c) => c.best === "single_source").length,
  achievements_unsupported: Object.values(coverage).filter((c) => c.best === "none").length,
  sources: [...new Set(out.flatMap((f) => f.sources))],
};
// inputs fingerprint lets rw:status tell when fact files changed after this verification run
writeJson(P.verified, { generated_at: new Date().toISOString(), inputs: fingerprintFiles(verifyInputFiles(P)), stats, coverage, possible_conflicts: possibleConflicts, facts: all });

console.log(`Stage 5 verification for game ${id}`);
console.log(`  facts: ${stats.total}  ✅ verified ${stats.verified}  🟡 single ${stats.single_source}  ⚠️ conflict ${stats.conflict}  ✔ resolved ${stats.resolved}  ❌ rejected ${stats.rejected}  ⧉ merged duplicates ${stats.duplicate}`);
console.log(`  achievements: ${stats.achievements_verified} verified, ${stats.achievements_single} single-source, ${stats.achievements_unsupported} UNSUPPORTED of ${stats.achievements_total}`);
if (possibleConflicts.length) console.log(`  possible conflicts to triage: ${possibleConflicts.length} (see possible_conflicts in 05_verified.json)`);
const rej = rejected.slice(0, 15);
if (rej.length) {
  console.log(`\n  Rejected facts (first ${rej.length}):`);
  for (const r of rej) console.log(`   - ${r.id}: ${(r.problems ?? []).join("; ")}`);
}
const unsupported = Object.entries(coverage).filter(([, c]) => c.best === "none");
if (unsupported.length) {
  console.log(`\n  Achievements with NO supporting fact (extract more, or the guide must say "Unable to verify"):`);
  for (const [aid, c] of unsupported) console.log(`   - ${aid} ${c.title}`);
}
if (unresolved.length) {
  console.log(`\n  ⛔ ${unresolved.length} unresolved conflict(s). Add entries to 05_resolutions.json before writing:`);
  for (const f of unresolved.slice(0, 20)) console.log(`   - ${f.id}: ${f.text}`);
  process.exit(2);
}
if (!exists(P.aliases)) console.log(`\n  Tip: create 05_aliases.json ({"Canonical": ["alias"]}) to merge naming differences between guides.`);
const digestOut = buildPlanDigest(id);
console.log(`  plan digest -> ${path.relative(P.root, digestOut)}`);
