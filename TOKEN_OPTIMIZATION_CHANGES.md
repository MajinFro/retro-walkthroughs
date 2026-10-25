# Pipeline Token Optimization Summary (`TOKEN_OPTIMIZATION_CHANGES.md`)

## 1. Context & Diagnosis (`1.png` — 1.4B Cache Read Tokens)

From the Claude Code stats screenshot (`1.png`):
- **Total tokens:** `1.4B` (`Input: 21.3k` · `Output: 5.6M` · `Cache read: 1.4B` · `Cache write: 36.0M`)
- **Favorite model:** `Opus 5.5` across 26 sessions (longest session: `1d 10h 17m`).

### Why `Cache read` reached 1.4B
The bulk stages (`rw:extract` in Stage 4 and `rw:write` in Stage 8) already run as zero-history, single-turn model calls with tools disabled (`scripts/pipeline/llm.ts`). The 1.4B cache reads came from **quadratic tool-loop scaling in multi-turn Opus agent sessions**:
1. **Stages 6–7 (`ra-route-planner`) and Stage 9 (`ra-qa-auditor`) subagents on Opus:** Each `rw-stage` Opus agent previously had to perform 40–100+ `Grep` and `Read` calls across `05_verified.json`, `03_chunks.jsonl`, `08_packets/*.md`, and `08_chapters/*.md`. Every tool turn re-reads the entire conversation prefix (~100k–200k tokens per turn).
2. **Long-running Opus coordinator/debugging sessions:** Running the top-level coordinator on Opus (and `CLAUDE.md` previously instructing the main session to keep Stages 6–7 and 9 in the main context) multiplied every turn's cache read across hours-long sessions.
3. **Redundant raw source passages & full-chapter rewrites in Stage 8:** `chapter-packet.ts` included full raw chunks + `prev`/`next` neighbour chunks from every secondary guide even when those facts were already corroborated by the primary guide (and already had inline quotes in `## Usable facts`), while `write-chapters.ts` ran full 5,000-word chapter regeneration calls for deterministic checkpoint/heading issues or 1–2 bad line citations.

---

## 2. Files Created & Modified

### New Files
- `scripts/pipeline/plan-prep.ts` (`npm run rw:plan-prep -- <gameId>`)
- `scripts/pipeline/audit-prep.ts` (`npm run rw:audit-prep -- <gameId>`)

### Modified Files
- `CLAUDE.md`
- `package.json`
- `scripts/pipeline/lib.ts`
- `scripts/pipeline/verify-facts.ts`
- `scripts/pipeline/qa-check.ts`
- `scripts/pipeline/chapter-packet.ts`
- `scripts/pipeline/write-chapters.ts`
- `scripts/pipeline/cleanup.ts`
- `.claude/agents/rw-stage.md`
- `.agents/plugins/retro-walkthrough/skills/generate-walkthrough/SKILL.md`
- `.agents/plugins/retro-walkthrough/skills/ra-route-planner/SKILL.md`
- `.agents/plugins/retro-walkthrough/skills/ra-qa-auditor/SKILL.md`

---

## 3. Detailed Breakdown of Changes

### A. Pre-Computed Stage 6–7 Route Planning Digest (`06_plan_digest.md`)
- **Where:** `scripts/pipeline/plan-prep.ts`, hooked automatically into the end of `scripts/pipeline/verify-facts.ts` (when verification passes with 0 unresolved conflicts) and runnable standalone via `npm run rw:plan-prep -- <gameId>`.
- **What it does:** Generates `content/research/<gameId>/06_plan_digest.md` from `05_verified.json`, `01_achievements.json`, `05_aliases.json`, and `02_sources/ra-comments.txt`:
  1. **Possible Conflicts (`possible_conflicts`):** Lists every possible conflict with its competing values, sources, fact texts, and verbatim chunk quotes so Step 0 triage doesn't need to grep `05_verified.json`.
  2. **Candidate Location Alias Clusters:** Finds canonical location names across sources that share non-generic key terms (`"Coal Mines"` vs `"Moleville Mines"`), with fact counts and source IDs.
  3. **Achievements & Keyword-Matched Candidates:** Lists every achievement with its coverage status, supporting fact IDs/locations, and—for any `UNSUPPORTED` achievement—automatically searches usable facts by keyword overlap to surface likely alias mismatches.
  4. **Canonical Locations in Source Progression Order:** Groups all usable located facts by canonical location, ordered by earliest primary-guide chunk appearance, listing total facts, type counts, sample `fact_ids`, bosses, transitions, missables, and PONRs.
  5. **All Missable & PONR Facts:** Complete list with `id`, `location`, `achievement_ids`, and `text`.
  6. **Playthrough & Lockout Signals:** Scans `02_sources/ra-comments.txt` for lockout/mutual-exclusion keywords.
- **Skill/Agent updates:** `ra-route-planner/SKILL.md` and `.claude/agents/rw-stage.md` now instruct the Stage 6–7 Opus agent to read `06_plan_digest.md` first instead of grepping `05_verified.json` dozens of times.

### B. Pre-Computed Stage 9 Adversarial Audit Digest (`09_audit_digest.md`)
- **Where:** `scripts/pipeline/audit-prep.ts`, hooked automatically into the end of `scripts/pipeline/qa-check.ts` and runnable standalone via `npm run rw:audit-prep -- <gameId>`.
- **What it does:** Generates `content/research/<gameId>/09_audit_digest.md` by diffing each chapter's assigned packet facts (`packetFactIds`) against the actual citations (`[[fact-id]]`, resolved through `duplicateMap`) and prose in `08_chapters/*.md`:
  1. **Automated QA Summary:** Summarizes `09_qa.json` metrics, errors, and warnings.
  2. **Playthrough & Lockout Cross-Check (Point 1):** Lists `roadmap.playthroughs`, `playthrough_notes`, `open_questions`, and lockout lines from `ra-comments.txt`.
  3. **Per-Chapter Omission & Depth Audit (Points 2–8):**
     - Counts words, citations, and `###` sections per chapter, flagging any thin sections (`< 60` words).
     - Verifies that all expected visual maps from `chapterMaps()` are linked in the chapter.
     - Finds every **uncited high-value packet fact** (`boss`, `item`, `quest`, `missable`, `ponr`, `achievement`, `shop`, `save_point`, or chest/puzzle/floor facts) and checks whether its core `subject` + `object` terms appear in the chapter text. Facts whose IDs aren't cited *and* whose core terms don't appear in the chapter are listed as **Candidate Omissions** with their verbatim source quote.
- **Skill/Agent updates:** `ra-qa-auditor/SKILL.md` and `.claude/agents/rw-stage.md` now instruct the Stage 9 Opus auditor to read `09_audit_digest.md` first.
- **Cleanup:** `scripts/pipeline/cleanup.ts` (`rw:clean`) removes both `06_plan_digest.md` and `09_audit_digest.md` alongside `08_packets/` when cleaning an accepted game.

### C. Smarter Source Passages in Stage 8 Writer Packets (`scripts/pipeline/chapter-packet.ts`)
- **Problem:** Previously, `chapter-packet.ts` included every cited chunk + `prev` and `next` neighbour chunks from *all* guides (`gf1`, `gf2`, `gf3`, `gf4`) sorted alphabetically by `source_id` up to 160k chars—even though every fact already prints its verbatim quote inline in `## Usable facts`. Secondary-guide neighbour chunks also frequently bled adjacent chapters' collectibles into the packet.
- **What changed:**
  - Identifies `primaryGuide` using the same rule as `extract-facts.ts` (`"primary": true` in `sources.json`, else the largest guide).
  - Always includes in `## Source passages`:
    - All cited chunks from `primaryGuide`, `ra-guide`, `ra-comments`, and `checklist` sources.
    - Any cited chunk with `has_ascii_map: true` from any source.
    - Any cited chunk from a secondary guide that supports a fact **not** already backed by `primaryGuide`, or supports a `boss`, `missable`, or `ponr` fact.
  - Skips redundant secondary-guide chunks whose facts are 100% corroborated by `primaryGuide` (their verbatim quotes remain inline in `## Usable facts`).
  - Pulls `prev`/`next` context neighbour chunks **only** for `primaryGuide`.
  - Sorts `has_ascii_map` and `primaryGuide` chunks first when filling the passage character budget so primary walkthrough passages and ASCII maps are never crowded out.
  - **Escape hatch:** Set `RW_FULL_PASSAGES=1` to restore the old behavior of including all secondary chunks and secondary neighbours.

### D. Deterministic Structure/Checkpoint Fixes & Surgical Line-Patch Repairs (`scripts/pipeline/write-chapters.ts`)
- **Deterministic Auto-Fixes (`tidyStructure`):**
  1. Demotes interior top-level `## ` headings (outside code fences) to `### ` in non-overview chapters so layout checks pass without a repair call.
  2. Inserts `[MERMAID]` under the chapter title if `chapterMermaid(graph, ch.areas)` is non-empty and the writer omitted the placeholder.
  3. Appends the `> [!IMPORTANT] Cumulative 100% Checkpoint` block if missing, or deterministically corrects the `RetroAchievements Unlocked` and tracked counter lines inside an existing checkpoint block using `checkpointTotals(roadmap, n, ach.achievements)`.
- **Surgical Line-Patch Repairs (`buildRepairReq` & `applyRepairReply`):**
  - When a chapter draft's remaining problems after `tidyTags`, `fixCites`, and `tidyStructure` are purely line-local (`cites source passages instead of facts`, `cites fact ids that are not usable facts`, `malformed citations`, `contains a drafting note`, `suggests save states`, `contains "(passage only)"`, `"Unable to verify..." is run into a sentence`) and affect `<= 15` lines:
    - Sends a repair request (`maxTokens: 4096`) listing the exact offending lines and asking for a JSON patch `{"patches": [{"find": "...", "replace": "..."}]}`.
    - Applies the line replacements (or line deletions when `"replace": ""`) to the draft and re-runs `tidyTags`, `fixCites`, `tidyStructure`, and `problems()`.
  - If a chapter has structural problems (e.g., missing `[ACHIEVEMENT:id]` placement or missing missable/PONR callout) or if the model replies with full markdown, it uses the full-chapter repair path as before.

### E. Coordinator Mode Alignment (`CLAUDE.md` & `generate-walkthrough/SKILL.md`)
- Updated `CLAUDE.md` (which previously still told Claude Code to keep Stages 6–7 and 9 in the main session and use `rw-worker` for Stages 4 and 8) so it matches `generate-walkthrough/SKILL.md`:
  - Run the top-level coordinator on **Sonnet**.
  - Use `npm run rw:auto -- <gameId>` for command stages.
  - Delegate judgment stages (`2` on Sonnet; `5`, `6–7`, `9` on Opus) to fresh `rw-stage` subagents.

---

## 4. Expected Token Savings (8–10M Guide Baseline vs. New Architecture)

Based on actual logs in `content/research/1471/` and `content/research/10113/` (`_usage.jsonl` and `_activity.jsonl`), here is how the two token metrics change:

### A. Pipeline Tokens (`rw:status` / `rw:analyze`: ~8–10M on a large game)
**Expected new range: ~5.0M – 6.5M total tokens (~30–40% lower overall, and ~40–50% lower on Claude quota)**

| Pipeline Stage | Before (typical 8–10M game) | After these changes | Why |
| :--- | :--- | :--- | :--- |
| **Stage 4: Fact Extraction** (`rw:extract`) | **~3.5M – 5.5M** *(mostly on `agy` Gemini Flash; ~0.7M on Claude Haiku for `ra-comments`)* | **~3.5M – 5.5M** *(0 Claude Sonnet/Opus cost)* | Unchanged (already 1-shot calls, and guide chunks run on `agy` Gemini Flash so they do not touch Claude quota). |
| **Stage 8: Initial Chapter Writing** (`rw:write`) | **~3.0M – 4.8M** on Claude Sonnet (`100k–250k` input per chapter) | **~2.0M – 3.2M** *(~25–35% less)* | `chapter-packet.ts` no longer dumps redundant secondary-guide raw chunks (whose facts are already corroborated by the primary guide and have quotes inline) or secondary-guide `prev`/`next` neighbour chunks. |
| **Stage 8: Repairs & `--fix` Passes** (`write-repair` / `write-fix`) | **~0.8M – 1.8M** on Claude Sonnet | **~0.2M – 0.6M** *(~60–75% less)* | 1. `tidyStructure()` deterministically fixes missing/wrong Checkpoint blocks, missing `[MERMAID]` tags, and `## ` headings for **0 tokens**.<br>2. Line-local repairs (bad citations, drafting notes, save-state mentions) now return a compact JSON line-patch (`maxTokens: 4096`) instead of rewriting all 5,000 words.<br>3. Cleaner packets prevent secondary-guide collectible bleed (which caused `write-fix` passes on `10113`). |
| **Stages 6–7 & 9 Agents** (`_activity.jsonl` final context) | **~350k – 550k** (`1471`: 351k; `10113`: 549k) | **~150k – 250k** *(~55% less)* | Reading `06_plan_digest.md` and `09_audit_digest.md` upfront replaces dozens of large `Grep`/`Read` outputs in the agent's context window. |

- **Net effect on Claude usage limits:** If a large game previously consumed **~4.5M–6.5M Claude tokens** (excluding `agy` Gemini Flash extraction tokens), it should now take **~2.5M–3.8M Claude tokens**, substantially reducing mid-write session limit cutoffs like those seen on `10113`.

### B. Claude Code `/stats` Tokens (Cumulative `Cache read` across tool turns)
**Expected new range: ~65–80% lower per game**

The `/stats` screenshot (`1.png`) showed **1.4B** cache reads while `_usage.jsonl` logged ~3M–12M per game because **every tool call inside a subagent re-reads the entire conversation prefix up to that turn**:
- In `10113` (`_activity.jsonl`), Stage 6–7 (`opus`) made **81 tool calls** ending at `292k` context (~12M cumulative `cache_read` tokens), and Stage 9 (`opus`) made **125 tool calls** ending at `212k` context (~14M cumulative `cache_read` tokens).
- In `1471` (`_activity.jsonl`), Stage 6–7 (`opus`) made **50 tool calls** (`159k` final context) and Stage 9 (`opus`) made **89 tool calls** (`152k` final context) (~11M cumulative `cache_read` tokens).

Because cumulative `cache_read` scales quadratically as **`(number of tool calls) × (average context size)`**, reducing **both** the tool calls (from ~80–125 down to ~20–35 via `06_plan_digest.md` and `09_audit_digest.md`) **and** the context size (by ~50%) compounds:
- `0.35 tool calls × 0.50 context size ≈ 0.175` (**~80% reduction** in Opus subagent `cache_read` tokens per game).
- Running the top-level coordinator session on **Sonnet** instead of Opus eliminates the remaining Opus cache-read overhead.

---

## 5. Verification Checklist for Claude Code

When your usage resets, you can ask Claude Code to review and test these changes with:
1. `git diff` — inspect all changes across `scripts/pipeline/`, `CLAUDE.md`, `.claude/agents/rw-stage.md`, and `.agents/plugins/retro-walkthrough/skills/`.
2. Pick an existing researched game in `content/research/<gameId>/` and run:
   - `npm run rw:plan-prep -- <gameId>` → inspect `content/research/<gameId>/06_plan_digest.md`
   - `npm run rw:audit-prep -- <gameId>` → inspect `content/research/<gameId>/09_audit_digest.md`
   - `npm run rw:packet -- <gameId> 1` → verify the new passage count and redundant-secondary-chunk summary line.
