---
name: ra-fact-extractor
description: Stage 4 of the walkthrough pipeline. Reads source chunks and extracts atomic, quote-backed facts into 04_facts/*.jsonl. No narration, no assumptions, no game knowledge from memory.
---

# Stage 4 — Fact Extraction

You convert source text into structured facts. **You may only record what the chunk text says.** Your own knowledge of the game is forbidden, even when you are sure it is correct.

## Workflow

**Default: run the script.** `npm run rw:extract -- <id>` sends every unprocessed chunk to a model in batches with the rules below as its instructions, checks each fact like `rw:verify`, retries failures once, renumbers ids, and writes `04_facts/<source>_<from>-<to>.jsonl` plus `_skipped.txt` lines. Re-run it until `npm run rw:chunks -- <id> --progress` prints `✅ ... Stage 4 complete`, then run `npm run rw:verify -- <id>`. Options: `--dry-run`, `--source <id>`, `--max-batches N`, `--full` (no focused mode), `--model`, `--batch` (Anthropic Message Batches API). See "Bulk stages run as scripts" in the `generate-walkthrough` skill.

**Fallback (no model backend available): extract by hand, in batches.**

1. See what's left: `npm run rw:chunks -- <id> --progress`. It ends with a `NEXT BATCH:` command.
2. Run that command to read the batch (e.g. `npm run rw:chunks -- <id> --source gf1 --from 21 --to 28`).
3. **Every chunk in the batch must be accounted for before moving on.** For each chunk, either:
   - write its facts to `content/research/<id>/04_facts/<source>_<from>-<to>.jsonl` (one JSON object per line, CRLF), or
   - add a line to `04_facts/_skipped.txt` with the chunk id and a specific reason, e.g. `gf1#3 table of contents` or `ra-comments#14 chatter only: thanks/congratulations, no gameplay info`.
4. Every ~5 batches, run `npm run rw:verify -- <id>` to catch bad quotes early. Fix rejected facts right away.
5. Repeat from step 1 until `--progress` prints `✅ ... Stage 4 complete`.

**Done means 100%.** Stage 4 is complete only when every chunk of every source (including `ra-comments`) is cited by a fact or listed in `_skipped.txt`. There is no "close enough": `rw:status` stays 🟡, `rw:plan` refuses to run, and `rw:score` rejects the walkthrough while any chunk is unprocessed. If you resume in a new conversation, `--progress` tells you exactly where to continue.

**Order:** do the main full walkthrough (usually `gf1`) first, then `ra-comments`, then the remaining sources. Secondary sources give the corroboration that makes facts ✅ verified.

## Fact schema

```json
{"id":"gf1-117-1","type":"event","subject":"Sabin","predicate":"joins_party","object":null,"location":"Mt. Kolts","requires":["Defeat Vargas"],"achievement_ids":[],"missable":false,"text":"Sabin joins the party after Vargas is defeated on Mt. Kolts.","evidence":[{"source_id":"gf1","chunk_id":"gf1#117","quote":"After defeating Vargas, Sabin will join"}]}
```

- `id` = `<source_id>-<chunk n>-<k>` (k counts 1, 2, 3… within that chunk). Never reuse an id.
- `type` is one of: `location, transition, event, boss, enemy, item, shop, npc, quest, mechanic, missable, ponr, achievement, map, save_point, tip`.
- `subject` / `predicate` / `object` / `location`: short, consistent names using the guide's wording. Use snake_case predicates from this list where possible: `located_in, leads_to, contains_item, sold_at, joins_party, leaves_party, defeated_by, weak_to, drops, requires, unlocks, triggers, missable_after, closes_after, recommended_level, save_point_at, how_to_unlock`.
- `text`: one plain sentence restating only what the quote supports.
- `evidence[].quote`: **copied verbatim** from the chunk (≥ 12 characters). Use `...` to join two verbatim pieces from the same chunk. The script rejects any quote it can't find. The quote must contain the claim itself: every multi-digit number in `text` (HP, prices, counts, times) must appear in a quote, or `rw:verify` rejects the fact. Never cite an unrelated line just to reach 12 characters; join the short line to its heading instead (`BOSS: Magikoopa...HP: 1600/500/???`).
- `achievement_ids`: link a fact to an RA achievement only when the fact directly explains how to earn it (match on the achievement **description**, not its title; old guides never use RA titles). Leave as `[]` for in-game items, chests, and sidequests that do not have an achievement!
- `missable: true` only if the source says the thing can be permanently missed, or gives a deadline.

## What to extract (be exhaustive; detail = quality)

### 1. True 100% In-Game Completion (MANDATORY)
Do NOT restrict fact extraction to events that have RetroAchievements badges! You are building the knowledge base for **True 100% In-Game Completion**:
- **Every Treasure Chest & Hidden Item:** Extract EVERY chest and hidden item mentioned in the guide as an `item` fact (`predicate: "contains_item"` or `"hidden_at"`), with its exact dungeon/floor location. Never leave dungeon chests behind.
- **Dungeon Navigation & Room Flow:** Extract staircase connections, locked door keys, floor transitions, and room directions (`transition`, `predicate: "leads_to"` or `"accessed_via"`).
- **All Puzzle Solutions:** Step-by-step block pushing, switch combinations, bomb triggers, hook points, and riddle answers (`mechanic` or `event`).
- **All Sidequests & Optional Content:** Optional dungeons (e.g. Ancient Cave, secret shrines), mini-games, NPC side-stories, and hidden superbosses (`quest`, `event`, `boss`).
- **Capsule Monsters / Pets / Summons:** Locations, recruitment requirements, food preferences, and evolutions (`npc` / `mechanic`).
- **Boss Statistics & Weaknesses:** Boss HP, elemental weaknesses/resistances, dangerous attack patterns, and turn-by-turn counter tactics (`boss`, predicates: `weak_to`, `countered_by`, `recommended_level`).

### 2. Format-Specific Guidelines
- **Command-Driven Games:** For menu-driven adventure games (e.g. Princess Tomato, Shadowgate, Deja Vu), extract each concrete action as a fact: `MOVE` (transition), `TAKE` (item), `USE` (item/mechanic), `TALK/LOOK/HIT/GIVE` (event/npc). Keep the command verb in `predicate`.
- **Item Lists & Tables:** If a source provides an item list/table (e.g. ITEM / WHERE FOUND / WHERE USED), extract EVERY ROW as an individual `item` fact (`contains_item`, `used_at`).
- **Collection Achievements:** Never link a "collect every item" achievement solely to a tautological fact echoing the achievement's title or description. Link the achievement to the facts for all individual items that comprise the collection.
- **ASCII & Visual Maps:** One `map` fact per map. Subject = area name, quote = map title or distinct identifier.

### 3. Community & RA Metadata (`ra-guide`, `ra-comments`)
- **`ra-guide`** is the official RetroAchievements achievement guide for the game (GitHub guides wiki), written by achievement hunters for exactly this set. Each achievement appears as `Title (points) [achievement <id>]`, its description in italics, then tips, warnings, requirements and video links. Extract every tip, requirement, missable warning, order-of-play advice and trigger condition as facts with `achievement_ids` (use the id in brackets). Do not quote the title or description line itself as evidence (the verifier rejects achievement descriptions); quote the guide's own explanation. Record video links as `tip` facts only when the text says what the video shows.
- Each `ra-comments` chunk is one achievement's block (header, `Description:` line, then `[user] comment` lines), or part of a long block; the chunk's `section` names the achievement. The first block is general game comments.
- **Read every comment.** Extract per-achievement tricks, gotchas, item lockouts, emulator/core issues, trigger conditions, and difficulty warnings → `achievement` facts with `achievement_ids`. Long threads (e.g. a notoriously hard achievement) often hide the most useful tips deep in the chatter.
- **Non-English comments count.** Read them; quote them verbatim in the original language, add a faithful English `translation` to that evidence entry, and write the `text` field in English, e.g. `{"source_id":"ra-comments","chunk_id":"ra-comments#11","quote":"Solo funciona si se obtiene las 2 naves","translation":"It only works if you get the 2 ships"}`. Quote matching uses `quote`; the overlap check compares `text` against `translation`.
- Fact ids must be unique across all fact files. If a chunk already has facts from an earlier batch, search `04_facts/` for `"<source>-<n>-` and continue numbering after the highest `k`. `rw:verify` rejects duplicate ids.
- Do NOT create a fact whose only evidence is the `Description:` line; that restates the achievement and supports nothing.
- A chunk may be skipped only after you read it and it has no gameplay information at all (thanks, "gg", release/fix announcements, complaints). Skip it with a reason: `ra-comments#14 chatter only: no gameplay info`.

## Forbidden

- **Superficial Chunk Sampling:** NEVER take shortcuts by extracting only 1 or 2 arbitrary lines from a rich walkthrough chunk just to mark it done. If a chunk covers a dungeon floor with 4 chests and a switch puzzle, you must extract all 4 chests and the switch puzzle steps!
- Facts with no quote, paraphrased quotes, or quotes from a different chunk.
- Quoting an RA achievement's description as evidence for a gameplay fact. Gameplay facts must cite guide walkthrough text!
- Skipping walkthrough chunks in `_skipped.txt`. `_skipped.txt` is strictly for non-game text (copyright, author bios, version history, table of contents, and RA comment chunks that are pure chatter), always with a reason.
- Leaving chunks unaccounted for (neither cited nor skipped), or declaring Stage 4 done below 100%.
- Filling gaps from memory ("everyone knows the Silver Sword is in…").
- Merging several claims into one fact. Keep facts atomic.
