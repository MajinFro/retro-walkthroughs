---
name: ra-walkthrough-writer
description: Stage 8 of the walkthrough pipeline. Writes exhaustive, idiot-proof, first-time-player walkthrough chapters backed by chapter packets (facts + raw source passages).
---

# Stage 8 — Walkthrough Writer

**Objective:** Write extremely detailed, idiot-proof walkthrough prose for a first-time player seeking 100% RetroAchievements completion.

**Absolute Rules:**
1. **Source-Bound Only:** You must NOT use model memory or general game knowledge. You may only state what is supported in your chapter packet.
2. **Every Claim Must Cite Evidence:** Every substantive instruction, navigation step, treasure location, and boss tip must cite its fact ID using `[[fact_id]]` (e.g. `[[gf1-117-1]]` or `[[gf1-117-1, neo1-84-2]]`).
3. **Never Invent Data:** If a detail is missing from sources, write: `"Unable to verify from collected sources."`
4. **Preserve Raw ASCII Maps:** If the source passages contain an ASCII map, copy it verbatim inside a code block. Do NOT invent new ASCII maps.
5. **Hardcore Mode:** Assume Hardcore Mode (no save states, no cheat codes, no rewinds).

---

## Workflow: Chapter by Chapter

**Default: run the script.** `npm run rw:write -- <gameId>` builds each missing chapter's packet, sends it to a model with these rules as its instructions (one call per chapter), checks the draft (citations, achievement tags, callouts, checkpoint totals, drafting notes), repairs it once if needed, writes `08_chapters/`, and runs `rw:assemble` + `rw:qa`. `npm run rw:write -- <gameId> --fix` revises the chapters that have QA errors or score-affecting warnings. Name chapters to limit a run (`rw:write -- <gameId> overview 3`); `--force` rewrites existing files.

**Fallback (no model backend available): write by hand.** Do NOT attempt to write the entire walkthrough at once. Generate one chapter per turn:

### 1. Build the Chapter Packet
Run the packet generator:
```powershell
# For the game overview:
npm run rw:packet -- <gameId> overview

# For chapter 1, 2, ... N:
npm run rw:packet -- <gameId> 1
```
This generates `content/research/<gameId>/08_packets/<00_overview.md | 01.md ...>`.

### 2. Read the Packet
Read the packet file (`view_file` in Antigravity, `Read` in Claude Code). Packets are large, so read them in line-range slices. Notice that it contains:
- **Assigned Achievements:** List of exact IDs to place.
- **Missables & PONR Warnings:** Explicit deadlines that require callouts.
- **Verified Facts:** Usable atomic statements with supporting quotes.
- **Source Passages:** The verbatim raw text chunks from the original guides. Use these to write rich, step-by-step room-by-room directions.

### 3. Write Chapter Markdown
Save your draft to `content/research/<gameId>/08_chapters/<00_overview.md | 01.md ...>`.

---

## Required Chapter Structure

Each chapter file (e.g. `01.md`) MUST include:

1. **Chapter Title & Diagram:**
   ```markdown
   ## Chapter 1: [Chapter Title]

   [MERMAID]
   ```
   *(The assembler replaces `[MERMAID]` with the verified route diagram).*

2. **Area Overview & Preparation:**
   Context, objectives, inventory warnings, and permanent lockouts.

3. **Item Manifest Table (MANDATORY for chapters with item collection achievements):**
   If the chapter contains an achievement for collecting all items, provide the full item table before the walkthrough steps:
   ```markdown
   ### Chapter Items to Collect (N Items Total)
   | Item | Where Found | Action / Requirement | Citation |
   |---|---|---|---|
   | Flower | Starting road | **TAKE** | [[gf1-602-1]] |
   | Water | Lake Quench | **TAKE** | [[gf1-605-1]] |
   ```

4. **Step-by-Step Micro-Routing & Dungeon Traversal:**
   - **For Command-Driven Games (`"format": "command_steps"`):**
     Write clean, numbered, unambiguous command steps that leave zero guesswork:
     ```markdown
     1. **MOVE** → Lake Quench [[gf1-106-1]]
     2. **TAKE** → Water (✅ Item 1/5) [[gf1-106-2]]
     3. **MOVE** → Celery Forest [[gf1-106-3]]
     4. **GIVE** → Water to Persimmon [[gf1-107-1]]
     5. **TALK** → Persimmon [[gf1-107-2]]
        [ACHIEVEMENT:98042]
     ```
   - **For Standard RPGs/Action Games (`"format": "prose"`):**
     **NO SUMMARIES ALLOWED.** You must guide the player room-by-room and floor-by-floor (e.g. `### Area Name`, `#### 1F`, `#### B1F`). For each floor:
     - Describe the exact navigation path (e.g. "Take the north door", "Descend via the northwest staircase").
     - **Every Treasure Chest:** Explicitly route to every chest and state its contents (e.g. "Open the chest in the southwest alcove for an **[Insecticide]** [[gf3-33-4]]"). Never leave a chest behind.
     - **All Puzzle Solutions:** Explain step-by-step puzzle solutions (e.g. "Push the yellow block 2 tiles right, place a bomb by the cracked wall, then hit the blue switch").
   - **Visual Map Integration (MANDATORY):**
     The packet's "Visual maps for this chapter" section lists every collected map for the chapter. Embed EACH one as a prominent link directly beneath the heading of the area it shows (copy the URL exactly; `rw:qa` warns about every listed map that is not linked):
     ```markdown
     🗺️ **Dungeon Map:** [View Lake Cave Map by snesmaster1](https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/3633-lake-cave-map)
     ```

5. **Missable Warnings Before the Event:**
   Any missable item or achievement MUST have a warning callout BEFORE the player triggers the cutoff:
   ```markdown
   > [!WARNING]
   > **Missable Achievement Warning:** Do NOT talk to Percy yet. Select the Special command menu and use Diospyros first to earn [ACHIEVEMENT:1234] [[ra-7-1]].
   ```

6. **Point of No Return Warnings:**
   Write one for each point of no return the packet lists, and no others. Leaving a level, world or area is not a point of no return unless a source says the player cannot come back (rw:qa warns about extra ones). When the packet lists none, remind the player to finish an area with a `> [!TIP]` ("Before you leave …") instead. Each listed one must include:
   ```markdown
   > [!CAUTION]
   > **Point of No Return:** Leaving Spinach Heights permanently locks all uncollected Chapter 1 items [[gf1-2-3]]. Complete all items before proceeding.
   ```

7. **Achievement Placement:**
   Insert the achievement placeholder at the exact moment where it unlocks:
   ```markdown
   [ACHIEVEMENT:1234]
   ```
   Follow it immediately with instructions and strategy for fulfilling the condition.

8. **Boss & Combat Strategies:**
   Detailed breakdown:
   - For menu/puzzle duels (e.g. Finger Wars): document the EXACT move pattern from the source (e.g. "Always play Scissors, then point Down").
   - For RPG bosses: HP, elemental weaknesses/resistances, dangerous attacks, recommended level/equipment, and turn-by-turn counter strategies.

9. **Cumulative 100% Progress Checkpoint (MANDATORY):**
   Conclude every chapter with an explicit cumulative numerical tracking block. Use exactly the running totals in the packet's "Cumulative checkpoint totals" section (computed from the roadmap; `rw:qa` rejects other numbers), cite a fact for the chapter's collectibles, and never write notes about other chapters' drafts or files:
   ```markdown
   > [!IMPORTANT]
   > ### Chapter 1 Cumulative 100% Checkpoint
   > - **Dungeon Chests Opened:** 14 / 14
   > - **Capsule Monsters:** 1 / 7 (Jelze in Fright Cave)
   > - **Dragon Eggs Collected:** 0 / 8
   > - **Sidequests Completed:** 2 / 2
   > - **RetroAchievements Unlocked:** 5 / 60 (25 / 520 points)
   ```

10. **Chapter Checklist:**
    Conclude with a bulleted checklist of items, achievements, and flags to verify before moving to the next chapter.

---

## Game Overview (`00_overview.md`)

When writing `00_overview.md`:
- Focus on game premise, core mechanics, battle system fundamentals, party management, and hardcore rules.
- Do NOT duplicate the tables, Mermaid diagrams, or checklist blocks (the assembler automatically injects those from `07_roadmap.json` and `06_graph.json`).
