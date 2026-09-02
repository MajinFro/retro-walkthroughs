import * as dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function fetchWithBackoff(ai: any, prompt: string, maxRetries = 5, model = 'gemini-3.6-flash', systemInstruction?: string) {
    const delays = [30000, 60000, 120000, 240000, 480000];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const config: any = {};
            if (systemInstruction) config.systemInstruction = systemInstruction;
            
            return await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: config
            });
        } catch (error: any) {
            const isRetryable = error?.status === 503 || error?.status === 429 || error?.status === 500;
            if (isRetryable && attempt < maxRetries - 1) {
                console.warn(`[Attempt ${attempt + 1}/${maxRetries}] API Error ${error.status}: ${error.message}`);
                console.log(`Waiting ${delays[attempt] / 1000} seconds before retrying...`);
                await new Promise(r => setTimeout(r, delays[attempt]));
            } else {
                throw error;
            }
        }
    }
}

function loadSkill(name: string) {
    const p = path.join(process.cwd(), '.agents', 'plugins', 'retro-walkthrough', 'skills', name, 'SKILL.md');
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

async function main() {
    const gameId = process.argv[2];
    if (!gameId) {
        console.error("Please provide a game ID (e.g. 1005)");
        process.exit(1);
    }

    console.log(`Starting Hybrid Weaver Pipeline for Game ${gameId}...`);

    const apiDumpPath = path.join(process.cwd(), 'content', 'api-dumps', `${gameId}.md`);
    if (!fs.existsSync(apiDumpPath)) {
        console.error(`API dump not found at ${apiDumpPath}`);
        process.exit(1);
    }
    const apiDump = fs.readFileSync(apiDumpPath, 'utf8');

    // Find guide in scratch/ directory
    const scratchDir = path.join(process.cwd(), 'scratch');
    let guideText = "NO GUIDE FOUND";
    if (fs.existsSync(scratchDir)) {
        const files = fs.readdirSync(scratchDir).filter(f => f.endsWith('.txt'));
        if (files.length > 0) {
            console.log(`Found GameFAQs guide: ${files[0]}`);
            guideText = fs.readFileSync(path.join(scratchDir, files[0]), 'utf8');
        }
    }

    const researcherSkill = loadSkill('retro-researcher');
    const writerSkill = loadSkill('retro-writer');
    const strategistSkill = loadSkill('retro-strategist');
    const reviewerSkill = loadSkill('retro-reviewer');

    // ==========================================
    // PHASE 2: SKELETON GENERATION
    // ==========================================
    console.log("Phase 2: Generating Chronological Outline (Skeleton)...");
    
    // We only pass the first 50k chars of the guide to help the researcher build the Table of Contents outline to save time/tokens.
    const outlinePrompt = `
You are the Master Outline Planner. 
Read the following RetroAchievements API Dump and the beginning of the GameFAQs guide.
Create a chronological chapter outline for the game. For each chapter, assign the specific achievements from the API dump that would naturally be unlocked during that chapter's story/dungeon events.

Respond ONLY with a valid JSON array of objects, like this:
[
  {
    "chapter_title": "Chapter 1: The Beginning",
    "mapped_achievements": ["Achievement Name 1", "Achievement Name 2"]
  }
]

API DUMP:
${apiDump}

GAMEFAQS GUIDE (First 50,000 chars for context/TOC):
${guideText.substring(0, 50000)}
`;

    let skeleton: any[] = [];
    try {
        const resp = await fetchWithBackoff(ai, outlinePrompt, 5, 'gemini-3.6-flash', researcherSkill);
        let text = resp.text.trim();
        if (text.startsWith('\`\`\`json')) text = text.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        skeleton = JSON.parse(text);
        console.log(`Generated Outline with ${skeleton.length} chapters.`);
    } catch (e) {
        console.error("Failed to generate skeleton:", e);
        process.exit(1);
    }

    const outPath = path.join(process.cwd(), 'content', 'walkthroughs', `${gameId}_hybrid.md`);
    fs.writeFileSync(outPath, `---\ntitle: Game ${gameId}\ngame_id: ${gameId}\nauthor: API-Orchestrator-Hybrid\n---\n\n# Game ${gameId} - Walkthrough\n\n`);

    // ==========================================
    // PHASE 3 & 4: DRAFTING AND REVIEWING LOOP
    // ==========================================
    
    for (let i = 0; i < skeleton.length; i++) {
        const chapter = skeleton[i];
        console.log(`\nProcessing ${chapter.chapter_title} (${chapter.mapped_achievements.length} achievements)...`);

        const draftPrompt = `
You are drafting a chapter for a chronological game walkthrough.
You must write an incredibly detailed narrative, routing, ASCII maps, and boss strategies based on the GameFAQs guide text.
Do not skip the story or dungeon details! Write the full walkthrough for this chapter.
When the time comes to unlock an achievement in your narrative, insert the achievement seamlessly.

CHAPTER TITLE: ${chapter.chapter_title}
MAPPED ACHIEVEMENTS TO INTEGRATE: ${JSON.stringify(chapter.mapped_achievements)}

REFERENCE GAMEFAQS GUIDE:
${guideText.substring(0, 500000)}
`;
        
        let draft = "";
        try {
            console.log("-> Drafting Chapter...");
            const draftResp = await fetchWithBackoff(ai, draftPrompt, 5, 'gemini-3.6-flash', writerSkill + '\n\n' + strategistSkill);
            draft = draftResp.text;
        } catch(e) {
            console.error("Drafting failed", e);
            continue;
        }

        let finalChapter = draft;
        let validationPassed = false;
        
        for (let retry = 1; retry <= 3; retry++) {
            console.log(`-> Reviewing Chapter (Attempt ${retry})...`);
            
            const reviewPrompt = `
You are the QA Reviewer. 
Please review the following drafted walkthrough chapter.
1. Fix any formatting errors.
2. Remove any useless system notes (e.g. "Server: user edited this").
3. Ensure every single mapped achievement is present, and ends with a JSON block like:
\`\`\`json
{
  "achievement": "Achievement Name"
}
\`\`\`
MAPPED ACHIEVEMENTS REQUIRED: ${JSON.stringify(chapter.mapped_achievements)}

DRAFTED CHAPTER:
${finalChapter}
`;
            
            try {
                const reviewResp = await fetchWithBackoff(ai, reviewPrompt, 5, 'gemini-3.6-flash', reviewerSkill);
                finalChapter = reviewResp.text;
                
                // NATIVE JS GATEKEEPER VALIDATION
                let missingCount = 0;
                for (const ach of chapter.mapped_achievements) {
                    if (!finalChapter.includes(`"achievement": "${ach}"`)) {
                        missingCount++;
                        console.error(`Gatekeeper Error: Missing JSON block for achievement "${ach}"`);
                    }
                }
                
                if (missingCount === 0) {
                    validationPassed = true;
                    console.log("-> QA Gatekeeper Passed!");
                    break;
                } else {
                    console.log(`-> QA Gatekeeper Failed. ${missingCount} achievements missing. Retrying...`);
                }
                
            } catch(e) {
                console.error("Review failed", e);
            }
        }
        
        if (!validationPassed) {
            console.warn(`WARNING: Chapter ${chapter.chapter_title} failed strict validation after 3 retries. Proceeding anyway with best draft.`);
        }
        
        fs.appendFileSync(outPath, finalChapter + '\n\n');
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 5000));
    }
    
    console.log(`\nHybrid Pipeline complete! Output written to ${outPath}`);
}

main().catch(console.error);
