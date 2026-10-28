import * as dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function fetchWithBackoff(ai: any, prompt: string, maxRetries = 5) {
    const delays = [30000, 60000, 120000, 240000, 480000]; // 30s, 1m, 2m, 4m, 8m
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
            });
        } catch (error: any) {
            const isRetryable = error?.status === 503 || error?.status === 429 || error?.status === 500;
            if (isRetryable && attempt < maxRetries - 1) {
                console.warn(`[Attempt ${attempt + 1}/${maxRetries}] API Error ${error.status}: ${error.message}`);
                console.log(`Waiting ${delays[attempt] / 1000} seconds before retrying...`);
                await new Promise(r => setTimeout(r, delays[attempt]));
            } else {
                throw error; // Throw on final attempt or non-retryable errors
            }
        }
    }
}

async function main() {
    const gameId = process.argv[2];
    if (!gameId) {
        console.error("Please provide a game ID (e.g. 450)");
        process.exit(1);
    }

    console.log(`Starting automated generic pipeline for Game ${gameId}...`);

    const apiDumpPath = path.join(process.cwd(), 'content', 'api-dumps', `${gameId}.md`);
    if (!fs.existsSync(apiDumpPath)) {
        console.error(`API dump not found at ${apiDumpPath}`);
        process.exit(1);
    }

    const apiDump = fs.readFileSync(apiDumpPath, 'utf8');
    const apiDumpLines = apiDump.split('\n');
    let gameTitle = `Game ${gameId}`;
    if (apiDumpLines.length > 0 && apiDumpLines[0].startsWith('# ')) {
        gameTitle = apiDumpLines[0].replace('# ', '').trim();
    }
    
    // Find guide in scratch/ directory
    const scratchDir = path.join(process.cwd(), 'scratch');
    // In a real scenario, this would be process.cwd()/scratch, but we look here for the prototype since it was downloaded here.
    let guideText = "NO GUIDE FOUND";
    if (fs.existsSync(scratchDir)) {
        const files = fs.readdirSync(scratchDir).filter(f => f.endsWith('.txt'));
        if (files.length > 0) {
            console.log(`Found GameFAQs guide: ${files[0]}`);
            guideText = fs.readFileSync(path.join(scratchDir, files[0]), 'utf8');
        } else {
            console.warn("No .txt guide found in scratch directory.");
        }
    }

    // Load Plugin Skills
    const skillsDir = path.join(process.cwd(), '.agents', 'plugins', 'retro-walkthrough', 'skills');
    const loadSkill = (name: string) => {
        const p = path.join(skillsDir, name, 'SKILL.md');
        return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    };

    const writerSkill = loadSkill('retro-writer');
    const strategistSkill = loadSkill('retro-strategist');
    const weaveSkill = loadSkill('retro-weave');
    const reviewerSkill = loadSkill('retro-reviewer');

    const agentInstructions = `
You are the master Orchestrator executing the following subagent instructions to generate a walkthrough.
Follow these skills strictly:

<WRITER_SKILL>
${writerSkill}
</WRITER_SKILL>

<STRATEGIST_SKILL>
${strategistSkill}
</STRATEGIST_SKILL>

<WEAVE_SKILL>
${weaveSkill}
</WEAVE_SKILL>

<REVIEWER_SKILL>
${reviewerSkill}
</REVIEWER_SKILL>
`;

    // Parse achievements
    const achievements: { title: string, meta: string, desc: string, comms: string }[] = [];
    for (let i = 0; i < apiDumpLines.length; i++) {
        if (apiDumpLines[i].startsWith('### ')) {
            const titleMatch = apiDumpLines[i].match(/### (\[.*?\])?\s*(.*?) \(/);
            if (titleMatch) {
                const title = titleMatch[2].trim();
                let meta = '', desc = '', commStart = -1;
                for (let j = i + 1; j < apiDumpLines.length; j++) {
                    if (apiDumpLines[j].startsWith('### ')) break;
                    if (apiDumpLines[j].startsWith('**Type:**')) meta = apiDumpLines[j].trim();
                    else if (apiDumpLines[j].startsWith('**Description:**')) desc = apiDumpLines[j].replace('**Description:**', '').trim();
                    else if (apiDumpLines[j].startsWith('#### Tricks & Gotchas')) commStart = j;
                }
                let commEnd = apiDumpLines.length;
                if (commStart > -1) {
                    for (let j = commStart + 1; j < apiDumpLines.length; j++) {
                        if (apiDumpLines[j].startsWith('### ')) { commEnd = j; break; }
                    }
                }
                const comms = commStart > -1 ? apiDumpLines.slice(commStart + 1, commEnd).join('\n').trim() : '';
                achievements.push({ title, meta, desc, comms });
            }
        }
    }

    console.log(`Found ${achievements.length} achievements for ${gameTitle}.`);

    const outPath = path.join(process.cwd(), 'content', 'walkthroughs', `${gameId}.md`);
    // (initial header content removed: unused)
    // Resuming from chunk 35, so do not wipe the file
    // fs.writeFileSync(outPath, outContent);

    const chunkSize = 5;

    for (let i = 35; i < achievements.length; i += chunkSize) {
        const chunk = achievements.slice(i, i + chunkSize);
        console.log(`Processing achievements ${i + 1} to ${i + chunk.length}...`);

        const prompt = `
${agentInstructions}

Here is the reference GameFAQs guide you must use for strategies and quotes:
${guideText.substring(0, 500000)}

Your Task:
Process the following ${chunk.length} achievements by synthesizing all 4 skills above into a single, final output. You MUST format your output exactly as follows for EACH achievement, with no exceptions:

### [Achievement Title]
***[Achievement Type]***

**Objective:** [Achievement Description]

[Your incredibly detailed narrative, routing, ASCII maps, and boss strategies based on the GameFAQs guide text]

> **Community Notes:**
> [Paste the community notes provided in the input, prefixed with \`>\` blockquotes]

\`\`\`json
{
  "achievement": "[Achievement Title]"
}
\`\`\`

Here are the achievements to process:
${JSON.stringify(chunk, null, 2)}
`;

        try {
            const response = await fetchWithBackoff(ai, prompt);
            fs.appendFileSync(outPath, response.text + '\n\n');
        } catch (error) {
            console.error(`Error generating content for chunk ${i}:`, error);
            throw error;
        }

        // Rate limiting for Flash: wait 5 seconds between chunks
        await new Promise(r => setTimeout(r, 5000));
    }

    fs.appendFileSync(outPath, '\n## References\n- GameFAQs Guide\n');
    console.log(`Pipeline complete! Output written to ${outPath}`);
}

main().catch(console.error);
