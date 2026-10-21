/**
 * Record one stage agent's run in content/research/<id>/_activity.jsonl, so rw:status can total
 * active time and agent tokens per game. The coordinator runs this after every rw-stage agent,
 * copying the numbers from the agent's completion notice.
 *
 *   npx tsx scripts/pipeline/log-agent.ts <gameId> --stage "6-7 route" --ms 889271 --tokens 224050 [--tools 79] [--model opus]
 *   npx tsx scripts/pipeline/log-agent.ts <gameId> --stage "9 review" --session <claude session id>
 *
 * --ms is the agent's own run time (Claude Code: duration_ms in the notice). Never include time spent
 * waiting for the user or a usage-limit reset.
 *
 * --session reads the numbers from a Claude Code session log instead (an agent started in its own
 * terminal, e.g. a Herdr pane, whose run gives no completion notice; Herdr prints the id as
 * agent_session.value). Run time is the sum of the session's turn durations; tokens are the final
 * turn's context (input + cache + output), the same measure as the Agent tool's notice.
 * Flags given explicitly override the values read from the session.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { flag, fmtDuration, gameIdArg, logActivity } from "./lib.ts";

interface SessionStats {
  ms: number;
  tokens: number;
  tools: number;
  model?: string;
}

function findSession(id: string): string | null {
  const root = path.join(process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), ".claude"), "projects");
  if (!fs.existsSync(root)) return null;
  for (const d of fs.readdirSync(root)) {
    const f = path.join(root, d, `${id}.jsonl`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

function sessionStats(file: string): SessionStats {
  let ms = 0;
  let last: any = null;
  let model: string | undefined;
  const toolIds = new Set<string>();
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    let row: any;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row.type === "system" && row.subtype === "turn_duration") ms += Number(row.durationMs) || 0;
    if (row.type === "assistant" && row.message?.usage && !row.isSidechain) {
      last = row.message.usage;
      model = row.message.model ?? model;
      for (const c of row.message.content ?? []) if (c.type === "tool_use") toolIds.add(c.id);
    }
  }
  const tokens = last ? (last.input_tokens ?? 0) + (last.cache_creation_input_tokens ?? 0) + (last.cache_read_input_tokens ?? 0) + (last.output_tokens ?? 0) : 0;
  const tier = model?.match(/opus|sonnet|haiku|fable/)?.[0];
  return { ms, tokens, tools: toolIds.size, model: tier ?? model };
}

const id = gameIdArg();
const stage = flag("stage");
const session = flag("session");
let fromSession: SessionStats | null = null;
if (session && session !== "true") {
  const file = findSession(session);
  if (!file) {
    console.error(`No Claude Code session log found for ${session} under ~/.claude/projects.`);
    process.exit(1);
  }
  fromSession = sessionStats(file);
}
const ms = Number(flag("ms") ?? fromSession?.ms);
const tokens = flag("tokens") ?? (fromSession?.tokens ? String(fromSession.tokens) : undefined);
const tools = flag("tools") ?? (fromSession ? String(fromSession.tools) : undefined);
const model = flag("model") ?? fromSession?.model;
if (!stage || stage === "true" || !Number.isFinite(ms) || ms <= 0) {
  console.error('Usage: rw:log-agent -- <gameId> --stage "<stage>" (--ms <duration ms> [--tokens N] [--tools N] [--model opus] | --session <claude session id>)');
  process.exit(1);
}
logActivity(id, {
  kind: "agent",
  label: stage,
  active_ms: ms,
  ...(tokens ? { tokens: Number(tokens) } : {}),
  ...(tools ? { tool_uses: Number(tools) } : {}),
  ...(model ? { model } : {}),
});
console.log(`Logged agent "${stage}": ${fmtDuration(ms)}${tokens ? `, ${(Number(tokens) / 1e3).toFixed(0)}k tokens` : ""}${tools ? `, ${tools} tool uses` : ""}`);
