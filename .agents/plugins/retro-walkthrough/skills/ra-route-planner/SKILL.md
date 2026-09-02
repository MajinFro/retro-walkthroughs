---
name: ra-route-planner
description: Stages 6 & 7 of the walkthrough pipeline. Builds the verified knowledge graph (06_graph.json) and achievement roadmap (07_roadmap.json), generating Mermaid flowcharts from verified data.
---

# Stages 6 & 7 — Route Planner & Knowledge Graph Builder

**Purpose:** Construct the authoritative game progression graph and optimal 100% RetroAchievements completion roadmap.
**Rule:** You may NOT invent progression nodes, boss connections, or route shortcuts. Every node and edge in the graph must link to usable verified fact IDs (`fact_ids`).

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
      "notes": "Ensure player does not attack Whelk while in shell."
    }
  ],
  "unverifiable_achievement_ids": []
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
6. **Sequential Numbering:** Chapters must be numbered `1..N` in chronological story order.
7. **Missables Coverage:** Any achievement flagged as `missable` by RetroAchievements must appear in `missables[]` with explicit deadline and warning facts.
8. **Point of No Return (PONR):** Document all irreversible world state transitions based strictly on source evidence.

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

If `rw:plan` reports any errors, fix `06_graph.json` or `07_roadmap.json` until it passes with exit code 0.
