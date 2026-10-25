/**
 * Stage 6-7 prep - build a compact route-planning digest (06_plan_digest.md) from 05_verified.json.
 *
 *   npx tsx scripts/pipeline/plan-prep.ts <gameId>
 *
 * Pre-computes location groupings in source progression order, candidate alias clusters, possible conflicts
 * with quotes, achievement coverage (and candidate facts for unsupported achievements), missables/PONRs, and
 * lockout lines from ra-comments so the Stage 6-7 Opus agent can plan the graph and roadmap in a few turns
 * instead of dozens of Grep/Read calls across 05_verified.json.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type AchievementsFile,
  type SourceEntry,
  type VerifiedFact,
  canon,
  exists,
  gameIdArg,
  keyTerms,
  loadAliases,
  paths,
  readJson,
  readText,
  readUsedSources,
  requireFile,
  writeText,
} from "./lib.ts";

export function buildPlanDigest(id: string): string {
  const P = paths(id);
  requireFile(P.verified, "run rw:verify first");
  requireFile(P.achievements, "run rw:fetch first");

  const ach = readJson<AchievementsFile>(P.achievements);
  const verified = readJson<{
    stats: Record<string, any>;
    coverage: Record<string, { title: string; facts: string[]; best: string }>;
    possible_conflicts: { key: string; facts: { id: string; value: string; sources: string[] }[] }[];
    facts: VerifiedFact[];
  }>(P.verified);
  const aliases = loadAliases(P.aliases);
  const sources = readUsedSources(P.sourcesManifest);
  const guides = sources.filter((s) => s.kind === "guide");
  const primaryGuide = (guides.find((s) => (s as SourceEntry & { primary?: boolean }).primary) ?? [...guides].sort((a, b) => (b.chars ?? 0) - (a.chars ?? 0))[0])?.id;

  const usable = verified.facts.filter((f) => ["verified", "single_source", "resolved"].includes(f.status));
  const factById = new Map(verified.facts.map((f) => [f.id, f]));

  const lines: string[] = [
    `# Stage 6–7 Route Planning Digest — Game ${id}: ${ach.title} (${ach.console})`,
    "",
    `Generated from \`05_verified.json\` (${usable.length} usable non-duplicate facts, ${ach.achievements.length} achievements).`,
    "Read this digest first to build `05_aliases.json`, `05_resolutions.json`, `06_graph.json`, and `07_roadmap.json` without repeatedly grepping `05_verified.json`.",
    "After editing `05_aliases.json`, run `npm run rw:verify -- " + id + "` (which automatically refreshes this digest).",
    "",
  ];

  // 1. Possible conflicts (Step 0 triage)
  lines.push(`## 1. Possible Conflicts to Triage (${verified.possible_conflicts.length})`, "");
  if (!verified.possible_conflicts.length) {
    lines.push("None.", "");
  } else {
    lines.push("Triage these in `05_aliases.json` (if naming variants) or `05_resolutions.json` (if real contradictions):", "");
    for (const pc of verified.possible_conflicts.slice(0, 60)) {
      lines.push(`- **\`${pc.key}\`**`);
      for (const item of pc.facts) {
        const f = factById.get(item.id);
        const q = f?.evidence?.[0] ? `${f.evidence[0].chunk_id}: "${f.evidence[0].quote.slice(0, 120)}"` : "";
        lines.push(`  - \`${item.id}\` (value: \`${item.value}\`, sources: ${item.sources.join(",")}) — ${f?.text ?? ""} ${q ? `[${q}]` : ""}`);
      }
    }
    if (verified.possible_conflicts.length > 60) lines.push(`- … and ${verified.possible_conflicts.length - 60} more in \`05_verified.json\`.`);
    lines.push("");
  }

  // 2. Candidate location alias clusters (locations sharing key terms that aren't aliased yet)
  const locCounts = new Map<string, { raw: Set<string>; count: number; sources: Set<string> }>();
  for (const f of usable) {
    if (!f.location) continue;
    const c = canon(aliases, f.location);
    const entry = locCounts.get(c) ?? { raw: new Set<string>(), count: 0, sources: new Set<string>() };
    entry.raw.add(f.location);
    entry.count++;
    for (const s of f.sources) entry.sources.add(s);
    locCounts.set(c, entry);
  }
  const canonLocs = [...locCounts.entries()].sort((a, b) => b[1].count - a[1].count);
  const termToLocs = new Map<string, string[]>();
  const GENERIC_TERM = new Set(["cave", "caves", "tunnel", "dungeon", "room", "floor", "castle", "tower", "town", "village", "house", "shop", "forest", "woods", "mountain", "temple", "shrine", "island", "ship", "boss", "area", "level", "stage", "world", "hall", "chamber", "path", "road", "ruins", "mine", "mines", "north", "south", "east", "west", "upper", "lower", "inner", "outer", "first", "second", "third"]);
  for (const [c] of canonLocs) {
    for (const w of keyTerms(c)) {
      if (GENERIC_TERM.has(w)) continue;
      termToLocs.set(w, [...(termToLocs.get(w) ?? []), c]);
    }
  }
  const seenClusters = new Set<string>();
  const clusters: string[] = [];
  for (const [term, list] of termToLocs) {
    if (list.length < 2 || list.length > 6) continue;
    const key = [...list].sort().join("|");
    if (seenClusters.has(key)) continue;
    seenClusters.add(key);
    const desc = list
      .map((c) => {
        const info = locCounts.get(c)!;
        return `"${[...info.raw][0]}" (×${info.count}, ${[...info.sources].join(",")})`;
      })
      .join(" ↔ ");
    clusters.push(`- shared term \`${term}\`: ${desc}`);
  }
  lines.push(`## 2. Candidate Location Alias Clusters (${clusters.length})`, "");
  if (!clusters.length) {
    lines.push("No obvious unmerged location clusters detected.", "");
  } else {
    lines.push("Check if any of these refer to the same area (merge in `05_aliases.json` so chapter packets pull all facts for the area):", "");
    lines.push(...clusters.slice(0, 40), "");
  }

  // 3. Achievements & Supporting Facts (including candidate facts for unsupported achievements)
  lines.push(`## 3. Achievements (${ach.achievements.length})`, "");
  for (const a of ach.achievements) {
    const cov = verified.coverage[a.id];
    const fids = cov?.facts ?? [];
    const locs = [...new Set(fids.map((fid) => factById.get(fid)?.location).filter(Boolean))];
    const statusIcon = cov?.best === "verified" ? "✅" : cov?.best === "single_source" ? "🟡" : "❌ UNSUPPORTED";
    lines.push(`- **${a.id}** — **${a.title}** (${a.points} pts${a.type ? `, \`${a.type}\`` : ""}) [${statusIcon}]: ${a.description}`);
    if (fids.length) {
      const sample = fids.slice(0, 6).map((fid) => {
        const f = factById.get(fid);
        return `\`${fid}\`${f?.location ? ` (@${f.location})` : ""}: ${(f?.text ?? "").slice(0, 100)}`;
      });
      lines.push(`  - Facts (${fids.length}${locs.length ? `, locations: ${locs.join(", ")}` : ""}): ${sample.join(" | ")}${fids.length > 6 ? ` … +${fids.length - 6} more` : ""}`);
    } else {
      // Find candidate facts sharing key terms with the achievement title + description
      const terms = keyTerms(`${a.title} ${a.description}`);
      const cands = usable
        .map((f) => {
          const hay = `${f.subject} ${f.object ?? ""} ${f.location ?? ""} ${f.text}`.toLowerCase();
          const hits = terms.filter((w) => hay.includes(w));
          return { f, hits };
        })
        .filter((x) => x.hits.length >= Math.min(2, Math.max(1, terms.length)))
        .sort((x, y) => y.hits.length - x.hits.length)
        .slice(0, 4);
      if (cands.length) {
        lines.push(`  - Candidate facts by keyword match: ${cands.map((x) => `\`${x.f.id}\` (@${x.f.location ?? "?"}): "${x.f.text.slice(0, 90)}"`).join(" | ")}`);
      } else {
        lines.push(`  - No keyword matches in usable facts — search chunks (\`npm run rw:chunks -- ${id} --grep "<term>"\`).`);
      }
    }
  }
  lines.push("");

  // 4. Locations in Source-Progression Order
  // Order each canonical location by the earliest chunk number in the primary guide (or earliest chunk overall)
  const chunkOrder = (f: VerifiedFact): number => {
    let best = Infinity;
    for (const e of f.evidence ?? []) {
      const m = e.chunk_id.match(/^(.*)#(\d+)$/);
      if (!m) continue;
      const n = Number(m[2]);
      const score = m[1] === primaryGuide ? n : 100_000 + n;
      if (score < best) best = score;
    }
    return best;
  };
  interface LocGroup {
    canonName: string;
    displayName: string;
    rawNames: Set<string>;
    order: number;
    facts: VerifiedFact[];
  }
  const byCanonLoc = new Map<string, LocGroup>();
  const unlocated: VerifiedFact[] = [];
  for (const f of usable) {
    if (!f.location) {
      unlocated.push(f);
      continue;
    }
    const c = canon(aliases, f.location);
    let g = byCanonLoc.get(c);
    if (!g) {
      g = { canonName: c, displayName: f.location, rawNames: new Set(), order: Infinity, facts: [] };
      byCanonLoc.set(c, g);
    }
    g.rawNames.add(f.location);
    g.order = Math.min(g.order, chunkOrder(f));
    g.facts.push(f);
  }
  const orderedLocs = [...byCanonLoc.values()].sort((a, b) => a.order - b.order || b.facts.length - a.facts.length);

  lines.push(`## 4. Canonical Locations in Progression Order (${orderedLocs.length} locations, ${unlocated.length} unlocated facts)`, "");
  lines.push("Use the exact `displayName` as your graph area node `label` so `chapter-packet.ts` pulls all facts for that location:", "");
  for (const g of orderedLocs) {
    const byType = new Map<string, number>();
    for (const f of g.facts) byType.set(f.type, (byType.get(f.type) ?? 0) + 1);
    const typeStr = [...byType.entries()].map(([k, v]) => `${k}:${v}`).join(", ");
    const sampleIds = g.facts.slice(0, 4).map((f) => `\`${f.id}\``).join(", ");
    const variants = [...g.rawNames].filter((r) => r !== g.displayName);
    lines.push(`- **\`${g.displayName}\`**${variants.length ? ` (aliases: ${variants.join(", ")})` : ""} — **${g.facts.length} facts** (${typeStr}) · sample ids: ${sampleIds}`);
    const bosses = g.facts.filter((f) => f.type === "boss");
    if (bosses.length) {
      const bossSubjs = [...new Set(bosses.map((b) => `${b.subject} (\`${b.id}\`)`))].slice(0, 6);
      lines.push(`  - Bosses: ${bossSubjs.join(", ")}`);
    }
    const keyFacts = g.facts.filter((f) => f.type === "ponr" || f.type === "missable" || f.missable || f.type === "transition");
    for (const kf of keyFacts.slice(0, 5)) {
      lines.push(`  - [${kf.type}${kf.missable ? "/missable" : ""}] \`${kf.id}\`: ${kf.text.slice(0, 110)}`);
    }
  }
  lines.push("");

  // 5. All Missable & PONR Facts
  const missableFacts = usable.filter((f) => f.missable || f.type === "missable" || f.type === "ponr");
  lines.push(`## 5. All Missable & PONR Facts (${missableFacts.length})`, "");
  for (const f of missableFacts) {
    lines.push(`- \`${f.id}\` (${f.type}${f.missable ? ", missable" : ""}${f.location ? `, @${f.location}` : ""}${f.achievement_ids?.length ? `, ach: ${f.achievement_ids.join(",")}` : ""}): ${f.text}`);
  }
  lines.push("");

  // 6. Mutual Exclusion / Lockout Scan from ra-comments.txt
  const raCommentsFile = path.join(P.sourcesDir, "ra-comments.txt");
  lines.push(`## 6. Playthrough & Lockout Signals in \`ra-comments.txt\``, "");
  if (exists(raCommentsFile)) {
    const hits = readText(raCommentsFile)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /\b(incompatible|locks? out|locked out|missable|playthrough|second run|password|glitch|bug|bugged|void|disqualif|mutually exclusive|before|warning)\b/i.test(l));
    if (hits.length) {
      for (const h of hits.slice(0, 40)) lines.push(`- ${h.slice(0, 180)}`);
      if (hits.length > 40) lines.push(`- … and ${hits.length - 40} more lines.`);
    } else {
      lines.push("No lockout keywords detected in `ra-comments.txt`.");
    }
  } else {
    lines.push("`02_sources/ra-comments.txt` not present.");
  }
  lines.push("");

  writeText(P.planDigest, lines.join("\n"));
  return P.planDigest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const id = gameIdArg();
  const out = buildPlanDigest(id);
  console.log(`Wrote Stage 6-7 planning digest -> ${path.relative(process.cwd(), out)}`);
}
