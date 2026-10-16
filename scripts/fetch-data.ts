import { buildAuthorization, getGameExtended, getComments } from "@retroachievements/api";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import {
  type Achievement,
  type AchievementsFile,
  type SourceEntry,
  ensureDir,
  paths,
  readJsonOr,
  writeJson,
  writeText,
} from "./pipeline/lib.ts";
import { collectRaGuide } from "./pipeline/ra-guide.ts";

dotenv.config();

const username = process.env.RA_USERNAME;
const webApiKey = process.env.RA_API_KEY;

if (!username || !webApiKey) {
  console.error("Missing RA_USERNAME or RA_API_KEY in .env");
  process.exit(1);
}

const auth = buildAuthorization({ username, webApiKey });

async function main() {
  const gameId = process.argv[2] ? parseInt(process.argv[2]) : 1887;
  console.log(`Fetching data for game ID: ${gameId}...`);

  try {
    // 1. Fetch Game Data & Achievements
    console.log("Fetching game details and achievements...");
    const game = await getGameExtended(auth, { gameId });
    
    // 2. Fetch Game Comments
    console.log("Fetching game comments...");
    const gameComments = await getComments(auth, { identifier: gameId, kind: "game" });
    
    // 3. Fetch Achievement Comments
    console.log("Fetching achievement comments...");
    const achievementCommentsData: Record<number, any[]> = {};
    
    // We get the keys of achievements object, it is a map of ID -> Achievement
    const achievementsMap = game.achievements || {};
    const achievementIds = Object.keys(achievementsMap).map(Number);
    
    console.log(`Found ${achievementIds.length} achievements.`);
    
    // Process in smaller batches to not overwhelm the API (if there are many)
    for (const achId of achievementIds) {
      console.log(`Fetching comments for achievement ${achId}...`);
      try {
        const comments = await getComments(auth, { identifier: achId, kind: "achievement" });
        achievementCommentsData[achId] = comments.results || [];
      } catch (err) {
        console.error(`Error fetching comments for achievement ${achId}:`, err);
        achievementCommentsData[achId] = [];
      }
      // Small delay to be nice to the API (1 per second to avoid limits)
      await new Promise(r => setTimeout(r, 1000));
    }

    // 4. Generate Markdown
    console.log("Generating Markdown...");
    let md = `# ${game.title}\n\n`;
    if (game.imageBoxArt) {
      md += `![Box Art](https://retroachievements.org${game.imageBoxArt})\n\n`;
    } else if (game.imageIcon) {
      md += `![Icon](https://retroachievements.org${game.imageIcon})\n\n`;
    }
    
    md += `## Metadata\n\n`;
    md += `- **Platform:** ${game.consoleName || "Unknown"}\n`;
    md += `- **Developer:** ${game.developer || "Unknown"}\n`;
    md += `- **Publisher:** ${game.publisher || "Unknown"}\n`;
    md += `- **Genre:** ${game.genre || "Unknown"}\n`;
    md += `- **Released:** ${game.released || "Unknown"}\n\n`;
    
    md += `## General Game Comments / Tricks\n\n`;
    if (gameComments.results && gameComments.results.length > 0) {
      for (const c of gameComments.results) {
        md += `> **${c.user}**: ${c.commentText.replace(/\n/g, "\n> ")}\n\n`;
      }
    } else {
      md += `*No comments on the game.* \n\n`;
    }

    md += `## Achievements\n\n`;
    
    for (const achId of achievementIds) {
      const ach = achievementsMap[achId];
      md += `### ${ach.title} (${ach.points} Points | ${ach.trueRatio} True Ratio)\n`;
      if (ach.type) {
        md += `**Type:** ${ach.type}\n\n`;
      }
      md += `**Description:** ${ach.description}\n\n`;
      if (ach.badgeName) {
        md += `![Badge](https://retroachievements.org/Badge/${ach.badgeName}.png)\n\n`;
      }
      
      md += `#### Tricks & Gotchas\n`;
      const comments = achievementCommentsData[achId];
      if (comments && comments.length > 0) {
        for (const c of comments) {
          md += `> **${c.user}**: ${c.commentText.replace(/\n/g, "\n> ")}\n\n`;
        }
      } else {
        md += `*No comments.*\n\n`;
      }
      md += `---\n\n`;
    }
    
    const contentDir = path.join(process.cwd(), "content");
    const apiDumpsDir = path.join(contentDir, "api-dumps");
    const walkthroughsDir = path.join(contentDir, "walkthroughs");
    
    if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir);
    if (!fs.existsSync(apiDumpsDir)) fs.mkdirSync(apiDumpsDir);
    if (!fs.existsSync(walkthroughsDir)) fs.mkdirSync(walkthroughsDir);
    
    // 1. Write API Dump
    const apiDumpPath = path.join(apiDumpsDir, `${gameId}.md`);
    writeText(apiDumpPath, md);
    console.log(`Saved API dump to ${apiDumpPath}`);
    
    // 2. Extract Metadata for Master Registry
    const boxArt = game.imageBoxArt ? `https://retroachievements.org${game.imageBoxArt}` : "";
    const metadata = {
      id: gameId,
      title: game.title,
      system: game.consoleName || "Unknown",
      boxArt: boxArt,
      createdAt: new Date().toISOString()
    };
    
    // 3. Update master.json
    const masterJsonPath = path.join(contentDir, "master.json");
    let masterData: Record<string, any> = {};
    if (fs.existsSync(masterJsonPath)) {
      masterData = JSON.parse(fs.readFileSync(masterJsonPath, "utf-8"));
    }
    masterData[gameId.toString()] = {
      title: metadata.title,
      system: metadata.system,
      boxArt: metadata.boxArt,
      createdAt: metadata.createdAt
    };
    writeJson(masterJsonPath, masterData);
    console.log(`Updated master registry at ${masterJsonPath}`);

    // 4. Evidence pipeline — Stage 1 structured output (content/research/<id>/)
    const P = paths(gameId);
    const achievements: Achievement[] = achievementIds.map((achId) => {
      const a: any = achievementsMap[achId];
      return {
        id: Number(achId),
        title: a.title,
        description: a.description,
        points: a.points,
        trueRatio: a.trueRatio,
        badgeName: a.badgeName,
        badgeUrl: a.badgeName ? `https://media.retroachievements.org/Badge/${a.badgeName}.png` : undefined,
        type: a.type ?? null,
        displayOrder: a.displayOrder,
        numAwarded: a.numAwarded,
      };
    }).sort((x, y) => (x.displayOrder ?? 0) - (y.displayOrder ?? 0) || x.id - y.id);

    const achFile: AchievementsFile = {
      gameId,
      title: game.title,
      console: game.consoleName || "Unknown",
      developer: game.developer,
      publisher: game.publisher,
      genre: game.genre,
      released: game.released ? String(game.released) : undefined,
      boxArt,
      achievements,
    };
    writeJson(P.achievements, achFile);
    console.log(`Stage 1: wrote ${achievements.length} achievements to ${P.achievements}`);

    // RA community comments become a citable source, one section per achievement.
    const sep = "=".repeat(60);
    const raLines: string[] = [];
    raLines.push(sep, "GAME COMMENTS", sep);
    for (const c of gameComments.results || []) raLines.push(`[${c.user}] ${c.commentText}`, "");
    for (const a of achievements) {
      raLines.push("", sep, `ACHIEVEMENT ${a.id} - ${a.title}`, sep);
      raLines.push(`Description: ${a.description}`, "");
      for (const c of achievementCommentsData[a.id] || []) raLines.push(`[${c.user}] ${c.commentText}`, "");
    }
    ensureDir(P.sourcesDir);
    writeText(path.join(P.sourcesDir, "ra-comments.txt"), raLines.join("\n"));
    const manifest = readJsonOr<SourceEntry[]>(P.sourcesManifest, []).filter((s) => s.id !== "ra-comments");
    manifest.unshift({
      id: "ra-comments",
      site: "RetroAchievements",
      title: `${game.title} — RetroAchievements community comments`,
      url: `https://retroachievements.org/game/${gameId}`,
      kind: "ra-comments",
      file: "ra-comments.txt",
      chars: raLines.join("\n").length,
      collected_at: new Date().toISOString(),
    });
    writeJson(P.sourcesManifest, manifest);
    console.log(`Stage 1: registered RA comments as source "ra-comments"`);

    // The official RA achievement guide (GitHub wiki), when the game has one
    await collectRaGuide(gameId, (game as { guideUrl?: string | null }).guideUrl, game.title);
    
  } catch (err) {
    console.error("Failed to fetch data:", err);
    process.exit(1);
  }
}

main();
