---
name: ra-source-collector
description: Stage 2 of the walkthrough pipeline. Finds and downloads 3+ complete, independent guides, visual maps, and True 100% item/sidequest checklists for a game (GameFAQs, Neoseeker, wikis, Steam, RA forum) with attribution. No summarizing.
---

# Stage 2 — Guide & Map Collector

**Output:** full-text sources and map metadata in `content/research/<id>/02_sources/` registered in `sources.json`.

## Steps

0. **RetroAchievements guide:** `rw:fetch` (Stage 1) already registers the official RA achievement guide as source `ra-guide` when the game has one on the [RA guides wiki](https://github.com/RetroAchievements/guides/wiki) (from the RA API's `guideUrl`, else a wiki page that links the game). Check its output line: if it lists *similarly named wiki pages* instead, open them and, if one is this game's guide, register it with `npm run rw:ra-guide -- <id> --url <page url>`; if it reports a guide outside the wiki, collect that URL with `rw:collect`. The RA guide is short and achievement-focused, so it does not replace the full walkthroughs below: it never counts toward the 3 guides (nor do `ra-comments`, maps or pages under 10k chars), and `rw:status` blocks every later stage until 3 substantive guides are registered.
1. Read `01_achievements.json` for the exact title, console, and genre. **Collect guides for that console only.** Rosters, codes, items, maps and level layouts differ between versions, and GameFAQs lists other versions' guides on a console's page (593 NBA Jam's SNES page held Genesis, Master System and Game Gear guides). `rw:collect` counts the console names in each guide it saves and prints `Console check: same|unknown` or `HELD: …`:
   - **same** (names this console only) and **unknown** (names none): used. For unknown, read the introduction: if it says it is for another version, or for several, hold it with `npm run rw:collect -- <id> --id <sourceId> --hold other` (or `--hold multi`) and say so in your report.
   - **multi** (covers this console and other versions) and **other** (another console): saved but **not used** (`"use": false` in `sources.json`). Do not delete them, and do not look for a way around the hold. Keep searching for same-console guides; `rw:status` then asks the user about every multi-version guide, and about other-console guides only when fewer than 3 same-console guides exist. Never edit `use` or `decision` yourself; the coordinator runs `rw:collect -- <id> --id <sourceId> --approve` or `--decline` after the user answers.
   - If a HELD guide's introduction clearly says it is for this console only (the count was thrown off by a comparison or a port list), say so in your report so the user can approve it. If `rw:status` prints a `NOTE:` about achievements added in a later set revision, guides written for the original set will not cover them: search for each by title and description (RA forum topic for the game, RA guides wiki, wikis, achievement-guide sites, video descriptions that state locations) and collect any written source now. Record in your report which of them still have no source, so the user is asked about them once, early.
2. Discover available guides, visual maps, and checklists. First find the game's GameFAQs page (`https://gamefaqs.gamespot.com/<platform>/<id>-<slug>`) with your web search tool (`site:gamefaqs.gamespot.com <title> <console>`), then list its guides and maps:
   ```powershell
   npm.cmd run rw:find-guides -- --url "https://gamefaqs.gamespot.com/<platform>/<id>-<slug>/faqs"
   # Title search also exists, but GameFAQs search usually returns nothing to the headless browser (exit code 2):
   npm run rw:find-guides -- "<game title>"
   ```
   Search (use your web search tool or `rw:find-guides`) for complete walkthroughs. Target **at least 3 independent substantive sources (>=10k chars)** when they exist, in this priority:
   1. GameFAQs full walkthroughs (prefer "Complete"/high-rated, plain-text, 100% / "Walkthrough" in title). Two different GameFAQs authors count as independent.
   2. Neoseeker walkthroughs, StrategyWiki, game-specific Fandom wikis (walkthrough pages, not just item lists).
   3. Steam guides (if the game is on Steam), RetroAchievements forum topics for the set.
   4. **True 100% In-Game Checklists & FAQs:** Collect dedicated item lists, chest checklists, dragon egg/collectible FAQs, and sidequest guides (e.g. `gf-chests`, `gf-items`, `gf-sidequests`). These are critical for 100% game completion beyond just achievements.
   Reject speedrun, glitch, and challenge-run guides unless an achievement requires that technique.
   **Fewer than 3 exist:** only after searching every tier above, write `02_sources/_fewer_guides.txt` listing each site and search you tried and what you found. `rw:status` then lets the game continue with at least 1 substantive guide, and you must say so in your report so the user hears about it.
3. **Visual Maps & Overworld/Dungeon Atlases (MANDATORY if available):**
   Execute a multi-tier search for visual maps and floor plans:
   - **Tier 1 (GameFAQs):** Check GameFAQs `/map/` endpoints.
     - Tier 1 is not optional when GameFAQs lists `/map/` pages: register them even when VGMaps already supplied maps, and when a map page carries text (room lists, chest locations) collect it too. In 909 the 24 GameFAQs map pages were skipped, and no source listed the Doom Castle wind-floor chests the Black Hand achievement needs.
   - **Tier 2 (Dedicated Atlases):** Check curated retro repositories:
     - **VGMaps.com:** The Video Game Atlas (massive archive covering NES, SNES, Genesis, GB, GBA, PS1, etc.). **Run `npm run rw:maps -- <gameId> --dry-run` first**: it finds the game's maps on its console's atlas page and lists them; run it again without `--dry-run` to register them all (no hand registration). It skips "(Unmarked)" duplicates and maps already registered. If it finds none, it prints similar file-name prefixes; re-run with `--prefix <Prefix>` when one is this game. Drop cutscene stills (opening, ending) only if they show nothing playable.
     - **MarioUniverse.com:** Comprehensive level maps for Mario franchise titles (NES, SNES, N64, GBA).
     - **NESMaps.com / SNESMaps:** Dedicated platform map archives.
   - **Tier 3 (Wikis):** Check StrategyWiki (e.g. `Category:<Game>_maps` or embedded level maps) and franchise Fandom wikis (e.g. Zelda Wiki, Metroid Recon, Caves of Narshe).
   - **Tier 4 (Fallback Search):** If Tiers 1–3 yield no maps, run targeted web queries:
     `"<Game Title>" <platform> ("dungeon map" OR "world map" OR "level map") (png OR jpg OR atlas)`
     or check **The Spriters/Maps Resource** (`vg-resource.com`).
   Browse these atlases and wikis with `npm run rw:browse -- "<url>" --links --grep "<game>"` (headless browser, works where fetch tools are blocked). Register all discovered maps using:
   ```powershell
   npm run rw:collect -- <id> "<map_url_or_page>" --id map-<area> --site "<site_name>" --title "<Area> Map" --author "<author>" --kind map
   ```
4. Download each text guide with:
   ```powershell
   npm run rw:collect -- <id> "<url>" --id gf1 --site GameFAQs --title "<guide title>" --author "<author>"
   ```
   - GameFAQs: pass the guide URL (or the game's `/faqs` page to auto-pick the best text guide).
   - Multi-page guides (Neoseeker, wikis): first page normally, then each additional page with `--id <same> --append`.
   - `rw:collect` always downloads through a real headless Chrome browser (Playwright), never through the agent's own fetch tool. See **Blocked Sites** below.
   - Never retype, summarize, or "clean up" source text.
   - Id convention: `gf1, gf2, neo1, sw1, wiki1, steam1, raforum1, map-<area>, checklist-<topic>`.
5. Open the start of each downloaded file to confirm it is the real guide (not a cookie wall, TOC-only, wrong game, or wrong console). Delete and re-collect if not. This step is required; list in your report which console each kept guide says it covers.
6. Run `npm run rw:chunk -- <id>` and report the source table it prints.

## Blocked Sites (Headless Browser Required)

Many guide and map sites (GameFAQs above all, but also wikis, map atlases, and fan sites) block AI agents and their fetch tools (`read_url_content` in Antigravity, `WebFetch` in Claude Code). They do not block a real browser. The pipeline scripts drive a headless Chrome browser for exactly this reason, on **any** site:

| Need | Use (headless browser) |
|---|---|
| Download a guide, wiki page, or checklist (any site) | `npm run rw:collect -- <id> "<url>" --id … --site … --title …` (GameFAQs URLs use the GameFAQs downloader; all other sites use the generic browser extractor) |
| Read any page to find guides, map pages, or checklists (non-GameFAQs sites: VGMaps, StrategyWiki, Mario Universe, Fandom, Neoseeker, franchise archives …) | `npm run rw:browse -- "<url>"` (page text) |
| List a page's links, e.g. a VGMaps atlas or a wiki map category | `npm run rw:browse -- "<url>" --links --grep "<game or area>"` |
| Find and register all of a game's VGMaps maps | `npm run rw:maps -- <id> --dry-run`, then without `--dry-run` |
| List a game's GameFAQs guides and maps | `npm run rw:find-guides -- --url "https://gamefaqs.gamespot.com/<platform>/<game>/faqs"` |
| Find a game's GameFAQs page | Web search `site:gamefaqs.gamespot.com <title> <console>` (`rw:find-guides -- "<game title>"` usually finds nothing: GameFAQs search is blank to headless browsers) |

`rw:browse` prints only; it never saves. Download the pages you choose with `rw:collect`, and register map image URLs it lists with `rw:collect … --kind map`.

Rules:
1. **Always download source text with `rw:collect`.** Never use an agent fetch tool to obtain the text of a guide, even when it appears to work: fetch tools may summarize or reformat pages, which breaks verbatim quote verification in Stage 5.
2. **If a fetch tool is blocked or returns an error, captcha, "access denied", or a summary on any site,** switch to the headless-browser commands above (`rw:browse` for reading/discovery, `rw:collect` for downloading). Do not treat the site as unavailable until the headless-browser command has also failed.
3. **If `rw:collect` itself fails** (timeout, Cloudflare challenge, "suspiciously short" error), retry it once. If it still fails, open the start of any saved output to see what came back, report the site and the error to the user, and move on to another source. Do not substitute fetch-tool output.
4. Agent web search and fetch tools remain fine for **discovery only** (finding candidate URLs, authors, and titles on sites that allow them); the content itself still comes through `rw:collect`. Web search itself is not site-blocked; if a result page is blocked, open it with `rw:browse`.
5. Map sources (`--kind map`) are registered by URL without downloading text, so they work on any site.

## Rules

- Collect complete guides. No summaries, no partial copy-paste.
- Record the author and URL for every source (needed for attribution in the final guide).
- For games with intricate dungeons/mazes (RPGs, Metroidvanias, Zelda-likes, platformers), visual maps are high-priority assets. Always inspect and record available maps using the 4-tier discovery protocol.
- If fewer than 3 text sources exist, say so explicitly in your report. The pipeline continues; those facts will be marked 🟡 single-source.

