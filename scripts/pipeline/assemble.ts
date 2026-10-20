/**
 * Assemble the final walkthrough from the overview, the chapters and the roadmap.
 *
 *   npx tsx scripts/pipeline/assemble.ts <gameId> [--no-flags]
 *
 * Outputs:
 *   content/research/<id>/08_cited.md   (citations kept, for QA/audit)
 *   content/walkthroughs/<id>.md        (citations stripped; 🟡 marks single-source claims)
 */
import fs from "node:fs";
import path from "node:path";
import { achievementMermaid, chapterMermaid, chapterTitle, type Graph, progressionMermaid, type Roadmap } from "./graph.ts";
import {
  ACH_RE,
  type AchievementsFile,
  CITE_RE,
  MERMAID_RE,
  type SourceEntry,
  type VerifiedFact,
  chapterFile,
  flag,
  gameIdArg,
  paths,
  readJson,
  readText,
  requireFile,
  writeText,
  readUsedSources,
} from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
for (const f of [P.achievements, P.verified, P.graph, P.roadmap]) requireFile(f, "complete earlier stages first");

const ach = readJson<AchievementsFile>(P.achievements);
const verified = readJson<{ stats: any; facts: VerifiedFact[] }>(P.verified);
const graph = readJson<Graph>(P.graph);
const roadmap = readJson<Roadmap>(P.roadmap);
const sources = readUsedSources(P.sourcesManifest);
const factById = new Map(verified.facts.map((f) => [f.id, f]));
const achById = new Map(ach.achievements.map((a) => [a.id, a]));
const chapterOf = new Map<number, number>();
roadmap.chapters.forEach((c) => c.achievement_ids.forEach((a) => chapterOf.set(a, c.n)));
const anchor = (n: number) => `#chapter-${n}-${`${chapterTitle(roadmap.chapters[n - 1])}`.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim().replace(/\s+/g, "-")}`;

function achBlock(aid: number): string {
  const a = achById.get(aid);
  if (!a) return `[ACHIEVEMENT:${aid}]`; // QA will flag
  const badge = a.badgeName ? `https://retroachievements.org/Badge/${a.badgeName}.png` : "";
  const block = ["> [!ACHIEVEMENT]", `> **${a.title} (${a.points} Points)**`];
  if (badge) block.push(`> ![Badge](${badge})`);
  block.push(`> *${a.description}*`);
  return `\n${block.join("\n")}\n`;
}

function expand(text: string, chapterN: number | null): string {
  let t = text.replace(ACH_RE, (_, aid) => achBlock(Number(aid)));
  if (chapterN) {
    const ch = roadmap.chapters.find((c) => c.n === chapterN)!;
    const mm = chapterMermaid(graph, ch.areas);
    t = t.replace(MERMAID_RE, mm ? "```mermaid\n" + mm + "\n```" : "");
  }
  return t;
}

function read(name: string): string {
  const p = path.join(P.chaptersDir, name);
  if (!fs.existsSync(p)) {
    console.warn(`! missing ${path.relative(P.root, p)}`);
    return `> [!CAUTION]\n> This section has not been written yet (${name}).\n`;
  }
  return readText(p).trim();
}

// ---------------------------------------------------------------------------
// Build cited document
// ---------------------------------------------------------------------------
const L: string[] = [];
const pts = ach.achievements.reduce((s, a) => s + a.points, 0);
L.push(
  `# ${ach.title} — 100% RetroAchievements Walkthrough`, "",
  "## Metadata", "",
  `- **Platform:** ${ach.console}`, `- **Developer:** ${ach.developer ?? "Unknown"}`, `- **Publisher:** ${ach.publisher ?? "Unknown"}`,
  `- **Genre:** ${ach.genre ?? "Unknown"}`, `- **Released:** ${ach.released ?? "Unknown"}`,
  `- **Achievements:** ${ach.achievements.length} (${pts} points)`, "",
  "> [!NOTE]",
  `> Every instruction in this guide was extracted from the sources listed at the bottom and checked against them (${verified.stats.verified} facts confirmed by 2+ sources, ${verified.stats.single_source} from a single source). Statements marked 🟡 come from only one source. Anything we could not confirm says **"Unable to verify from collected sources."**`, "",
);

// 1. Game Overview
L.push("## Game Overview", "", read("00_overview.md").replace(/^#{1,2}\s.*\r?\n/, ""), "");

// 2. Achievement Roadmap
L.push("## Achievement Roadmap", "", "| Chapter | Achievements | Points |", "|---|---|---|");
for (const c of roadmap.chapters) {
  const list = c.achievement_ids.map((a) => achById.get(a)?.title ?? `#${a}`).join(", ") || "—";
  const p = c.achievement_ids.reduce((s, a) => s + (achById.get(a)?.points ?? 0), 0);
  L.push(`| [${c.n}. ${chapterTitle(c)}](${anchor(c.n)}) | ${list} | ${p} |`);
}
L.push("");

// 3. Playthrough planning
L.push("## Playthrough Planning", "", `**Playthroughs required:** ${roadmap.playthroughs}`, "", roadmap.playthrough_notes, "");
if (roadmap.settings_notes) L.push(`**Settings:** ${roadmap.settings_notes}`, "");
if (roadmap.fact_ids?.length) L.push(`[[${roadmap.fact_ids.join(",")}]]`, "");

// 3b. True 100% Completion Criteria
if (roadmap.true_100_criteria) {
  L.push("## True 100% In-Game Completion Criteria", "");
  L.push(`This guide covers complete in-game mastery in addition to all RetroAchievements:`, "");
  L.push("| Category | 100% Requirement | Tracking Scope |", "|---|---|---|");
  for (const cat of roadmap.true_100_criteria.categories) {
    L.push(`| **${cat.name}** | ${cat.description} | ${cat.tracked_per_chapter ? "Per-chapter checkpoint" : "Endgame/Global scope"} |`);
  }
  L.push("");
}

// 4. Missables
L.push("## Missables Summary", "");
if (roadmap.missables.length) {
  L.push("| ⚠ Missable | Achievement | Chapter | Must be done before |", "|---|---|---|---|");
  for (const m of roadmap.missables)
    L.push(`| ${m.label} [[${m.fact_ids.join(",")}]] | ${m.achievement_id ? achById.get(Number(m.achievement_id))?.title ?? m.achievement_id : "—"} | [${m.chapter}](${anchor(m.chapter)}) | ${m.deadline} |`);
} else L.push("No missables were identified in the collected sources.");
L.push("");

// 5. PONR
L.push("## Points of No Return", "");
if (roadmap.ponr.length) {
  L.push("| ⛔ Point of No Return | Chapter | What you lose access to |", "|---|---|---|");
  for (const p of roadmap.ponr) L.push(`| ${p.label} [[${p.fact_ids.join(",")}]] | [${p.chapter}](${anchor(p.chapter)}) | ${p.warning} |`);
} else L.push("No points of no return were identified in the collected sources.");
L.push("");

// 6. Mermaid
L.push("## Progression Diagrams", "");
const prog = progressionMermaid(graph);
if (prog) L.push("### Game Progression", "", "```mermaid", prog, "```", "");
const deps = achievementMermaid(graph);
if (deps) L.push("### Achievement Dependencies", "", "```mermaid", deps, "```", "");

// 8. Boss index (strategies live inline in chapters)
const bosses = graph.nodes.filter((n) => n.kind === "boss");
if (bosses.length) {
  L.push("## Boss Index", "", "Full strategies are in each chapter.", "", "| Boss | Chapter |", "|---|---|");
  for (const b of bosses) {
    const ch = roadmap.chapters.find((c) => c.areas.includes(b.id) || graph.edges.some((e) => (e.to === b.id && c.areas.includes(e.from)) || (e.from === b.id && c.areas.includes(e.to))));
    L.push(`| ${b.label} | ${ch ? `[${ch.n}. ${chapterTitle(ch)}](${anchor(ch.n)})` : "—"} |`);
  }
  L.push("");
}

// 7/8/9/10. Area-by-area walkthrough
L.push("## Walkthrough", "");
for (const c of roadmap.chapters) {
  let body = read(chapterFile(c.n));
  if (!/^##\s+Chapter/m.test(body)) body = `## Chapter ${c.n}: ${c.title}\n\n${body}`;
  L.push(expand(body, c.n).replace(/^##\s+Chapter.*$/m, `## Chapter ${c.n}: ${chapterTitle(c)}`), "", "---", "");
}

// 11. Final checklist
L.push("## Final Checklist", "");
for (const c of roadmap.chapters) {
  L.push(`**${c.n}. ${chapterTitle(c)}**`, "");
  for (const m of roadmap.missables.filter((x) => x.chapter === c.n)) L.push(`- [ ] ⚠ ${m.label} (before: ${m.deadline})`);
  for (const a of c.achievement_ids) L.push(`- [ ] 🏆 ${achById.get(a)?.title ?? a}`);
  for (const p of roadmap.ponr.filter((x) => x.chapter === c.n)) L.push(`- [ ] ⛔ Everything above is done before: ${p.label}`);
  L.push("");
}

// 12. 100% verification checklist
L.push("## 100% Completion Verification Checklist", "", `All ${ach.achievements.length} achievements (${pts} points).`, "", "| ✔ | Achievement | Points | Type | Chapter |", "|---|---|---|---|---|");
for (const a of ach.achievements) L.push(`| ☐ | **${a.title}** — ${a.description} | ${a.points} | ${a.type ?? ""} | ${chapterOf.has(a.id) ? `[${chapterOf.get(a.id)}](${anchor(chapterOf.get(a.id)!)})` : "**UNASSIGNED**"} |`);
L.push("");

// Sources
L.push("## Sources", "", "This guide was built only from these sources:", "");
for (const s of sources) {
  const urls = Array.isArray(s.url) ? s.url : [s.url];
  L.push(`- **${s.site}** — ${s.title}${s.author ? ` by ${s.author}` : ""}: ${urls.map((u) => (u.startsWith("http") ? `[link](${u})` : u)).join(", ")}`);
}
L.push("", `Verification: ${verified.stats.verified} verified · ${verified.stats.single_source} single-source · ${verified.stats.resolved} resolved conflicts · ${verified.stats.rejected} rejected facts.`, "");

const cited = L.join("\n").replace(/\n{3,}/g, "\n\n");
writeText(P.cited, cited);

// ---------------------------------------------------------------------------
// Public version: strip citations, mark single-source groups
// ---------------------------------------------------------------------------
const markSingle = !flag("no-flags");
const publicText = cited.replace(/[ \t]*\[\[([^\]]+)\]\]/g, (_m, ids: string) => {
  const fs_ = ids.split(",").map((s) => factById.get(s.trim()));
  if (markSingle && fs_.length && fs_.every((f) => f && f.status === "single_source")) return " 🟡";
  return "";
});
writeText(P.final, publicText);
const cites = (cited.match(CITE_RE) || []).length;
console.log(`Assembled ${roadmap.chapters.length} chapters, ${cites} citation groups.`);
console.log(`  cited  -> ${path.relative(P.root, P.cited)}`);
console.log(`  public -> ${path.relative(P.root, P.final)}`);
console.log(`Next: npm run rw:qa -- ${id}`);
