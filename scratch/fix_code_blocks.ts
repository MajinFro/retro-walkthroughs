import fs from "node:fs";
import path from "node:path";
import { EOL } from "../scripts/pipeline/lib.ts";

const dir = "content/research/1005/08_chapters";

for (let ch = 1; ch <= 7; ch++) {
  const file = path.join(dir, `0${ch}.md`);
  if (!fs.existsSync(file)) continue;

  let text = fs.readFileSync(file, "utf-8");

  // Fix known broken citation IDs
  text = text.replace(/gf3-73-10/g, "gf3-72-10");
  text = text.replace(/gf3-107-10/g, "gf3-108-10");

  // Replace ```text ... ``` with blockquote >
  text = text.replace(/```text\r?\n([\s\S]*?)\r?\n```/g, (match, body) => {
    const lines = body.split(/\r?\n/);
    const bqLines = lines
      .filter((l: string) => !l.startsWith("===") && !l.startsWith("---"))
      .map((l: string) => `> ${l}`);
    return `> [!NOTE]\n${bqLines.join("\n")}`;
  });

  fs.writeFileSync(file, text.replace(/\r?\n/g, EOL), "utf-8");
  console.log(`Updated 0${ch}.md`);
}
