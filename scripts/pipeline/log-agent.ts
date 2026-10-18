/**
 * Record one stage agent's run in content/research/<id>/_activity.jsonl, so rw:status can total
 * active time and agent tokens per game. The coordinator runs this after every rw-stage agent,
 * copying the numbers from the agent's completion notice.
 *
 *   npx tsx scripts/pipeline/log-agent.ts <gameId> --stage "6-7 route" --ms 889271 --tokens 224050 [--tools 79] [--model opus]
 *
 * --ms is the agent's own run time (Claude Code: duration_ms in the notice). Never include time spent
 * waiting for the user or a usage-limit reset.
 */
import { flag, fmtDuration, gameIdArg, logActivity } from "./lib.ts";

const id = gameIdArg();
const stage = flag("stage");
const ms = Number(flag("ms"));
const tokens = flag("tokens");
const tools = flag("tools");
const model = flag("model");
if (!stage || stage === "true" || !Number.isFinite(ms) || ms <= 0) {
  console.error('Usage: rw:log-agent -- <gameId> --stage "<stage>" --ms <duration ms> [--tokens N] [--tools N] [--model opus]');
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
console.log(`Logged agent "${stage}": ${fmtDuration(ms)}${tokens ? `, ${(Number(tokens) / 1e3).toFixed(0)}k tokens` : ""}`);
