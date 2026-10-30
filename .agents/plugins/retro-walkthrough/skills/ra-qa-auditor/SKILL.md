---
name: ra-qa-auditor
description: Stage 9 of the walkthrough pipeline. Ruthlessly audits the walkthrough for omissions, missing warnings, unsupported claims, and beginner friendliness, producing 09_review.json.
---

# Stage 9 — QA Auditor

**Role:** You are the Red-Team QA Auditor. Your goal is NOT to praise the text; your job is to **ATTACK the walkthrough** and uncover every error, missing warning, unsupported statement, broken routing, or confusing instruction before a player touches it.

---

## 1. Automated Verification Check

Assemble and run the deterministic QA audit:
```powershell
npm run rw:assemble -- <gameId>
npm run rw:qa -- <gameId>
```

This verifies:
- Every achievement is placed in the exact chapter designated by the roadmap.
- Every citation (`[[fact_id]]`) exists, is verified, and has no unresolved conflict.
- Factual overlap check: detects prose that claims details not supported by the cited facts (< 20% key-term overlap).
- Every missable has a `> [!WARNING]` callout preceding its point of no return.
- Every Point of No Return has a `> [!CAUTION]` containing the phrase "Point of No Return".
- Every code block containing an ASCII map matches verbatim source text (no hallucinated maps).
- No placeholder tokens (`TODO`, `TBD`, `[INSERT]`) remain.
- **Item Manifest Requirement:** Every chapter with an item collection achievement has an explicit Item Manifest Table or item checklist.
- **Format Requirement:** If `roadmap.format === "command_steps"`, every chapter includes numbered `**COMMAND**` steps.
- **Checkpoint totals** match the running totals computed from the roadmap; no writer drafting notes ("Chapter 8's file was not available", "the packet…") and no "(passage only)" markers.
- **Cross-chapter promises:** a sentence that sends the player to another chapter ("retry this in Chapter 12") is flagged when that chapter never mentions the subject (warning).

If `rw:qa` reports errors or score-affecting warnings, run `npm run rw:write -- <gameId> --fix`: it revises only the affected chapters with a model call each (draft + findings + packet) and re-runs QA. Do not fix chapters by hand in your own context except for one-line edits; that is the most expensive way to fix them.

The review below is for what the scripts cannot see. Do not re-check what `rw:qa` already checks. **Start by reading `content/research/<gameId>/09_audit_digest.md`** (generated automatically by `rw:qa`, or via `npm run rw:audit-prep -- <gameId>`): it pre-computes every chapter's word/section breakdown, missing visual map links, `ra-comments.txt` lockout lines, and every high-value packet fact (`boss`, `item`, `quest`, `missable`, `ponr`, chest/puzzle facts) whose `[[fact-id]]` and key terms are unmentioned in `08_chapters/<NN>.md`. Use that digest to jump straight to candidate omissions and thin sections instead of grepping packets and raw sources from scratch. When you find a problem, log it in `09_review.json`, then fix it with `rw:write -- <gameId> <N> --fix` (it reads the QA findings) or, for a targeted change the QA does not flag, a short `Edit` of the chapter.

---

## 2. The 6-Point Adversarial Red-Team Audit

Review `content/research/<gameId>/08_cited.md` against raw source files (`02_sources/*.txt`) and community comments (`02_sources/ra-comments.txt`):

### Point 1: Playthrough & Mutual Exclusion Audit
- Cross-check `ra-comments.txt` for keywords like `lockout`, `incompatible`, `don't buy`, `locked out`, `redo chapter`, `password`.
- Does obtaining one item or achievement lock out another later in the game?
- If mutual exclusion exists, does the roadmap specify `playthroughs: 2` (or password replay) with explicit phase notes, or did the writer erroneously promise a single playthrough?

### Point 2: Chapter Placement & Boundary Audit
- Cross-check every achievement's placement against the source walkthrough chapter headings.
- Verify that events, bosses, and areas do not cross chapter boundaries prematurely.
- Verify that Points of No Return reflect actual game mechanics (e.g. inventory purges between chapters) rather than fabricated narrative cutoffs.

### Point 3: Command & Micro-Navigation Audit
- **Command-Driven Games (`format: "command_steps"`):**
  - Is every action an explicit, numbered command: `1. **MOVE** → ...`, `2. **TAKE** → ...`, `3. **USE** → ...`, `4. **TALK** → ...`, `5. **HIT** → ...`?
  - Would a beginner ever have to guess what menu to open or what command to select?
- **RPGs & Action Games (`format: "prose"`):**
  - Are room transitions, coordinates, and exact chest contents stated step-by-step?
  - Does the guide explain how to navigate mazes or puzzles without skipping steps?

### Point 4: Boss & Puzzle Counter-Pattern Audit
- For "flawless / win without mistakes" achievements, does the guide provide the exact AI pattern, move sequence, or counter-tactic documented in the sources (e.g. Finger Wars sequences, enemy look directions, puzzle answers)?
- Reject generic advice like "dodge attacks and strike when vulnerable" when the source specifies a deterministic counter-strategy.

### Point 5: Item Manifest Cross-Check
- For every "collect all items" achievement, verify that a dedicated Item Manifest Table is present:
  - Lists every required item by name.
  - Lists the exact location/room where it appears.
  - Lists the exact action/command needed to acquire it.
  - References verified source citations.

### Point 6: Hallucination & Narrative Embellishment Check
- Compare guide claims against the evidence quotes in `05_verified.json`.
- Reject any fabricated narrative mechanics (e.g. "crawl through ventilation shafts", "select hidden menu option") that do not appear in the sources.
- Reject any missable warnings or point-of-no-return warnings that were invented without source backing.

### Point 7: True 100% In-Game Completion & Dungeon Depth Audit
- **No Summary Dungeons:** For RPGs, verify that multi-floor dungeons, towers, and caves are navigated room-by-room. Any dungeon summarized in a few sentences without floor progression is an automatic **major** issue.
- **Chest & Item Omissions:** Cross-examine source passages for uncollected chests or items. If a source lists 6 chests on a floor and the writer only mentioned 1 or 2, flag as a **major** issue.
- **Puzzle Solutions:** Verify that every puzzle (e.g. block pushing, switch order, bomb puzzles) has clear, unambiguous solution steps.
- **Cumulative Checkpoints:** Verify that every chapter concludes with a `> [!IMPORTANT]` Cumulative 100% Checkpoint tracking chests, collectibles, sidequests, and achievements with accurate incremental numbers.

### Point 9: Route Step Spot-Check (MANDATORY)
`rw:qa` and `rw:directions` already compare step counts and flag steps a second model doubted, but neither reads the room order. For each dungeon, maze or multi-room route in two or more chapters, read the guide's steps next to the source guide that numbers its rooms (the packet's "Route spines"; `npm run rw:chunks -- <id> --id <chunk>`) and check: the rooms come in the source's order, no room appears twice, no step from a different guide is spliced between two rooms, every direction and count matches, an "if" branch kept its condition, and a disagreement between guides is shown with both values. Record each failure as a `major` issue (`category: route-accuracy`) naming the step and the source line, and fix it with `rw:write --fix --note`.

### Point 10: Achievement Text vs Route
For every achievement whose description names a source, NPC, item or condition ("from the Jack of All Trades", "without taking damage", "before Chapter 5"), find the step in the chapter that satisfies it and confirm the route does what the description says, not a shortcut or an alternative a comment mentions. A route that skips or declines the named thing is a `critical` issue (`category: achievement-route`).

### Point 11: Source Typos and Leaked Labels
Sources contain their own slips: a room that "opens north to Room 11" when the guide's own list puts Room 10 between, a door on the wrong side of the map. When a numbered route skips a room, or a step contradicts the same guide's map or another guide, do not copy it: state what the sources agree on and say in one sentence that the guide's text differs. Also read the chapters for internal labels (`ra-comments-1-1`, `gf2`, `Chapter_1_Prelude` diagram node ids) and any "stop, or you fall back to Room N" warning the source gives; a missing warning or a leaked label is a `major` issue.

### Point 8: Visual Map Verification Audit
- Check `02_sources/sources.json`: if visual maps exist (e.g. `kind: "map"`), verify that the writer embedded clickable markdown links (`[View ... Map](URL)`) in the relevant dungeon/area sections.
- Flag any missing map links as a **major** issue.

---

## 3. Generate Audit Report (`09_review.json`)

Write `content/research/<gameId>/09_review.json`:
```json
{
  "beginner_friendliness": 92,
  "issues": [
    {
      "id": "ISS-1",
      "severity": "critical",
      "category": "accuracy",
      "status": "fixed",
      "file": "08_chapters/02.md",
      "line": 45,
      "description": "Removed instruction to buy juices in Chapter 2 which locks out Achievement 98064 in Chapter 4."
    },
    {
      "id": "ISS-2",
      "severity": "major",
      "category": "boss",
      "status": "fixed",
      "file": "08_chapters/04.md",
      "line": 88,
      "description": "Added exact Scissors counter-pattern for Saladron Finger Wars duel."
    }
  ]
}
```

- **Severity:**
  - `critical`: Blocks 100% completion (playthrough lockout, missing missable warning, wrong chapter placement, hallucinated commands).
  - `major`: Missing directions, missing boss patterns, missing item table rows.
  - `minor`: Layout, formatting, minor clarity tweaks.
- **Status:** Must be marked `fixed` once corrected in the chapter files. If ANY `critical` or `major` issue remains open, the walkthrough will fail the Stage 10 scoring gate.

---

## 4. Run Stage 10 Scoring Gate

Run the scoring engine:
```powershell
npm run rw:score -- <gameId>
```

The scorer evaluates 6 categories:
1. `source_coverage`: Number of substantive independent guides (>=10k chars) + effective chunk coverage (fact-producing chunks count fully; skipped chunks count at max 20% discount).
2. `accuracy`: Citation density, verified sources, zero broken references, penalized by open accuracy issues.
3. `achievement_coverage`: All achievements placed and supported by guide facts.
4. `missable_coverage`: All missables warned prior to cutoff.
5. `beginner_friendliness`: Auditor rating penalized by open navigation issues and QA warnings.
6. `route_completeness`: All areas, bosses, and transitions covered.

**Pass Criteria:**
- Overall score: **>= 90%**
- Every individual category: **>= 80%**
- Deterministic QA errors: **0**
- Open critical review issues: **0**
- Open major review issues: **0**

