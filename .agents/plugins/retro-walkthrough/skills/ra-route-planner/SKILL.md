---
name: ra-route-planner
description: Stages 6 & 7 of the walkthrough pipeline. Builds the verified knowledge graph (06_graph.json) and achievement roadmap (07_roadmap.json), generating Mermaid flowcharts from verified data.
---

# Stages 6 & 7 — Route Planner & Knowledge Graph Builder

**Purpose:** Construct the authoritative game progression graph and optimal 100% RetroAchievements completion roadmap.
**Rule:** You may NOT invent progression nodes, boss connections, or route shortcuts. Every node and edge in the graph must link to usable verified fact IDs (`fact_ids`).

## Step 0: Verification cleanup (folded in from Stage 5)

The coordinator no longer runs a separate Stage 5 agent when `rw:verify` passes (exit 0); this stage does that cleanup first, in the same context, because the graph's area labels and `05_aliases.json` are one job:
0. Run `npm run rw:aliases -- <id>` first. It finds version-comparison tables in the sources (a header row such as `FC | NES | GBC | Switch`), picks the version whose names the achievements use, and merges each row into `05_aliases.json` (e.g. `Midenhall: Roresia, Lorasia`). Read its summary and skip lines; then add by hand only what it could not cover.
1. Follow sections 2–4 of the `ra-fact-verifier` skill: extend `05_aliases.json` for naming differences between sources (areas, bosses, items, spellings), add `05_corroborations.jsonl` entries where the same fact is filed differently, and triage `possible_conflicts` in `05_verified.json` into `05_resolutions.json`. Re-run `npm run rw:verify -- <id>` (must still exit 0).
2. If `rw:verify` lists achievements with no supporting fact, look for a source before giving up. First check whether the guides already cover it under another name: RA titles rarely match in-game names ("Thrower" was the Slingshot in StarTropics II), so search the chunks and facts for the nouns in the achievement's **description**, and for the enemy, item or place it describes. When the facts are already there, add the achievement id to those facts' `achievement_ids` and an alias in `05_aliases.json`. Only then search the collected chunks (`npm run rw:chunks -- <id> --grep "<term>"`), then the web (RA forum topic, wikis, achievement guides) with the `ra-source-collector` tools (`rw:browse`, `rw:collect`), and extract any new source (`rw:chunk`, `rw:extract`, `rw:verify`). Only when that finds nothing, mark them `unverifiable_achievement_ids` and report them to the coordinator, so the user is asked once.
A real conflict (`rw:verify` exit 2) still goes to a separate Stage 5 agent before this stage.

## Stage 6: Knowledge Graph (`06_graph.json`)

Construct `content/research/<gameId>/06_graph.json`.

### Graph Structure
```json
{
  "nodes": [
    {
      "id": "Narshe",
      "label": "Narshe Mining Town",
      "kind": "area",
      "fact_ids": ["gf1-10-1"]
    },
    {
      "id": "Whelk",
      "label": "Whelk (Ymir)",
      "kind": "boss",
      "fact_ids": ["gf1-15-2", "neo1-12-1"]
    },
    {
      "id": "Ach_1234",
      "label": "First Steps",
      "kind": "achievement",
      "achievement_id": 1234
    }
  ],
  "edges": [
    {
      "from": "Narshe",
      "to": "Whelk",
      "kind": "leads_to",
      "label": "Mines B2",
      "fact_ids": ["gf1-15-1"]
    },
    {
      "from": "Whelk",
      "to": "Ach_1234",
      "kind": "unlocks",
      "fact_ids": ["gf1-15-3"]
    }
  ]
}
```

- **Node kinds:** `area`, `boss`, `npc`, `item`, `key_item`, `quest`, `achievement`, `missable`, `ponr`, `save_point`
- **Edge kinds:** `leads_to`, `requires`, `unlocks`, `contains`, `missable_before`
- **Validation rule:** Every node (except achievement nodes) and every edge must cite usable fact IDs from `05_verified.json`.

---

## Stage 7: Achievement Roadmap (`07_roadmap.json`)

Construct `content/research/<gameId>/07_roadmap.json`.

### Roadmap Structure
```json
{
  "format": "prose",
  "true_100_criteria": {
    "genre": "Turn-Based RPG",
    "categories": [
      {
        "name": "Dungeon Chests & Hidden Items",
        "description": "Every treasure chest opened and hidden ground tile collected across all dungeons.",
        "tracked_per_chapter": true
      },
      {
        "name": "Sidequests & Superbosses",
        "description": "Complete all optional dungeons, mini-games, and superboss encounters.",
        "tracked_per_chapter": true
      },
      {
        "name": "Collectibles & Companions",
        "description": "Recruit and max all optional summons, pets, capsule monsters, or ultimate weapons.",
        "tracked_per_chapter": true
      }
    ],
    "chapter_checkpoints": ["chests", "collectibles", "sidequests"]
  },
  "playthroughs": 1,
  "playthrough_notes": "100% completion requires a single comprehensive playthrough with no missed missables.",
  "settings_notes": "Hardcore Mode enabled. Normal difficulty or higher required for Achievement 5678.",
  "fact_ids": ["gf1-5-1", "ra-comments-1-1"],
  "counter_totals": { "Dungeon Chests": 142, "Capsule Monsters": 7 },
  "missables": [
    {
      "achievement_id": 1234,
      "label": "Water Scroll in Cave",
      "deadline": "Before boarding the airship at the end of Chapter 2",
      "chapter": 2,
      "fact_ids": ["gf1-45-3"]
    }
  ],
  "ponr": [
    {
      "label": "Floating Continent",
      "chapter": 6,
      "warning": "Boarding the Blackjack locks out all World of Balance sidequests and chests.",
      "fact_ids": ["gf1-180-1"]
    }
  ],
  "chapters": [
    {
      "n": 1,
      "title": "Escape from Narshe",
      "areas": ["Narshe", "Narshe_Mines", "Whelk"],
      "achievement_ids": [1234, 1235],
      "fact_ids": ["gf1-10-1", "gf1-15-1", "gf1-15-2"],
      "counters": { "Dungeon Chests": 14, "Capsule Monsters": 1 },
      "notes": "Ensure player does not attack Whelk while in shell."
    }
  ],
  "unverifiable_achievement_ids": [],
  "open_questions": [
    { "question": "Do Tonight's Match-up codes disqualify the V.Hard achievements?", "guidance": "No source says. Play the V.Hard run with no codes; use codes only in chapter 7's Normal games.", "chapters": [2, 3, 4, 5, 6] }
  ]
}
```

### Strict Requirements
1. **Game Format Specification:** Set `"format"` to `"command_steps"` for text/menu-driven adventure games (e.g. Princess Tomato, Shadowgate, Deja Vu, Snatcher) or `"prose"` for standard RPGs, action, and platformers.
2. **True 100% Completion Criteria (`true_100_criteria`):**
   Explicitly define what constitutes True 100% in-game completion for this specific game. Inspect the GameFAQs 100% FAQs and genre standards:
   - **RPGs:** All dungeon treasure chests, hidden ground items, all sidequests, all optional bosses, ultimate equipment, and collectible evolutions.
   - **Action-Adventure / Metroidvania:** 100% map tiles, all health/energy tanks, all missile/item expansions, all heart pieces.
   - **Platformers:** All secret exits, bonus levels, all K-O-N-G/Yoshi coins, max completion percentage (e.g. 101% / 96 exits).
   - Specify `chapter_checkpoints` so the writer includes a numerical cumulative tracking checkpoint at the end of every chapter.
3. **Playthrough & Mutual Exclusion Audit:** Must audit `ra-comments` and guide notes for mutually exclusive achievements or item locks. If an achievement locks out another (e.g. buying juices prevents receiving an item later), you MUST account for multiple playthroughs or chapter password replays in `playthroughs` and `playthrough_notes`.
4. **Granular Graph Nodes:** Do NOT collapse entire multi-floor dungeons into a single artificial area node. Dungeons must have distinct milestone nodes or clear floor-by-floor specifications in chapter notes.
5. **100% Achievement Placement:** Every single RetroAchievement from `01_achievements.json` MUST be assigned to exactly ONE chapter in `chapters[].achievement_ids`. No duplicates, no dropped achievements.
6. **Sequential Numbering:** Chapters must be numbered `1..N` in chronological story order. Do not start a `title` with "Chapter N" (the assembler adds "Chapter <n>:"). When the game has its own numbered chapters and the roadmap splits or merges them, set `game_chapter` on each roadmap chapter: the heading then names the game's chapter, and "Chapter N" map titles are matched to it.
7. **Missables Coverage:** Any achievement flagged as `missable` by RetroAchievements must appear in `missables[]` with explicit deadline and warning facts.
8. **Point of No Return (PONR):** Document all irreversible world state transitions based strictly on source evidence.
9. **Checkpoint counters:** For every countable `true_100_criteria` category (hidden boxes, chests, heart pieces…), put its total in `counter_totals` and each chapter's share in `chapters[].counters`; the shares must add up to the total. The packet then gives each writer exact running totals ("Hidden Boxes: 12 / 39"), achievements and points included, and `rw:qa` rejects checkpoints with other numbers. Writers never count by hand. When the guides number a category's items ("Gold Skulltula [012]", "Piece of Heart #5"), also list each chapter's numbers in `chapters[].collectibles` (e.g. `{"Gold Skulltulas": [8, 9, 10]}`, one list per numbered counter, as many numbers as that chapter's counter, each number in one chapter only; `rw:plan` checks this). The packet then tells each writer which numbers are new in its chapter, and `rw:qa` warns when a chapter routes to another chapter's number. In 10113 five chapters sent the player after Skulltulas and hearts that earlier chapters had already collected; only the Stage 9 review caught it.
10. **Area labels match fact locations:** Packets pull facts whose `location` matches a chapter area's label (through `05_aliases.json`). Label area nodes with the location name the guides use ("Coal Mines", not "Moleville Mines Expedition"), and add aliases for the variants. Never add a one-word generic alias ("Cave", "Tunnel", "Ruins", "Castle") unless the game has exactly one such place: it pulls every fact with that location into one area and inflates corroboration; `rw:plan` warns about them. `rw:plan` warns about every area label that matches no fact location and lists similar location names; fix every one before writing, or that chapter's writer gets a thin packet.
11. **Achievement placement:** `rw:plan` warns when an achievement's supporting facts are all located in another chapter's areas. Check each warning: move the achievement, or keep it when the sources say it is earned later (for example, an item bought early but used later).
12. **Conditional choices:** Wherever the route takes two rewards that may exclude each other (two weapons offered by different NPCs, two branches, a reward that depends on what you already carry) or relies on an NPC offering something after an earlier event, find a passage confirming the later step still happens in that order. Game scripts and dialogue dumps are the best evidence, because they show conditional offers ("you don't have a weapon? take this"): grep for the NPC and item (`npm run rw:chunks -- <id> --grep "<name>"`) and read the surrounding chunk. If nothing confirms the order, plan the route the sources do support, list the doubtful step as a missable, and say why in the chapter `notes`. In StarTropics II the route took Jack's dagger and then Cleopatra's, but the game script showed Cleopatra only offers hers when Mike has no dagger. Only the Stage 9 review caught that.
13. **Reloaded saves:** When later chapters load a save made earlier (ending runs, branch replays), the chapter that makes the save must list in its `notes` everything those later chapters need from it: key items, keys, gold, levels, and the achievements still left to earn after it. Walk each reloading chapter's route and check every requirement against that list. In 1471 the master save never required a Magic Key, though two ending runs reloaded it and needed one for Gwaelin's door; only the Stage 9 review caught that.
14. **Return trips and boss placement:** A place partly locked behind a later key, spell or item (a Silver Door, a jail cell, a sealed room) must appear again in the `areas` of the chapter where the player gets that key, or a later one, so its contents reach a writer. Otherwise the early chapter's writer drops them as unreachable and no later chapter covers them. Put every boss node in the `areas` of the chapter where it is fought, or link it to one of that chapter's areas, so the Boss Index can name its chapter. `rw:plan` warns about both: "return trip: …" and "boss node(s) are not in a chapter's areas". In 91470 (a Dragon Quest II re-run) Leftwyne's lottery and Midenhall's Golden Key room were never written, and six bosses showed "—" in the Boss Index. A blind reader preferred the older version for exactly that.
15. **Open questions:** Every rule the route depends on that no source settles (do in-game codes, passwords, a difficulty setting or a second controller void an achievement? does a count run per game or in total?) goes in `open_questions` with the safe-play `guidance` the route follows and the `chapters` it affects (omit `chapters` for all). Each affected packet lists them, and writers must call them unconfirmed and never recommend the risky option. Writing them only in chapter `notes` is not enough: in 593 a writer still recommended a power-up code on the V.Hard run.

---

## Validation Gate

Run the automated validator:
```powershell
npm run rw:plan -- <gameId>
```
This script validates node/edge relationships, chapter completeness, achievement placement, and automatically generates `06_graph.md` with:
- Global game progression flowchart (`flowchart TD`)
- Achievement dependency graph (`flowchart LR`)
- Per-chapter routing diagrams

If `rw:plan` reports any errors, fix `06_graph.json` or `07_roadmap.json` until it passes with exit code 0. Then resolve its area-label and placement warnings (requirements 10 and 11) before Stage 8.
