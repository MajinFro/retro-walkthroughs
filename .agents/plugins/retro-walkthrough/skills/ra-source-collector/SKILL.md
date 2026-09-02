---
name: ra-source-collector
description: Stage 2 of the walkthrough pipeline. Finds and downloads 3+ complete, independent guides, visual maps, and True 100% item/sidequest checklists for a game (GameFAQs, Neoseeker, wikis, Steam, RA forum) with attribution. No summarizing.
---

# Stage 2 — Guide & Map Collector

**Output:** full-text sources and map metadata in `content/research/<id>/02_sources/` registered in `sources.json`.

## Steps

1. Read `01_achievements.json` for the exact title, console, and genre.
2. Discover available guides, visual maps, and checklists using the discovery helper:
   ```powershell
   npm run rw:find-guides -- "<game title>"
   # Or directly inspect a GameFAQs /faqs page (lists text guides AND maps):
   npm run rw:find-guides -- --url "https://gamefaqs.gamespot.com/.../faqs"
   ```
   Search (use `search_web` or `rw:find-guides`) for complete walkthroughs. Target **at least 3 independent substantive sources (>=10k chars)** when they exist, in this priority:
   1. GameFAQs full walkthroughs (prefer "Complete"/high-rated, plain-text, 100% / "Walkthrough" in title). Two different GameFAQs authors count as independent.
   2. Neoseeker walkthroughs, StrategyWiki, game-specific Fandom wikis (walkthrough pages, not just item lists).
   3. Steam guides (if the game is on Steam), RetroAchievements forum topics for the set.
   4. **True 100% In-Game Checklists & FAQs:** Collect dedicated item lists, chest checklists, dragon egg/collectible FAQs, and sidequest guides (e.g. `gf-chests`, `gf-items`, `gf-sidequests`). These are critical for 100% game completion beyond just achievements.
   Reject speedrun, glitch, and challenge-run guides unless an achievement requires that technique.
3. **Visual Maps & Overworld/Dungeon Atlases (MANDATORY if available):**
   Execute a multi-tier search for visual maps and floor plans:
   - **Tier 1 (GameFAQs):** Check GameFAQs `/map/` endpoints.
   - **Tier 2 (Dedicated Atlases):** Check curated retro repositories:
     - **VGMaps.com:** The Video Game Atlas (massive archive covering NES, SNES, Genesis, GB, GBA, PS1, etc.).
     - **MarioUniverse.com:** Comprehensive level maps for Mario franchise titles (NES, SNES, N64, GBA).
     - **NESMaps.com / SNESMaps:** Dedicated platform map archives.
   - **Tier 3 (Wikis):** Check StrategyWiki (e.g. `Category:<Game>_maps` or embedded level maps) and franchise Fandom wikis (e.g. Zelda Wiki, Metroid Recon, Caves of Narshe).
   - **Tier 4 (Fallback Search):** If Tiers 1–3 yield no maps, run targeted web queries:
     `"<Game Title>" <platform> ("dungeon map" OR "world map" OR "level map") (png OR jpg OR atlas)`
     or check **The Spriters/Maps Resource** (`vg-resource.com`).
   Register all discovered maps using:
   ```powershell
   npm run rw:collect -- <id> "<map_url_or_page>" --id map-<area> --site "<site_name>" --title "<Area> Map" --author "<author>" --kind map
   ```
4. Download each text guide with:
   ```powershell
   npm run rw:collect -- <id> "<url>" --id gf1 --site GameFAQs --title "<guide title>" --author "<author>"
   ```
   - GameFAQs: pass the guide URL (or the game's `/faqs` page to auto-pick the best text guide).
   - Multi-page guides (Neoseeker, wikis): first page normally, then each additional page with `--id <same> --append`.
   - If a site blocks the script, fetch the page with `read_url_content`, save the **unaltered** text to `scratch/`, then register it with `--file <path>`. Never retype, summarize, or "clean up" source text.
   - Id convention: `gf1, gf2, neo1, sw1, wiki1, steam1, raforum1, map-<area>, checklist-<topic>`.
5. Open the start of each downloaded file to confirm it is the real guide (not a cookie wall, TOC-only, or wrong game). Delete and re-collect if not.
6. Run `npm run rw:chunk -- <id>` and report the source table it prints.

## Rules

- Collect complete guides. No summaries, no partial copy-paste.
- Record the author and URL for every source (needed for attribution in the final guide).
- For games with intricate dungeons/mazes (RPGs, Metroidvanias, Zelda-likes, platformers), visual maps are high-priority assets. Always inspect and record available maps using the 4-tier discovery protocol.
- If fewer than 3 text sources exist, say so explicitly in your report. The pipeline continues; those facts will be marked 🟡 single-source.

