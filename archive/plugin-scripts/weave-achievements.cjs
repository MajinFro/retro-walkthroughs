const fs = require('fs');
const path = require('path');

const gameId = process.argv[2];
if (!gameId) {
    console.error("Usage: node weave-achievements.cjs <GameID>");
    process.exit(1);
}

const walkthroughPath = path.join(__dirname, '..', '..', '..', '..', 'content', 'walkthroughs', `${gameId}.md`);
const apiDumpPath = path.join(__dirname, '..', '..', '..', '..', 'content', 'api-dumps', `${gameId}.md`);

if (!fs.existsSync(walkthroughPath)) {
    console.error(`Error: Walkthrough file not found at ${walkthroughPath}`);
    process.exit(1);
}

if (!fs.existsSync(apiDumpPath)) {
    console.error(`Error: API Dump file not found at ${apiDumpPath}`);
    process.exit(1);
}

let md = fs.readFileSync(walkthroughPath, 'utf-8');
const dump = fs.readFileSync(apiDumpPath, 'utf-8');

// Parse the API Dump for Achievements
const achievementRegex = /###\s+(.+?)\s+\((.+?)\)\n(?:.*\n)*?.*?Description:\*\*\s+(.+?)\n(?:.*\n)*?.*?Badge\]\((.+?)\)/g;
const achievements = {};

let match;
while ((match = achievementRegex.exec(dump)) !== null) {
    const title = match[1].trim();
    achievements[title] = {
        points: match[2].trim(),
        desc: match[3].trim(),
        badge: match[4].trim()
    };
}

// Inject Achievements into the Walkthrough
for (const [title, details] of Object.entries(achievements)) {
    // Look for exact matches of [ACHIEVEMENT: Title]
    const placeholderRegex = new RegExp(`\\[ACHIEVEMENT:\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'gi');
    
    if (md.match(placeholderRegex)) {
        const replacement = `> [!ACHIEVEMENT]\n> **${title} (${details.points} Points)**\n> ![Badge](${details.badge})\n> *${details.desc}*\n\n**Strategy:** [STRATEGIST_INSERT_HERE]\n`;
        md = md.replace(placeholderRegex, replacement);
    }
}

// Extract URLs from comments
const urlRegex = /(https?:\/\/[^\s)\]]+)/g;
const urls = new Set();
let urlMatch;
while ((urlMatch = urlRegex.exec(dump)) !== null) {
    // Ignore badge image URLs
    if (!urlMatch[1].includes('Badge')) {
        urls.add(urlMatch[1]);
    }
}

// Append community URLs to References section
if (urls.size > 0) {
    let referencesBlock = ``;
    if (!md.includes('## References')) {
        referencesBlock += `\n## References\n\nThe following resources and community links were referenced to build this walkthrough:\n\n`;
    } else {
        referencesBlock += `\n**Community Links:**\n\n`;
    }

    for (const url of urls) {
        referencesBlock += `- [${url}](${url})\n`;
    }
    md += referencesBlock;
}

fs.writeFileSync(walkthroughPath, md);
console.log(`✅ SUCCESS: weave-achievements.cjs completed. Wove ${Object.keys(achievements).length} achievements and extracted ${urls.size} references.`);
