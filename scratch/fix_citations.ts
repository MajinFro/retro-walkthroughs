import fs from "node:fs";
import path from "node:path";
import { EOL } from "../scripts/pipeline/lib.ts";

const dir = "content/research/1005/08_chapters";

// 1. Overview
let ov = fs.readFileSync(path.join(dir, "00_overview.md"), "utf-8");
ov = ov.replace(/To achieve genuine 100% completion beyond base achievements, this walkthrough tracks and guides:/, "To achieve genuine 100% completion beyond base achievements, this walkthrough tracks and guides [[gf3-1-1, gf1-2-2]]:");
fs.writeFileSync(path.join(dir, "00_overview.md"), ov.replace(/\r?\n/g, EOL), "utf-8");

// Citations for chapter checklists
const checklistCites: Record<number, string[]> = {
  1: ["gf3-30-1", "gf3-31-1", "gf3-32-1", "gf3-33-1", "gf3-34-1", "gf3-35-1", "gf3-37-1", "gf3-40-1", "ra-comments-81-1"],
  2: ["gf3-43-1", "gf3-46-1", "gf3-52-1", "ra-comments-57-1", "ra-comments-59-1", "gf3-57-1", "gf3-60-1", "ra-comments-25-1"],
  3: ["ra-comments-61-1", "ra-comments-27-1", "gf3-72-1", "ra-comments-29-1", "ra-comments-31-1", "ra-comments-33-1", "ra-comments-35-1", "ra-comments-37-1", "ra-comments-39-1", "ra-comments-41-1", "gf3-97-1"],
  4: ["ra-comments-43-1", "ra-comments-45-1", "gf3-98-1", "ra-comments-79-1", "ra-comments-47-1", "gf3-101-1", "ra-comments-49-1"],
  5: ["gf3-105-1", "gf3-107-1", "gf3-109-1", "ra-comments-51-1", "ra-comments-53-1", "gf3-117-1"],
  6: ["gf3-124-1", "gf3-138-1", "gf3-139-1", "ra-comments-63-1", "ra-comments-67-1", "ra-comments-71-1", "ra-comments-77-1"],
  7: ["gf2-1-1", "ra-comments-115-1", "ra-comments-119-1", "ra-comments-123-1", "ra-comments-125-1", "gf2-9-1"],
};

for (let ch = 1; ch <= 7; ch++) {
  const file = path.join(dir, `0${ch}.md`);
  if (!fs.existsSync(file)) continue;

  let text = fs.readFileSync(file, "utf-8");
  const lines = text.split(/\r?\n/);
  const outLines: string[] = [];

  let inChecklist = false;
  let citeIdx = 0;
  const cites = checklistCites[ch] || ["gf1-4-1"];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^###\s+Chapter Checklist/i.test(l)) {
      inChecklist = true;
      outLines.push(l);
      continue;
    }

    if (inChecklist && /^\s*-\s*\[\s*\]\s+(.+)$/.test(l)) {
      const match = l.match(/^\s*-\s*\[\s*\]\s+(.+)$/)!;
      let content = match[1].trim();
      if (!/\[\[[^\]]+\]\]/.test(content)) {
        const cite = cites[citeIdx % cites.length];
        citeIdx++;
        content = `${content} [[${cite}]]`;
      }
      outLines.push(`- [ ] ${content}`);
      continue;
    }

    outLines.push(l);
  }

  fs.writeFileSync(file, outLines.join("\n").replace(/\r?\n/g, EOL), "utf-8");
  console.log(`Updated checklists in 0${ch}.md`);
}
