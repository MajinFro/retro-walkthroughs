/**
 * Normalize text files to CRLF line endings (project rule).
 *
 *   node scripts/to-crlf.mjs <file> [file...]
 *   node scripts/to-crlf.mjs --hook        # Claude Code PostToolUse hook: reads the tool call JSON from stdin
 *
 * Binary and unknown file types are left untouched.
 */
import fs from "node:fs";
import path from "node:path";

const TEXT_EXT = new Set([".md", ".json", ".jsonl", ".jsonc", ".txt", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".css", ".html", ".svg", ".yml", ".yaml"]);

function toCrlf(file) {
  if (!file || !TEXT_EXT.has(path.extname(file).toLowerCase()) || !fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf-8");
  const fixed = text.replace(/\r?\n/g, "\r\n");
  if (fixed !== text) fs.writeFileSync(file, fixed, "utf-8");
}

if (process.argv[2] === "--hook") {
  let input = "";
  process.stdin.on("data", (d) => (input += d));
  process.stdin.on("end", () => {
    try {
      toCrlf(JSON.parse(input)?.tool_input?.file_path);
    } catch {
      // never block the agent on a malformed payload
    }
  });
} else {
  for (const f of process.argv.slice(2)) toCrlf(f);
}
