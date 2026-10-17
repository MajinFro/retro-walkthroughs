/**
 * Pipeline Cleanup Tool.
 * Cleans intermediate drafting packets and purges scratch files.
 *
 * Usage:
 *   npx tsx scripts/pipeline/cleanup.ts <gameId>         # Clean packets and game scratch for an accepted game
 *   npx tsx scripts/pipeline/cleanup.ts --scratch        # Purge all temporary files from scratch/
 *   npx tsx scripts/pipeline/cleanup.ts --all            # Purge scratch/ and packets for all games
 */
import fs from "node:fs";
import path from "node:path";
import { exists, paths, readJson } from "./lib.ts";

const root = process.cwd();
const scratchDir = path.join(root, "scratch");
// Bare words work too. The env check covers PowerShell, where npm.ps1 loses the "--"
// and npm keeps `--all` etc. as its own config (npm_config_all=true).
const has = (name: string) =>
  process.argv.some((a) => new RegExp(`^(${name}|--${name})$`, "i").test(a)) ||
  (Boolean(process.env.npm_lifecycle_event) && process.env[`npm_config_${name}`] === "true");
const isAll = has("all");
const isScratchOnly = has("scratch");
const force = has("force");
const gameId = process.argv.slice(2).find((a) => /^\d+$/.test(a));

function cleanScratch(gameFilter?: string) {
  if (!fs.existsSync(scratchDir)) return;
  const entries = fs.readdirSync(scratchDir);
  let deleted = 0;
  let bytes = 0;

  for (const entry of entries) {
    if (entry === ".gitkeep" || entry === "README.md") continue;
    if (gameFilter && !entry.includes(gameFilter)) continue;

    const fullPath = path.join(scratchDir, entry);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        deleted++;
      } else {
        bytes += stat.size;
        fs.unlinkSync(fullPath);
        deleted++;
      }
    } catch (e) {
      console.warn(`Could not delete ${entry}: ${(e as Error).message}`);
    }
  }

  const kb = Math.round(bytes / 1024);
  console.log(`🧹 Cleaned ${deleted} item(s) from scratch/ (${kb} KB freed).`);
}

function cleanGamePackets(gameId: string) {
  const P = paths(gameId);
  if (!exists(P.dir)) {
    console.error(`Research directory for game ${gameId} does not exist.`);
    return;
  }

  // Check if approved
  if (exists(P.score)) {
    try {
      const score = readJson<{ accepted?: boolean; verdict?: string; overall?: number }>(P.score);
      const isAccepted = score.verdict === "ACCEPTED" || score.accepted === true;
      if (!isAccepted && !force) {
        console.warn(`⚠️ Game ${gameId} score is not marked ACCEPTED. Use --force to clean anyway.`);
        return;
      }
    } catch {
      // ignore
    }
  }

  if (exists(P.packetsDir)) {
    let count = 0;
    const files = fs.readdirSync(P.packetsDir);
    for (const file of files) {
      fs.unlinkSync(path.join(P.packetsDir, file));
      count++;
    }
    console.log(`📦 Removed ${count} temporary packet file(s) from ${path.relative(root, P.packetsDir)}`);
  }

  cleanScratch(gameId);
}

function main() {
  if (isScratchOnly) {
    cleanScratch();
    return;
  }

  if (isAll) {
    cleanScratch();
    const resDir = path.join(root, "content", "research");
    if (fs.existsSync(resDir)) {
      for (const d of fs.readdirSync(resDir)) {
        if (/^\d+$/.test(d)) cleanGamePackets(d);
      }
    }
    return;
  }

  if (gameId) {
    cleanGamePackets(gameId);
    return;
  }

  console.log("Usage:");
  console.log("  npm run rw:clean -- <gameId>    Clean packets & scratch for a finished game");
  console.log("  npm run rw:clean -- --scratch   Purge all scratch files");
  console.log("  npm run rw:clean -- --all       Clean scratch and packets for all games");
}

main();
