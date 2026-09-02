const fs = require('fs');
const path = require('path');

const gameId = process.argv[2];
if (!gameId) {
    console.error("Usage: node verify-walkthrough.js <GameID>");
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

const md = fs.readFileSync(walkthroughPath, 'utf-8');
const dump = fs.readFileSync(apiDumpPath, 'utf-8');

// 1. Count Achievements in Dump vs Walkthrough
const achievementRegex = /###\s+(.+?)\s+\((.+?)\)\n(?:.*\n)*?.*?Description:\*\*\s+(.+?)\n(?:.*\n)*?.*?Badge\]\((.+?)\)/g;
let totalAchievements = 0;
while (achievementRegex.exec(dump) !== null) {
    totalAchievements++;
}

const wovenMatches = md.match(/> \[\!ACHIEVEMENT\]/g) || [];
const wovenCount = wovenMatches.length;

let passed = true;
console.log(`--- Verification Report for ${gameId}.md ---`);

if (wovenCount < totalAchievements) {
    console.error(`❌ FAILURE: Missing Achievements. Expected ${totalAchievements}, found ${wovenCount} in the walkthrough.`);
    passed = false;
} else if (wovenCount > totalAchievements) {
    console.warn(`⚠️ WARNING: Found more achievements (${wovenCount}) than expected (${totalAchievements}). Duplicate blocks might exist.`);
} else {
    console.log(`✅ SUCCESS: All ${totalAchievements} achievements are present.`);
}

// 2. Check for missing context (bare achievement blocks)
const lines = md.split('\n');
let bareBlocks = 0;
let badPlaceholders = 0;
let shortStrategies = 0;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('> [!ACHIEVEMENT]')) {
        // Look ahead to find the end of the blockquote
        let endIdx = i;
        while (endIdx < lines.length && (lines[endIdx].startsWith('>') || lines[endIdx].trim() === '')) {
            // We skip the blockquote and trailing blank lines
            if (!lines[endIdx].startsWith('>') && lines[endIdx].trim() !== '') {
                break;
            }
            endIdx++;
        }
        
        let hasContext = false;
        let lookAhead = 0;
        while (endIdx + lookAhead < lines.length && lines[endIdx + lookAhead].trim() === '') {
            lookAhead++; // Skip blank lines
        }

        const nextContentLine = lines[endIdx + lookAhead] ? lines[endIdx + lookAhead].trim() : '';
        
        if (nextContentLine && !nextContentLine.startsWith('>') && !nextContentLine.startsWith('#')) {
            hasContext = true;
            
            // Rule 1: Check for Weaver placeholder
            if (nextContentLine.includes('[STRATEGIST_INSERT_HERE]')) {
                console.error(`❌ FAILURE: Unresolved Placeholder at line ${i}. The Strategist failed to replace [STRATEGIST_INSERT_HERE].`);
                badPlaceholders++;
                passed = false;
            }
            
            // Rule 2: Minimum word count check (naive split by space)
            const words = nextContentLine.split(/\s+/).length;
            if (words < 15) {
                console.error(`❌ FAILURE: Strategy too short at line ${i}. Found ${words} words, expected at least 15 words.`);
                shortStrategies++;
                passed = false;
            }
        }

        if (!hasContext) {
            console.error(`❌ FAILURE: Missing Context at line ${i}. Achievement block must be followed by strategy/instructions.`);
            bareBlocks++;
            passed = false;
        }
    }
}

if (bareBlocks === 0 && badPlaceholders === 0 && shortStrategies === 0) {
    console.log(`✅ SUCCESS: All achievement blocks have fully fleshed-out, Strategist-approved context.`);
}

if (!passed) {
    console.error(`\nReview failed. Please have the retro-strategist or retro-reviewer fix the errors above.`);
    process.exit(1);
} else {
    console.log(`\nReview passed. The walkthrough is ready for the user.`);
}
