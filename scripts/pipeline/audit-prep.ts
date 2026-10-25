/**
 * Stage 9 prep - build a compact adversarial audit digest (09_audit_digest.md) for the QA reviewer.
 *
 *   npx tsx scripts/pipeline/audit-prep.ts <gameId>
 *
 * Diffs every chapter's assigned packet facts against the [[fact-id]] citations and text in 08_chapters/*.md,
 * surfacing uncited/unmentioned items, chests, bosses, quests, missables, sparse dungeon sections, and map links
 * so the Stage 9 Opus auditor can immediately inspect candidate omissions instead of manually grepping packets
 * and raw sources across dozens of tool turns.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chapterMaps, chapterTitle, duplicateMap, packetFactIds, sourceUrl, type Graph, type Roadmap } from "./graph.ts";
import {
  CITE_RE,
  type AchievementsFile,
  type VerifiedFact,
  canon,
  chapterFile,
  exists,
  gameIdArg,
  keyTerms,
  loadAliases,
  paths,
  readJson,
  readText,
  readUsedSources,
  requireFile,
  words,
  writeText,
} from "./lib.ts";

export function buildAuditDigest(id: string): string {
  const P = paths(id);
  for (const f of [P.achievements, P.verified, P.graph, P.roadmap]) requireFile(f, "complete earlier stages first");

  const ach = readJson<AchievementsFile>(P.achievements);
  const verified = readJson<{ facts: VerifiedFact[]; coverage: Record<string, any> }>(P.verified);
  const graph = readJson<Graph>(P.graph);
  const roadmap = readJson<Roadmap>(P.roadmap);
  const aliases = loadAliases(P.aliases);
  const sources = readUsedSources(P.sourcesManifest);
  const qa = exists(P.qa) ? readJson<{ errors: string[]; warnings: string[]; metrics: Record<string, any> }>(P.qa) : null;

  const usable = verified.facts.filter((f) => ["verified", "single_source", "resolved"].includes(f.status));
  const factById = new Map(usable.map((f) => [f.id, f]));
  const dupOf = duplicateMap(verified.facts);
  const packetIds = packetFactIds(roadmap, graph, usable, (s) => canon(aliases, s), dupOf);

  const lines: string[] = [
    `# Stage 9 Adversarial Audit Digest — Game ${id}: ${ach.title}`,
    "",
    "Read this digest first to execute the 8-point Red-Team Audit without grepping every packet and source chunk from scratch.",
    "Every candidate omission below is a usable fact from that chapter's packet whose `[[fact-id]]` was not cited and whose key subject/object terms do not appear in the chapter.",
    "",
  ];

  // 1. Automated QA Summary
  if (qa) {
    lines.push(`## 1. Automated QA Status (\`09_qa.json\`)`, "");
    lines.push(
      `- **Words:** ${qa.metrics.words?.toLocaleString() ?? "?"} · **Errors:** ${qa.errors.length} · **Warnings:** ${qa.warnings.length} · **Sparse areas:** ${qa.metrics.sparse_areas ?? 0}`,
    );
    if (qa.errors.length) {
      lines.push("- **Errors (must be 0):**", ...qa.errors.slice(0, 20).map((e) => `  - ❌ ${e}`));
    }
    if (qa.warnings.length) {
      lines.push("- **Warnings:**", ...qa.warnings.slice(0, 25).map((w) => `  - ⚠ ${w}`));
      if (qa.warnings.length > 25) lines.push(`  - … and ${qa.warnings.length - 25} more warnings in \`09_qa.json\`.`);
    }
    lines.push("");
  }

  // 2. Playthrough & Lockout Cross-Check (Point 1)
  lines.push(`## 2. Playthrough & Lockout Audit (Point 1)`, "");
  lines.push(`- **Roadmap playthroughs:** ${roadmap.playthroughs} — ${roadmap.playthrough_notes}`);
  if (roadmap.settings_notes) lines.push(`- **Settings notes:** ${roadmap.settings_notes}`);
  if (roadmap.open_questions?.length) {
    lines.push(`- **Open questions (${roadmap.open_questions.length}):**`);
    for (const q of roadmap.open_questions) lines.push(`  - **${q.question}** → ${q.guidance}`);
  }
  const raCommentsFile = path.join(P.sourcesDir, "ra-comments.txt");
  if (exists(raCommentsFile)) {
    const lockoutLines = readText(raCommentsFile)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /\b(incompatible|locks? out|locked out|redo|second playthrough|another playthrough|password|void|disqualif|mutually exclusive)\b/i.test(l));
    if (lockoutLines.length) {
      lines.push(`- **Lockout/playthrough lines in \`ra-comments.txt\` (${lockoutLines.length}):**`);
      for (const l of lockoutLines.slice(0, 15)) lines.push(`  - ${l.slice(0, 160)}`);
    }
  }
  lines.push("");

  // 3. Per-Chapter Omission & Depth Audit (Points 2–8)
  lines.push(`## 3. Chapter-by-Chapter Omission & Depth Audit`, "");
  const HIGH_VALUE_TYPES = new Set(["boss", "item", "quest", "missable", "ponr", "achievement", "shop", "save_point"]);
  const PUZZLE_OR_CHEST_RE = /\b(chest|treasure|hidden|secret|puzzle|switch|lever|key|door|floor|b\d+f|\d+f|statue|riddle|code|password|boss|weakness|hp|pattern|strategy)\b/i;

  for (const ch of roadmap.chapters) {
    const file = chapterFile(ch.n);
    const p = path.join(P.chaptersDir, file);
    lines.push(`### Chapter ${ch.n}: ${chapterTitle(ch)} (\`08_chapters/${file}\`)`, "");
    if (!exists(p)) {
      lines.push("- ❌ **Chapter file is missing!**", "");
      continue;
    }
    const text = readText(p);
    const lowerText = text.toLowerCase();
    const chLines = text.split(/\r?\n/);

    // Cited fact IDs in this chapter (normalized through duplicateMap)
    const cited = new Set<string>();
    for (const m of text.matchAll(CITE_RE)) {
      for (const rawId of m[1].split(/\s*,\s*/)) {
        cited.add(dupOf.get(rawId) ?? rawId);
        cited.add(rawId);
      }
    }

    // Section word counts
    const sections: { heading: string; words: number; cites: number }[] = [];
    for (let i = 0; i < chLines.length; i++) {
      const hm = chLines[i].match(/^###\s+(.+)$/);
      if (!hm) continue;
      let w = 0;
      let c = 0;
      for (let j = i + 1; j < chLines.length && !/^#{2,3}\s+/.test(chLines[j]); j++) {
        w += words(chLines[j]);
        c += [...chLines[j].matchAll(CITE_RE)].length;
      }
      sections.push({ heading: hm[1].trim(), words: w, cites: c });
    }
    const thinSections = sections.filter((s) => s.words < 60 && !/checklist|checkpoint|items to collect|overview/i.test(s.heading));
    lines.push(
      `- **Size:** ${words(text).toLocaleString()} words, ${cited.size} unique facts cited across ${sections.length} \`###\` sections${thinSections.length ? ` (⚠ **${thinSections.length} thin section(s):** ${thinSections.map((s) => `"${s.heading}" (${s.words}w)`).join(", ")})` : ""}`,
    );

    // Visual maps check (Point 8)
    const maps = chapterMaps(sources, graph, ch, aliases, roadmap.chapters);
    if (maps.length) {
      const missingMaps = maps.filter((s) => !text.includes(sourceUrl(s)));
      if (missingMaps.length) {
        lines.push(`- ⚠ **Missing Visual Map Links (${missingMaps.length}/${maps.length}):** ${missingMaps.map((s) => `"${s.title}" (${sourceUrl(s)})`).join(", ")}`);
      } else {
        lines.push(`- **Visual Maps:** all ${maps.length} map link(s) present ✅`);
      }
    }

    // Diff packet facts against cited facts
    const pIds = packetIds.chapters.get(ch.n) ?? new Set<string>();
    const packetFacts = [...pIds].map((fid) => factById.get(fid)).filter(Boolean) as VerifiedFact[];
    const uncited = packetFacts.filter((f) => !cited.has(f.id));
    const highValueUncited = uncited.filter((f) => HIGH_VALUE_TYPES.has(f.type) || f.missable || PUZZLE_OR_CHEST_RE.test(f.text));

    // Separate truly unmentioned facts from facts whose subject+object terms already appear in the chapter prose
    const unmentioned: VerifiedFact[] = [];
    let mentionedViaSibling = 0;
    for (const f of highValueUncited) {
      const coreTerms = keyTerms(`${f.subject} ${f.object ?? ""}`);
      const allPresent = coreTerms.length > 0 && coreTerms.every((t) => lowerText.includes(t));
      if (allPresent) mentionedViaSibling++;
      else unmentioned.push(f);
    }

    lines.push(
      `- **Packet Fact Coverage:** ${packetFacts.length - uncited.length}/${packetFacts.length} packet facts cited directly (${mentionedViaSibling} high-value uncited facts have their subject/object terms mentioned via sibling citations; **${unmentioned.length} candidate unmentioned high-value facts**).`,
    );

    if (unmentioned.length) {
      lines.push(`- **Candidate Omissions (unmentioned high-value facts in packet — check if genuinely omitted from chapter):**`);
      for (const f of unmentioned.slice(0, 25)) {
        const q = f.evidence?.[0] ? `${f.evidence[0].chunk_id}: "${f.evidence[0].quote.slice(0, 110)}"` : "";
        lines.push(`  - \`${f.id}\` (**${f.type}**${f.location ? `, @${f.location}` : ""}${f.missable ? ", MISSABLE" : ""}): ${f.text} ${q ? `[${q}]` : ""}`);
      }
      if (unmentioned.length > 25) lines.push(`  - … and ${unmentioned.length - 25} more unmentioned packet facts.`);
    }
    lines.push("");
  }

  writeText(P.auditDigest, lines.join("\n"));
  return P.auditDigest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const id = gameIdArg();
  const out = buildAuditDigest(id);
  console.log(`Wrote Stage 9 audit digest -> ${path.relative(process.cwd(), out)}`);
}
