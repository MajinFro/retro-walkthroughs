/**
 * RetroAchievements achievement guide (github.com/RetroAchievements/guides/wiki) as a citable source.
 *
 *   npx tsx scripts/pipeline/ra-guide.ts <gameId> [--url <wiki page url>]   # also runs automatically inside rw:fetch
 *
 * Finds the guide by:
 *   1. the game's guideUrl from the RA API (set by RA for games with an official guide), else
 *   2. a wiki page whose header links retroachievements.org/game/<gameId> (searched in a bare clone of the wiki)
 * Downloads the page's raw markdown, converts it to plain text and registers it in sources.json as
 * id "ra-guide", kind "ra-guide". A guideUrl outside the wiki is reported for the source collector to handle.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { type SourceEntry, ensureDir, keyTerms, paths, readJsonOr, realGameId, writeJson, writeText } from "./lib.ts";

const WIKI = "https://github.com/RetroAchievements/guides/wiki/";
const RAW = "https://raw.githubusercontent.com/wiki/RetroAchievements/guides/";
const WIKI_GIT = "https://github.com/RetroAchievements/guides.wiki.git";

/** Wiki page name from a guide URL, or null when the URL is not on the RA guides wiki. */
export function wikiPage(url: string | null | undefined): string | null {
  if (!url?.startsWith(WIKI)) return null;
  const page = decodeURIComponent(url.slice(WIKI.length).split(/[?#]/)[0]).replace(/\/$/, "");
  return page || null;
}

const dir = path.join(os.tmpdir(), "rw-ra-guides-wiki.git");
const git = (...args: string[]) => spawnSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
let synced = false;
/** A bare clone of the wiki, refreshed once per run (bare: page names contain ':' and other characters Windows cannot check out). */
function syncWiki() {
  if (synced) return;
  if (fs.existsSync(dir)) {
    git("--git-dir", dir, "fetch", "--depth", "1", "-q", "origin", "HEAD");
    git("--git-dir", dir, "update-ref", "HEAD", "FETCH_HEAD"); // HEAD is a symref to the default branch, so this moves the branch
  }
  else git("clone", "--bare", "--depth", "1", "-q", WIKI_GIT, dir);
  synced = true;
}

function wikiPages(): string[] {
  syncWiki();
  return git("--git-dir", dir, "-c", "core.quotePath=false", "ls-tree", "--name-only", "HEAD").stdout.split(/\r?\n/).filter((f) => f.endsWith(".md")).map((f) => f.replace(/^"|"$/g, "").replace(/\.md$/, ""));
}

/** Searches the wiki for a page whose first lines link the game (its badge header). */
export function findPageByGameId(gameId: number): string | null {
  syncWiki();
  const hits = git("--git-dir", dir, "grep", "-l", "-E", `retroachievements\\.org/game/${gameId}([^0-9]|$)`, "HEAD").stdout.split(/\r?\n/).filter(Boolean);
  for (const hit of hits) {
    const file = hit.replace(/^HEAD:/, "");
    const head = git("--git-dir", dir, "show", `HEAD:${file}`).stdout.split(/\r?\n/).slice(0, 8).join("\n");
    if (new RegExp(`retroachievements\\.org/game/${gameId}([^0-9]|$)`).test(head)) return file.replace(/\.md$/, "");
  }
  return null;
}

/** Wiki markdown (with inline HTML badges) -> plain text that keeps every word a fact can quote. */
export function wikiToText(md: string): string {
  return md
    .replace(/\[<img[^>]*>\]\([^)]*\)/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(big|pre|small|sub|sup|b|i|u|center|div|span|p|details|summary|kbd|code)[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[([^\]]+)\]\(https?:\/\/retroachievements\.org\/achievement\/(\d+)\)/g, "$1 [achievement $2]")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 ($2)")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Downloads and registers the RA guide. Returns the manifest entry, or null when the game has none on the wiki. */
export async function collectRaGuide(gameId: number, guideUrl: string | null | undefined, gameTitle: string): Promise<SourceEntry | null> {
  const P = paths(gameId);
  let page = wikiPage(guideUrl);
  if (guideUrl && !page) {
    console.log(`  RA guide: the RA API lists a guide outside the wiki (${guideUrl}) — collect it in Stage 2 with rw:collect`);
    return null;
  }
  if (!page) page = findPageByGameId(realGameId(gameId));
  if (!page) {
    // pages named like the game but not linked to it: report them, the source collector decides
    const terms = keyTerms(gameTitle);
    const similar = wikiPages()
      .map((p) => ({ p, hit: keyTerms(p.replace(/-/g, " ")).filter((w) => terms.includes(w)).length }))
      .filter((x) => terms.length && x.hit / terms.length >= 0.6)
      .sort((a, b) => b.hit - a.hit)
      .slice(0, 5);
    console.log(
      similar.length
        ? `  RA guide: none linked to game ${gameId}; similarly named wiki pages (check, then register the right one with npm run rw:ra-guide -- ${gameId} --url <page url>): ${similar.map((x) => WIKI + encodeURI(x.p)).join(" , ")}`
        : "  RA guide: none on the RetroAchievements guides wiki",
    );
    return null;
  }
  const res = await fetch(RAW + encodeURIComponent(page).replace(/%2F/g, "/") + ".md");
  if (!res.ok) {
    console.log(`  RA guide: ${WIKI}${page} could not be downloaded (HTTP ${res.status})`);
    return null;
  }
  const url = WIKI + encodeURI(page);
  const md = await res.text();
  const text = [`RetroAchievements achievement guide: ${gameTitle}`, `Source: ${url}`, "", wikiToText(md)].join("\n");
  const author = md.match(/(?:guide )?(?:written|made|created) by \[?([A-Za-z0-9_]+)/i)?.[1];
  ensureDir(P.sourcesDir);
  writeText(path.join(P.sourcesDir, "ra-guide.txt"), text);
  const entry: SourceEntry = {
    id: "ra-guide",
    site: "RetroAchievements Guides Wiki",
    title: page.replace(/-/g, " "),
    ...(author ? { author } : {}),
    url,
    kind: "ra-guide",
    file: "ra-guide.txt",
    chars: text.length,
    collected_at: new Date().toISOString(),
  };
  const manifest = readJsonOr<SourceEntry[]>(P.sourcesManifest, []).filter((s) => s.id !== "ra-guide");
  // right after ra-comments, ahead of the walkthroughs
  manifest.splice(manifest[0]?.id === "ra-comments" ? 1 : 0, 0, entry);
  writeJson(P.sourcesManifest, manifest);
  console.log(`  RA guide: registered "${entry.title}" (${text.length.toLocaleString()} chars) as source "ra-guide"`);
  return entry;
}

// CLI
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { config } = await import("dotenv");
  config({ quiet: true });
  const { buildAuthorization, getGameExtended } = await import("@retroachievements/api");
  const gameId = Number(process.argv[2]);
  if (!gameId) {
    console.error("Usage: ra-guide.ts <gameId>");
    process.exit(1);
  }
  const auth = buildAuthorization({ username: process.env.RA_USERNAME!, webApiKey: process.env.RA_API_KEY! });
  const game = await getGameExtended(auth, { gameId });
  // --url <wiki page>: register a page the RA API does not link (e.g. one suggested by a previous run)
  const i = process.argv.indexOf("--url");
  const url = i > -1 ? process.argv[i + 1] : (game as { guideUrl?: string | null }).guideUrl;
  await collectRaGuide(gameId, url, game.title);
}
