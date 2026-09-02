---
name: ra-fact-extractor
description: Stage 4 of the walkthrough pipeline. Reads source chunks and extracts atomic, quote-backed facts into 04_facts/*.jsonl. No narration, no assumptions, no game knowledge from memory.
---

# Stage 4 — Fact Extraction

You convert source text into structured facts. **You may only record what the chunk text says.** Your own knowledge of the game is forbidden, even when you are sure it is correct.

## Workflow (batches)

1. See what's left: `npm run rw:chunks -- <id> --progress`
2. Read a batch of 5–10 chunks: `npm run rw:chunks -- <id> --source gf1 --from 21 --to 28`
3. Write the facts for that batch to `content/research/<id>/04_facts/<source>_<from>-<to>.jsonl` (one JSON object per line, CRLF).
4. Chunks with nothing to extract (legal text, version history, credits, table of contents) go on a line in `04_facts/_skipped.txt`, e.g. `gf1#3 table of contents`.
5. Every ~5 batches, run `npm run rw:verify -- <id>` to catch bad quotes early. Fix rejected facts right away.
6. Repeat until progress reaches ~100% for every source, including `ra-comments`.

**Order:** do the main full walkthrough (usually `gf1`) first, then `ra-comments`, then the remaining sources. Secondary sources give the corroboration that makes facts ✅ verified.

## Fact schema

```json
{"id":"gf1-117-1","type":"event","subject":"Sabin","predicate":"joins_party","object":null,"location":"Mt. Kolts","requires":["Defeat Vargas"],"achievement_ids":[],"missable":false,"text":"Sabin joins the party after Vargas is defeated on Mt. Kolts.","evidence":[{"source_id":"gf1","chunk_id":"gf1#117","quote":"After defeating Vargas, Sabin will join"}]}
```

- `id` = `<source_id>-<chunk n>-<k>` (k counts 1, 2, 3… within that chunk). Never reuse an id.
- `type` is one of: `location, transition, event, boss, enemy, item, shop, npc, quest, mechanic, missable, ponr, achievement, map, save_point, tip`.
- `subject` / `predicate` / `object` / `location`: short, consistent names using the guide's wording. Use snake_case predicates from this list where possible: `located_in, leads_to, contains_item, sold_at, joins_party, leaves_party, defeated_by, weak_to, drops, requires, unlocks, triggers, missable_after, closes_after, recommended_level, save_point_at, how_to_unlock`.
- `text`: one plain sentence restating only what the quote supports.
- `evidence[].quote`: **copied verbatim** from the chunk (≥ 12 characters). Use `...` to join two verbatim pieces from the same chunk. The script rejects any quote it can't find.
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

### 3. Community & RA Metadata
- RA comments: per-achievement tricks, gotchas, item lockouts, and trigger conditions → `achievement` with `achievement_ids`.

## Forbidden

- **Superficial Chunk Sampling:** NEVER take shortcuts by extracting only 1 or 2 arbitrary lines from a rich walkthrough chunk just to mark it done. If a chunk covers a dungeon floor with 4 chests and a switch puzzle, you must extract all 4 chests and the switch puzzle steps!
- Facts with no quote, paraphrased quotes, or quotes from a different chunk.
- Quoting an RA achievement's description as evidence for a gameplay fact. Gameplay facts must cite guide walkthrough text!
- Skipping walkthrough chunks in `_skipped.txt`. `_skipped.txt` is strictly for non-game text (copyright, author bios, version history, table of contents).
- Filling gaps from memory ("everyone knows the Silver Sword is in…").
- Merging several claims into one fact. Keep facts atomic.
