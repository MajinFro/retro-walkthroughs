/**
 * Stage 9a - Deterministic QA audit (runs before the strict reviewer agent).
 *
 *   npx tsx scripts/pipeline/qa-check.ts <gameId>
 *
 * Checks the chapter drafts in 08_chapters/ against the roadmap, graph and verified facts.
 */
import fs from "node:fs";
import path from "node:path";
import { buildAuditDigest } from "./audit-prep.ts";
import { chapterMaps, chapterMermaid, checkpointTotals, collectibleMentionRe, sourceUrl, type Graph, type Roadmap } from "./graph.ts";
import {
  ACH_RE,
  type AchievementsFile,
  CITE_RE,
  malformedCites,
  type Chunk,
  type VerifiedFact,
  chapterFile,
  gameIdArg,
  paths,
  readJson,
  readJsonl,
  readText,
  requireFile,
  words,
  keyTerms,
  norm,
  loadAliases,
  writeJson,
  exists,
  fingerprintFiles,
  qaInputFiles,
  type SourceEntry,
  readUsedSources,
  saveStateAdvice,
  layoutProblems,
} from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
for (const f of [P.achievements, P.verified, P.graph, P.roadmap, P.chunks]) requireFile(f, "complete earlier stages first");

const ach = readJson<AchievementsFile>(P.achievements);
const verified = readJson<{ facts: VerifiedFact[]; coverage: Record<string, any> }>(P.verified);
const graph = readJson<Graph>(P.graph);
const roadmap = readJson<Roadmap>(P.roadmap);
const chunks = readJsonl<Chunk>(P.chunks);
const sources = readUsedSources(P.sourcesManifest);
const mapsAvailable = sources.filter((s) => s.kind === "map").length;
const factById = new Map(verified.facts.map((f) => [f.id, f]));
const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
const aliases = loadAliases(P.aliases);
const unverifiable = new Set(roadmap.unverifiable_achievement_ids ?? []);
// words the set and the roadmap already supply (see isPlanLogic in the citation check)
const planTerms = new Set([
  ...ach.achievements.flatMap((a) => keyTerms(`${a.title} ${a.description}`)),
  ...keyTerms(
    [
      ach.title,
      roadmap.playthrough_notes,
      roadmap.settings_notes ?? "",
      ...roadmap.chapters.flatMap((c) => [c.title, c.notes ?? ""]),
      ...(roadmap.open_questions ?? []).flatMap((q) => [q.question, q.guidance]),
      "achievement achievements chapter chapters unlock unlocks unlocked points playthrough route hardcore",
    ].join(" "),
  ),
]);
const PROHIBIT_RE = /^(?:[-*+]\s+|\d+\.\s+)?(?:\*\*[^*]+\*\*:?\s*)?(?:do not|don't|never|avoid)\b/i;

const errors: string[] = [];
const warnings: string[] = [];
const sourceLines = new Set<string>();
for (const c of chunks) for (const l of c.text.split(/\r?\n/)) if (l.trim()) sourceLines.add(l.replace(/\s+$/, "").trim());

const placements = new Map<number, string[]>();
const texts = new Map<string, string>(); // tag -> chapter text, for cross-chapter checks
const DRAFTING_RE =
  /\b(?:was(?:n't| not) (?:available|provided)|(?:the|this|my) (?:writer )?packet|chapter \d+'s file|I (?:will|would|assume|don't have|do not have|cannot see)|as an AI|assum(?:e|ing) (?:that )?(?:the )?(?:previous|earlier|prior) chapter)\b/i;
const CHECKPOINT_RE = /(cumulative\s*(100%|progress)\s*checkpoint|true\s*100%\s*checkpoint)/i;
const m = {
  chapters_expected: roadmap.chapters.length + 1,
  chapters_present: 0,
  paragraphs: 0,
  paragraphs_cited: 0,
  paragraphs_plan_logic: 0, // counted in paragraphs_cited: route logic from the set/roadmap, or a "do not" warning
  citations: 0,
  citations_broken: 0,
  missables: roadmap.missables.length,
  missables_warned: 0,
  ponr: roadmap.ponr.length,
  ponr_warned: 0,
  areas: 0,
  areas_mentioned: 0,
  code_blocks: 0,
  code_blocks_verbatim: 0,
  unable_to_verify: 0,
  achievements_total: ach.achievements.length,
  achievements_placed_correctly: 0,
  achievements_supported: 0,
  words: 0,
  chapters_with_checkpoints: 0,
  maps_available: mapsAvailable,
  map_links_present: 0,
  sparse_areas: 0,
};

function audit(file: string, chapterN: number | null) {
  const p = path.join(P.chaptersDir, file);
  const tag = chapterN ? `ch${chapterN}` : "overview";
  if (!fs.existsSync(p)) {
    errors.push(`${tag}: ${file} is missing`);
    return;
  }
  m.chapters_present++;
  const text = readText(p);
  const lines = text.split(/\r?\n/);
  m.words += words(text);
  m.unable_to_verify += (text.match(/unable to verify from collected sources/gi) || []).length;

  // placeholders / leftovers
  if (/\b(TODO|TBD|FIXME)\b|\[INSERT|lorem ipsum/i.test(text)) errors.push(`${tag}: contains placeholder text (TODO/TBD/[INSERT…])`);
  for (const p of layoutProblems(text, tag === "overview")) warnings.push(`${tag}: ${p}`);
  for (const l of saveStateAdvice(text)) warnings.push(`${tag}: mentions save states (not allowed in hardcore): "${l}"`);
  // writer drafting notes and uncited markers that leak into the published guide
  const drafting = text.match(DRAFTING_RE);
  if (drafting) errors.push(`${tag}: contains a drafting note ("${drafting[0]}") — the walkthrough must not talk about files, packets or other chapters' drafts`);
  const passageOnly = (text.match(/\(passage only\)/gi) || []).length;
  if (passageOnly) errors.push(`${tag}: ${passageOnly} "(passage only)" marker(s) — every statement must cite a fact id (add the fact to 04_facts/ first)`);
  texts.set(tag, text);

  // code blocks
  let inCode = false;
  let lang = "";
  let block: string[] = [];
  let blockStart = 0;
  const prose: { line: number; text: string }[] = [];
  let para: string[] = [];
  let paraStart = 0;
  const flushPara = () => {
    if (para.length) prose.push({ line: paraStart, text: para.join(" ") });
    para = [];
  };
  lines.forEach((raw, i) => {
    const l = raw.trimEnd();
    const fence = l.match(/^\s*```(\w*)/);
    if (fence) {
      if (!inCode) {
        flushPara();
        inCode = true;
        lang = fence[1];
        block = [];
        blockStart = i + 1;
      } else {
        inCode = false;
        if (lang === "mermaid") errors.push(`${tag}:${blockStart}: hand-written mermaid block — use [MERMAID] (generated from the verified graph)`);
        else if (block.some((b) => b.trim())) {
          m.code_blocks++;
          const body = block.filter((b) => b.trim());
          const found = body.filter((b) => sourceLines.has(b.trim())).length;
          if (found / body.length >= 0.9) m.code_blocks_verbatim++;
          else errors.push(`${tag}:${blockStart}: code block/ASCII map is not verbatim from any source (${found}/${body.length} lines match) — never invent maps`);
        }
      }
      return;
    }
    if (inCode) {
      block.push(l);
      return;
    }
    const t = l.trim();
    if (!t || /^#{1,6}\s/.test(t) || /^\|?[-:| ]+\|?$/.test(t) || /^>\s*\[!/.test(t) || /^\[ACHIEVEMENT:/.test(t) || t === "[MERMAID]" || t === "---") {
      flushPara();
      return;
    }
    // end-of-chapter checklist items recap cited steps, and a map-link line is a link, not a claim
    if (/^[-*+]\s+\[[ xX]\]\s/.test(t) || /^([-*+]\s+)?(🗺️?\s*)?\*\*[^*]*maps?:?\*\*:?\s*\[[^\]]+\]\([^)]+\)\s*$/i.test(t) || /^🗺️?\s*\[[^\]]+\]\([^)]+\)\s*$/.test(t)) {
      flushPara();
      return;
    }
    if (/^([-*+]|\d+\.)\s/.test(t) || /^\|/.test(t)) {
      flushPara();
      // a table header row (the row above a |---| separator) names columns, it makes no claim
      if (/^\|/.test(t) && /^\|?\s*:?-{2,}/.test((lines[i + 1] ?? "").trim())) return;
      prose.push({ line: i + 1, text: t });
      return;
    }
    if (!para.length) paraStart = i + 1;
    para.push(t.replace(/^>\s?/, ""));
  });
  flushPara();

  // citations
  // Route logic built only from the set and the roadmap (achievement names, counts, the chapter plan) has
  // no guide fact to cite, and a warning not to do something needs none: neither counts as uncited.
  // (593: 12 of 16 "uncited" warnings were these, and the reviewer had added half of them on purpose.)
  const isPlanLogic = (t: string) => {
    if (PROHIBIT_RE.test(t)) { if (process.env.RW_QA_DEBUG) console.log("DONT:", t.slice(0, 140)); return true; }
    const terms = keyTerms(t.replace(/\[ACHIEVEMENT:\d+\]/g, " "));
    const left = terms.filter((w) => !planTerms.has(w));
    const ok = terms.length > 0 && left.length <= Math.max(3, Math.floor(terms.length * 0.4));
    if (ok && process.env.RW_QA_DEBUG) console.log("PLAN:", t.slice(0, 140));
    return ok;
  };
  let uncitedShown = 0;
  for (const pr of prose) {
    if (words(pr.text) < 12) continue;
    m.paragraphs++;
    if (/\[\[[^\]]+\]\]/.test(pr.text) || /unable to verify from collected sources/i.test(pr.text)) {
      m.paragraphs_cited++;
      const citedFids = [...pr.text.matchAll(CITE_RE)].flatMap((mm) => mm[1].split(",").map((s) => s.trim()));
      if (citedFids.length && words(pr.text) >= 15) {
        const prTerms = keyTerms(pr.text);
        if (prTerms.length >= 6) {
          // compare word stems: "auto-save" ~ "autosave", "reload" ~ "reloading" (prose paraphrases translated facts)
          const stems = (s: string) =>
            keyTerms(s)
              .flatMap((w) => [w, ...w.split("-").filter((p) => p.length >= 4 && p !== w)])
              .map((w) => w.replace(/-/g, "").slice(0, 5));
          const factTerms = new Set(
            citedFids.flatMap((fid) => {
              const f = factById.get(fid);
              if (!f) return [];
              return [f.text, f.subject, ...(f.evidence ?? []).map((e) => `${e.quote} ${e.translation ?? ""}`)].flatMap((s) => stems(s ?? ""));
            })
          );
          const overlap = stems(pr.text).filter((w) => factTerms.has(w)).length;
          // 2403: "you are healed after the Jackal fight" cited a map legend; a map fact supports map and layout text only
          const cited = citedFids.map((fid) => factById.get(fid)).filter((f): f is NonNullable<typeof f> => !!f);
          if (cited.length && cited.every((f) => f.type === "map") && !/\b(map|legend|screen|layout|exit|entrance|floor|maze|room|path|direction)\b/i.test(pr.text))
            warnings.push(`${tag}:${pr.line}: every cited fact (${citedFids.join(", ")}) is a map fact, but the text is not about the map layout — check for unverified claims: "${pr.text.slice(0, 80)}…"`);
          if (overlap === 0) {
            warnings.push(`${tag}:${pr.line}: no factual overlap with cited facts (${citedFids.join(", ")}) — check for unverified claims: "${pr.text.slice(0, 80)}…"`);
          }
        }
      }
    } else if (isPlanLogic(pr.text)) {
      m.paragraphs_cited++;
      m.paragraphs_plan_logic++;
    } else if (uncitedShown++ < 8) warnings.push(`${tag}:${pr.line}: uncited statement: "${pr.text.slice(0, 90)}…"`);
  }
  if (uncitedShown > 8) warnings.push(`${tag}: … ${uncitedShown - 8} more uncited statements`);
  for (const bad of malformedCites(text)) {
    m.citations_broken++;
    errors.push(`${tag}: malformed citation ${bad.slice(0, 80)} — citation brackets may hold only fact ids`);
  }
  for (const mm of text.matchAll(CITE_RE)) {
    for (const fid of mm[1].split(",").map((s) => s.trim())) {
      m.citations++;
      const f = factById.get(fid);
      if (!f) { m.citations_broken++; errors.push(`${tag}: cites unknown fact ${fid}`); }
      else if (f.status === "rejected") { m.citations_broken++; errors.push(`${tag}: cites REJECTED fact ${fid}`); }
      else if (f.status === "conflict") { m.citations_broken++; errors.push(`${tag}: cites UNRESOLVED CONFLICT fact ${fid}`); }
    }
  }

  // achievements
  const achLines = new Map<number, number>();
  lines.forEach((l, i) => {
    for (const a of l.matchAll(ACH_RE)) {
      const aid = Number(a[1]);
      placements.set(aid, [...(placements.get(aid) ?? []), tag]);
      achLines.set(aid, i);
    }
  });
  const calloutLines = lines.map((l, i) => ({ i, l })).filter((x) => /^>\s*\[!(WARNING|CAUTION)\]/i.test(x.l.trim()));

  if (!chapterN) return;
  const ch = roadmap.chapters.find((c) => c.n === chapterN)!;

  // a chapter of a no-chest challenge run must not tell the player to take optional chests (Final Fantasy 1449: 3 critical lockouts)
  if (ch.no_optional_chests) {
    const take = lines.filter((l) => /^\s*\|.*\|\s*\**TAKE\**\s*\|/.test(l) || /\bopen (them|all|every)\b.*\bchests?\b/i.test(l));
    if (take.length) warnings.push(`${tag}: roadmap marks this chapter no_optional_chests but ${take.length} line(s) tell the player to take/open chests, e.g. "${take[0].trim().slice(0, 80)}"`);
  }

  // unverifiable achievements must say so near the placeholder
  for (const aid of ch.achievement_ids) {
    if (!achLines.has(aid)) continue;
    if (unverifiable.has(aid)) {
      // the note may come before or after the tag: check the whole section around it
      const at = achLines.get(aid)!;
      const isHeading = (l: string) => /^#{1,6}\s/.test(l);
      let start = at;
      while (start > 0 && !isHeading(lines[start])) start--;
      let end = at + 1;
      while (end < lines.length && !isHeading(lines[end])) end++;
      const near = lines.slice(start, Math.max(end, at + 25)).join(" ");
      if (!/unable to verify from collected sources/i.test(near)) errors.push(`${tag}: achievement ${aid} has no evidence but the text near it does not say "Unable to verify from collected sources."`);
    }
  }

  // missables
  for (const ms of roadmap.missables.filter((x) => x.chapter === chapterN)) {
    let ok = calloutLines.length > 0;
    if (ms.achievement_id && achLines.has(Number(ms.achievement_id))) ok = calloutLines.some((c) => c.i < achLines.get(Number(ms.achievement_id))!);
    if (ok) m.missables_warned++;
    else errors.push(`${tag}: missable "${ms.label}" has no > [!WARNING]/[!CAUTION] callout before it`);
  }
  // writers label retryable trigger conditions "missable"; only the roadmap's missables are sourced
  const missableLabels = lines.filter((l) => /^>\s*(\[![A-Z]+\]\s*)?\*\*[^*]*\bmissable\b[^*]*\*\*/i.test(l.trim()) && !/\bnot missable\b/i.test(l)).length;
  if (missableLabels && !roadmap.missables.some((x) => x.chapter === chapterN))
    warnings.push(`${tag}: ${missableLabels} "Missable" callout(s) but the roadmap lists no missable for this chapter — call a retryable condition an "Achievement Trigger Warning", or add the sourced missable to 07_roadmap.json`);
  // PONR
  const ponrCallouts = calloutLines.filter((c) => /point of no return/i.test(lines.slice(c.i, c.i + 6).join(" "))).length;
  const ponrs = roadmap.ponr.filter((x) => x.chapter === chapterN);
  m.ponr_warned += Math.min(ponrCallouts, ponrs.length);
  if (ponrCallouts < ponrs.length) errors.push(`${tag}: ${ponrs.length} point(s) of no return but only ${ponrCallouts} "Point of No Return" CAUTION callout(s)`);
  // writers tend to invent them at every level exit; only the roadmap's PONRs are sourced
  if (ponrCallouts > ponrs.length)
    warnings.push(`${tag}: ${ponrCallouts} "Point of No Return" callout(s) but the roadmap lists ${ponrs.length} for this chapter — remove the extra ones (use a "before you leave" tip) or add the sourced PONR to 07_roadmap.json`);

  // item collection check
  for (const aid of ch.achievement_ids) {
    const aObj = ach.achievements.find((a) => a.id === aid);
    if (!aObj) continue;
    const isCollection = /collect every|all items/i.test(aObj.title + " " + aObj.description);
    if (isCollection) {
      const hasItemTableOrList = /(ITEM\s*\||\bItem\s*\d+\/\d+|\bwhere found\b|\bitem checklist\b|###\s*Chapter Items|###\s*Items to Collect)/i.test(text);
      if (!hasItemTableOrList) {
        errors.push(`${tag}: achievement ${aid} "${aObj.title}" requires collecting all items, but chapter lacks an item table or itemized checklist`);
      }
    }
  }

  // command_steps format check
  if (roadmap.format === "command_steps") {
    const hasCommandSteps = /^\s*\d+\.\s+\*\*([A-Z]+)\*\*/m.test(text);
    if (!hasCommandSteps) {
      errors.push(`${tag}: roadmap format is 'command_steps' but chapter lacks numbered **COMMAND** steps (e.g. '1. **MOVE** -> ...')`);
    }
  }

  // True 100% Checkpoint check
  const hasCheckpoint = CHECKPOINT_RE.test(text);
  if (hasCheckpoint) {
    m.chapters_with_checkpoints++;
    // running totals must match the roadmap (the packet gives the exact numbers)
    // the callout's own heading, not a sentence that mentions "Cumulative 100% Checkpoint"
    const inCallout = lines.findIndex((l) => l.trim().startsWith(">") && CHECKPOINT_RE.test(l));
    const cpAt = inCallout > -1 ? inCallout : lines.findIndex((l) => CHECKPOINT_RE.test(l));
    // the checkpoint callout block: its "> " lines (at most 30), not the checklist after it
    let cpEnd = cpAt + 1;
    while (cpEnd < lines.length && cpEnd < cpAt + 30 && lines[cpEnd].trim().startsWith(">")) cpEnd++;
    const cp = lines.slice(cpAt, cpEnd);
    // match a counter by its bold label ("- **Gems:** 12000 / 14000"), so a per-level line
    // such as "**Gnasty Gnorc level:** 500/500 gems" is not read as the running total
    const label = (l: string) => l.match(/\*\*([^*]+)\*\*/)?.[1].toLowerCase() ?? "";
    const counterLine = (name: string) =>
      cp.find((l) => label(l).includes(name.toLowerCase())) ?? cp.find((l) => !label(l) && l.toLowerCase().includes(name.toLowerCase()));
    const t = checkpointTotals(roadmap, chapterN, ach.achievements);
    const am = cp.find((l) => /retroachievements|achievements unlocked/i.test(l))?.match(/(\d+)\s*\/\s*(\d+)/);
    if (am && (Number(am[1]) !== t.achievements || Number(am[2]) !== t.achievements_total))
      errors.push(`${tag}: checkpoint says ${am[1]} / ${am[2]} achievements but the roadmap gives ${t.achievements} / ${t.achievements_total} after this chapter`);
    for (const c of t.counters) {
      const cm = counterLine(c.name)?.match(/(\d+)\s*\/\s*(\d+)/);
      if (cm && (Number(cm[1]) !== c.done || Number(cm[2]) !== c.total)) errors.push(`${tag}: checkpoint says ${cm[1]} / ${cm[2]} ${c.name} but the roadmap gives ${c.done} / ${c.total}`);
    }
  } else if (roadmap.true_100_criteria) {
    warnings.push(`${tag}: missing Cumulative 100% Checkpoint block (> [!IMPORTANT] ... Checkpoint)`);
  }

  // Map links in chapter
  const mapLinks = text.match(/(?:\[(?:view\s+)?.*?map.*?\]\(https?:\/\/[^\s)]+\)|!\[.*?map.*?\]\(https?:\/\/[^\s)]+\))/gi) || [];
  m.map_links_present += mapLinks.length;
  if (ch) for (const s of chapterMaps(sources, graph, ch, aliases, roadmap.chapters)) if (!text.includes(sourceUrl(s))) warnings.push(`${tag}: visual map "${s.title}" covers this chapter but is not linked (${sourceUrl(s)})`);

  // check depth per area heading
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const hMatch = l.match(/^###\s+(.+)$/);
    if (hMatch && !/checklist|checkpoint|items to collect|overview/i.test(hMatch[1])) {
      const areaHeading = hMatch[1].trim();
      let sectionWords = 0;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^#{2,3}\s+/.test(lines[j])) break;
        sectionWords += words(lines[j]);
      }
      if (sectionWords < 35 && roadmap.format !== "command_steps") {
        m.sparse_areas++;
        warnings.push(`${tag}: area section "${areaHeading}" is very brief (${sectionWords} words) — provide step-by-step navigation, puzzles, and chest locations`);
      }
    }
  }

  // areas
  for (const a of ch.areas) {
    m.areas++;
    const label = nodeById.get(a)?.label ?? a;
    if (text.toLowerCase().includes(label.toLowerCase())) m.areas_mentioned++;
    else warnings.push(`${tag}: area "${label}" from the roadmap is never mentioned`);
  }
  if (chapterMermaid(graph, ch.areas) && !text.includes("[MERMAID]")) warnings.push(`${tag}: no [MERMAID] route diagram placeholder`);
  if (!/^#{2,4}\s.*(checklist|before you (leave|move on))/im.test(text)) warnings.push(`${tag}: no end-of-chapter checklist heading`);
}

audit("00_overview.md", null);
for (const c of roadmap.chapters) audit(chapterFile(c.n), c.n);

// cross-chapter promises: "come back in Chapter 12 for the Game Boy" must be honoured by chapter 12
const COMMON = /^(Chapter|Point|Return|Unable|Warning|Caution|Important|Tip|Note|Missable|Achievement|Hardcore|Before|After|When|Then|Once|This|That|There|Your|Make|Come|Back|Talk|Keep|Save|Head|Return|Leave|Enter|Continue)$/i;
for (const [tag, text] of texts) {
  const own = tag === "overview" ? 0 : Number(tag.slice(2));
  for (const s of text.split(/(?<=[.!?])\s+|\r?\n/)) {
    if (CHECKPOINT_RE.test(s) || /^\s*(#|\|)/.test(s)) continue;
    for (const ref of s.matchAll(/\bchapter\s+(\d+)\b/gi)) {
      const n = Number(ref[1]);
      if (n === own || !texts.has(`ch${n}`)) continue;
      const names = [...new Set(s.replace(/\[\[[^\]]*\]\]|\[ACHIEVEMENT:\d+\]/g, "").match(/\b[A-Z][a-zA-Z'-]{3,}(?:\s+[A-Z][a-zA-Z'-]{2,})*/g) || [])].filter((w) => !COMMON.test(w));
      if (!names.length) continue;
      const target = texts.get(`ch${n}`)!.toLowerCase();
      if (!names.some((w) => target.includes(w.toLowerCase())))
        warnings.push(`${tag}: refers to chapter ${n} about ${names.slice(0, 3).join(", ")}, but chapter ${n} never mentions it — "${s.trim().slice(0, 90)}…"`);
    }
  }
}

// order of play: an item used, or an achievement called "already" earned, before the chapter that gets it.
// 1471's review found three (Gwaelin's Love used in ch5 but got in ch10; an achievement of ch10 "should
// already" be unlocked in ch9). An item's chapter is the first roadmap chapter whose areas list its node.
const firstChapter = new Map<string, number>();
for (const c of roadmap.chapters) for (const a of c.areas) if (!firstChapter.has(a)) firstChapter.set(a, c.n);
const achChapter = new Map<number, number>();
for (const c of roadmap.chapters) for (const a of c.achievement_ids) achChapter.set(a, c.n);
const AHEAD_RE = /\b(later|will|won't|until|not yet|eventually|come back|return(?:ing)? (?:here|later)|chapter\s+\d+|next chapter|ending run|once you (?:get|have|obtain|find)|after you (?:get|have|obtain|find)|when you (?:get|have|obtain|find)|(?:don't|do not) (?:have|need) (?:it|this|that|the)|cannot (?:get|use)|can't (?:get|use))\b/i;
// the player told to use or hold the item now; NPC hints, recipes and requirements ("says the Cloth is made with
// the Loom", "must be combined with the Token") mention later items legitimately (1470: 8 false hits without this)
const USE_RE = /\b(use|using|equip|equipped|wear|wearing|wield|wielding|consult|you (?:have|hold|carry|already have|now have)|your)\b/i;
const HEARSAY_RE = /\b(says?|said|mentions?|tells?|told|rumou?rs?|legend|hints?|made (?:with|from)|combined?|needed|required|requires?|must be|confirm|check that)\b/i;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const itemNames = graph.nodes
  .filter((n) => (n.kind === "item" || n.kind === "key_item") && firstChapter.has(n.id))
  .map((n) => {
    const label = (n.label ?? n.id).replace(/\s*\([^)]*\)/g, "").trim();
    const canon = aliases.get(norm(label)) ?? norm(label);
    // aliases are stored normalized, so names are matched against the normalized sentence
    const names = [norm(label), ...[...aliases].filter(([a, c]) => c === canon && a.length >= 4).map(([a]) => a)];
    return { label, chapter: firstChapter.get(n.id)!, re: new RegExp(`\\b(?:${names.map(escapeRe).join("|")})\\b`, "i") };
  });
for (const [tag, text] of texts) {
  if (tag === "overview") continue;
  const own = Number(tag.slice(2));
  for (const s of text.split(/(?<=[.!?])\s+|\r?\n/)) {
    if (CHECKPOINT_RE.test(s) || /^\s*(#|\||[-*+]\s+\[[ xX]\])/.test(s) || AHEAD_RE.test(s) || HEARSAY_RE.test(s)) continue;
    const quote = s.replace(/\[\[[^\]]*\]\]/g, "").trim().slice(0, 90);
    for (const it of itemNames)
      if (it.chapter > own && it.re.test(norm(s)) && USE_RE.test(s))
        warnings.push(`${tag}: uses "${it.label}" before it is obtained (the roadmap gets it in ch${it.chapter}) — "${quote}…"`);
    if (/\balready\b|\bshould have\b/i.test(s))
      for (const a of ach.achievements) {
        const at = achChapter.get(a.id);
        if (at && at > own && (s.includes(`[ACHIEVEMENT:${a.id}]`) || new RegExp(`\\b${escapeRe(String(a.id))}\\b|\\b${escapeRe(a.title)}\\b`, "i").test(s)))
          warnings.push(`${tag}: says achievement ${a.id} "${a.title}" is already earned, but it is earned in ch${at} — "${quote}…"`);
      }
  }
}

// numbered collectibles routed in the wrong chapter: 10113's review found five chapters sending the player after
// Skulltulas and Pieces of Heart that earlier chapters had already collected (roadmap chapters[].collectibles)
const collectibleOwner = new Map<string, number>();
for (const c of roadmap.chapters) for (const [k, nums] of Object.entries(c.collectibles ?? {})) for (const x of nums) collectibleOwner.set(`${k}#${x}`, c.n);
const BACKREF_RE = /\b(chapter\s+\d+|already|earlier|previous(?:ly)?|before|last chapter|next chapter|later|will|come back|skip|ignore|not (?:yet|now))\b/i;
if (collectibleOwner.size)
  for (const [tag, text] of texts) {
    if (tag === "overview") continue;
    const own = Number(tag.slice(2));
    for (const k of Object.keys(roadmap.counter_totals ?? {})) {
      const re = collectibleMentionRe(k);
      const seen = new Set<number>();
      for (const s of text.split(/(?<=[.!?])\s+|\r?\n/)) {
        if (CHECKPOINT_RE.test(s) || BACKREF_RE.test(s)) continue;
        for (const mm of s.matchAll(re)) {
          const x = Number(mm[1]);
          const at = collectibleOwner.get(`${k}#${x}`);
          if (at === undefined || at === own || seen.has(x)) continue;
          seen.add(x);
          warnings.push(`${tag}: routes to ${mm[0].replace(/\s+/g, " ")}, which the roadmap collects in ch${at} (chapters[].collectibles) — "${s.replace(/\[\[[^\]]*\]\]/g, "").trim().slice(0, 90)}…"`);
        }
      }
    }
  }

if (roadmap.format !== "command_steps") {
  const minWordsExpected = m.areas * 100;
  if (m.words < minWordsExpected) {
    warnings.push(`walkthrough word count (${m.words}) is unusually low for ${m.areas} areas (expected >= ${minWordsExpected}) — guide may be summarizing instead of providing complete room-by-room navigation`);
  }
}
if (mapsAvailable > 0 && m.map_links_present === 0) {
  warnings.push(`${mapsAvailable} visual map(s) exist in sources.json, but no map links appear in the walkthrough`);
}

// achievement placement
for (const c of roadmap.chapters)
  for (const aid of c.achievement_ids) {
    const where = placements.get(aid) ?? [];
    const title = ach.achievements.find((a) => a.id === aid)?.title;
    if (!where.length) errors.push(`achievement ${aid} "${title}" is never placed ([ACHIEVEMENT:${aid}] missing)`);
    else if (where.length > 1) errors.push(`achievement ${aid} "${title}" placed ${where.length} times (${where.join(", ")})`);
    else if (where[0] !== `ch${c.n}`) errors.push(`achievement ${aid} "${title}" placed in ${where[0]} but roadmap says ch${c.n}`);
    else {
      m.achievements_placed_correctly++;
      if (verified.coverage[aid]?.facts?.length) m.achievements_supported++;
    }
  }
for (const aid of placements.keys()) if (!ach.achievements.some((a) => a.id === aid)) errors.push(`unknown achievement id ${aid} placed`);

// inputs fingerprint lets rw:status tell when facts, graph, roadmap or chapters changed after this QA run
const inputs = fingerprintFiles(qaInputFiles(P, roadmap.chapters.map((c) => c.n)));
writeJson(P.qa, { generated_at: new Date().toISOString(), inputs, metrics: m, errors, warnings });
const auditDigestOut = buildAuditDigest(id);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 100);
console.log(`QA for game ${id}: ${m.chapters_present}/${m.chapters_expected} files, ${m.words.toLocaleString()} words`);
console.log(`  achievements placed correctly: ${m.achievements_placed_correctly}/${m.achievements_total}`);
console.log(`  cited paragraphs: ${m.paragraphs_cited}/${m.paragraphs} (${pct(m.paragraphs_cited, m.paragraphs)}%), broken citations: ${m.citations_broken}/${m.citations}`);
console.log(`  missables warned: ${m.missables_warned}/${m.missables}, PONR warned: ${m.ponr_warned}/${m.ponr}, areas mentioned: ${m.areas_mentioned}/${m.areas}`);
console.log(`  code blocks verbatim: ${m.code_blocks_verbatim}/${m.code_blocks}, "Unable to verify": ${m.unable_to_verify}`);
console.log(`  ${errors.length} error(s), ${warnings.length} warning(s) -> ${path.relative(P.root, P.qa)} (audit digest -> ${path.relative(P.root, auditDigestOut)})`);
for (const e of errors.slice(0, 40)) console.log(`  ❌ ${e}`);
if (errors.length > 40) console.log(`  … ${errors.length - 40} more errors`);
for (const w of warnings.slice(0, 20)) console.log(`  ⚠ ${w}`);
if (warnings.length > 20) console.log(`  … ${warnings.length - 20} more warnings (see 09_qa.json)`);
process.exit(errors.length ? 1 : 0);
