import fs from "node:fs";
import { type Chunk, EOL, readJsonl } from "../scripts/pipeline/lib.ts";

const chunks = readJsonl<Chunk>("content/research/1005/03_chunks.jsonl");
const gf3Chunks = chunks.filter((c) => c.source_id === "gf3" && c.n >= 30 && c.n <= 120);

interface RawFact {
  id: string;
  type: string;
  subject: string;
  predicate: string;
  object: string | null;
  location: string | null;
  requires: string[];
  achievement_ids: number[];
  missable: boolean;
  text: string;
  evidence: { source_id: string; chunk_id: string; quote: string }[];
}

const facts: RawFact[] = [];

for (const c of gf3Chunks) {
  const text = c.text;
  let k = 10;

  const paras = text.split(/\r?\n\r?\n/);
  let currentArea = c.section;

  for (const para of paras) {
    const lines = para.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("===") && !l.startsWith("---"));
    if (!lines.length) continue;

    const areaMatch = lines[0].match(/^--([A-Za-z0-9\s\-_']+?)--$/);
    if (areaMatch) {
      currentArea = areaMatch[1].trim();
      continue;
    }

    // Chest list
    if (para.includes("Chests:")) {
      const chestIdx = lines.findIndex((l) => l.startsWith("Chests:"));
      if (chestIdx !== -1) {
        let itemStr = "";
        for (let j = chestIdx + 1; j < lines.length; j++) {
          if (lines[j].startsWith("Monsters:") || lines[j].startsWith("Boss:") || lines[j].startsWith("-")) break;
          itemStr += " " + lines[j];
        }
        const itemLines = itemStr.split(/[,;\n]/).map((s) => s.trim().replace(/\(\d+x?\)/g, "").trim()).filter((s) => s.length > 1 && !/^(Chests|total|amount|found|-)/i.test(s));
        for (const item of itemLines) {
          const matchLine = lines.find((l) => l.includes(item) && l.length >= 15);
          if (matchLine && item) {
            facts.push({
              id: `gf3-${c.n}-${k++}`,
              type: "item",
              subject: item,
              predicate: "contains_item",
              object: currentArea,
              location: currentArea,
              requires: [],
              achievement_ids: [],
              missable: false,
              text: `Chest in ${currentArea} contains ${item}.`,
              evidence: [
                {
                  source_id: "gf3",
                  chunk_id: c.chunk_id,
                  quote: matchLine,
                },
              ],
            });
          }
        }
      }
    }

    // Boss block
    if (para.includes("Boss:")) {
      const bossLine = lines.find((l) => l.startsWith("Boss:"));
      if (bossLine && bossLine.length >= 12) {
        const bossName = bossLine.replace(/^Boss:\s*/, "").split("(")[0].trim();
        if (bossName) {
          facts.push({
            id: `gf3-${c.n}-${k++}`,
            type: "boss",
            subject: bossName,
            predicate: "defeated_by",
            object: currentArea,
            location: currentArea,
            requires: [],
            achievement_ids: [],
            missable: false,
            text: `Boss ${bossName} in ${currentArea}.`,
            evidence: [
              {
                source_id: "gf3",
                chunk_id: c.chunk_id,
                quote: bossLine.trim(),
              },
            ],
          });
        }
      }
    }

    // Bullet instructions
    if (lines[0].startsWith("-") && para.length >= 40) {
      const cleanPara = para.replace(/^-+\s*/, "");
      const paraLines = cleanPara.split("\n").map((l) => l.trim()).filter((l) => l.length >= 15 && !l.startsWith("===") && !l.startsWith("---"));
      if (paraLines.length > 0 && currentArea) {
        const quote = paraLines.slice(0, 2).join("... ");
        facts.push({
          id: `gf3-${c.n}-${k++}`,
          type: "mechanic",
          subject: currentArea,
          predicate: "requires",
          object: null,
          location: currentArea,
          requires: [],
          achievement_ids: [],
          missable: false,
          text: `In ${currentArea}: ${paraLines[0].slice(0, 80)}.`,
          evidence: [
            {
              source_id: "gf3",
              chunk_id: c.chunk_id,
              quote: quote,
            },
          ],
        });
      }
    }
  }
}

console.log(`Generated ${facts.length} rich facts from gf3 walkthrough`);
const outPath = "content/research/1005/04_facts/dungeons.jsonl";
const content = facts.map((f) => JSON.stringify(f)).join(EOL) + EOL;
fs.writeFileSync(outPath, content, "utf-8");
console.log(`Wrote to ${outPath}`);
