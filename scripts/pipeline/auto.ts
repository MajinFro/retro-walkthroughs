/**
 * Run every command stage in a row until the pipeline needs judgment or a decision.
 *
 *   npx tsx scripts/pipeline/auto.ts <gameId> [--max-steps 25]
 *
 * Loop: read `rw:status`; if its NEXT is a command stage (WHO: coordinator) whose command is on the
 * list below, run it and repeat. Stops when NEXT is a judgment stage (WHO: rw-stage), the game is done,
 * NEXT is not a runnable command, a step makes no progress, a command repeats too often, or the
 * model usage limit is hit. Never runs rw:clean (the user approves that).
 * Full command output goes to content/research/<id>/_auto.log; only summary lines are printed.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { flag, gameIdArg, logActivity, paths } from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
const maxSteps = Number(flag("max-steps") ?? 25);
const RUNNABLE = /^npm run (rw:(?:fetch|chunk|extract|verify|plan|write|assemble|qa|score))\b/;
const MAX_REPEAT: Record<string, number> = { "rw:extract": 4 }; // extraction may need a few passes; others 2
const SUMMARY = /❌|error|✅|⚠|wrote|facts:|achievements:|usage:|OVERALL|rejection reasons|unsupported|still missing|problem\(s\)/i;
const LIMIT = /hit your (session|usage) limit|usage limit|rate limit/i;
const log = path.join(P.dir, "_auto.log");

function sh(cmd: string) {
  const r = spawnSync(cmd, { shell: true, encoding: "utf8", cwd: P.root, maxBuffer: 256 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: "0" } });
  return { code: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}
function status() {
  const out = sh(`npx tsx scripts/pipeline/status.ts ${id}`).out;
  const next = out.match(/^NEXT: (.*)$/m)?.[1]?.trim() ?? "";
  const who = out.match(/^WHO: (.*)$/m)?.[1]?.trim() ?? "";
  const board = out.split(/\r?\n/).filter((l) => /^\S{1,2}\s+\d+ /.test(l)).join("\n"); // stage rows, for progress checks
  return { out, next, who, board };
}

fs.mkdirSync(P.dir, { recursive: true });
fs.appendFileSync(log, `\n=== rw:auto ${new Date().toISOString()} ===\n`);
const runs = new Map<string, number>();
let stop = "";
let s = status();
for (let step = 1; step <= maxSteps; step++) {
  if (!s.next || /^Done/.test(s.next)) { stop = "done"; break; }
  if (!/^coordinator/.test(s.who)) { stop = "judgment"; break; }
  const m = s.next.match(RUNNABLE);
  if (!m) { stop = "not-a-command"; break; }
  const cmd = s.next.split(/\s{2,}|\s+then\s+|\s+\(/)[0].trim();
  const n = (runs.get(cmd) ?? 0) + 1;
  runs.set(cmd, n);
  if (n > (MAX_REPEAT[m[1]] ?? 2)) { stop = `repeat:${cmd}`; break; }

  console.log(`\n▶ [${step}] ${cmd}`);
  const t0 = Date.now();
  const r = sh(cmd);
  fs.appendFileSync(log, `\n--- ${cmd} (exit ${r.code}) ---\n${r.out}`);
  // per-chapter QA warnings stay in the log; the totals line says how many there are
  const lines = r.out.split(/\r?\n/).filter((l) => SUMMARY.test(l) && !/^\s+at /.test(l) && !/^\s*⚠\s*(overview|ch\d+)\b/.test(l));
  for (const l of lines.slice(-10)) console.log(`  ${l.trim().slice(0, 200)}`);
  console.log(`  (exit ${r.code}, ${Math.round((Date.now() - t0) / 1000)}s)`);
  const hitLimit = LIMIT.test(r.out);
  logActivity(id, { kind: "step", label: cmd, active_ms: Date.now() - t0, exit: r.code, ...(hitLimit ? { limit: true } : {}) });
  if (hitLimit) { stop = "limit"; s = status(); break; }

  const before = s.board + s.next;
  s = status();
  if (s.board + s.next === before && s.next.startsWith(cmd)) { stop = `no-progress:${cmd}`; break; }
}
if (!stop) stop = "max-steps";

const why: Record<string, string> = {
  done: "the walkthrough is accepted — ask the user to review it before rw:clean",
  judgment: "the next stage needs judgment: hand it to a fresh rw-stage agent",
  "not-a-command": "NEXT is not a command this script runs; read it and act",
  limit: "the model usage limit was hit: wait for the reset, then re-run rw:auto",
  "max-steps": "step limit reached; re-run rw:auto to continue",
};
const reason = why[stop] ?? (stop.startsWith("repeat:") ? `${stop.slice(7)} already ran its maximum number of times without clearing the stage — check _auto.log` : `${stop.split(":").slice(1).join(":")} changed nothing — check _auto.log`);
console.log(`\n■ rw:auto stopped: ${reason}`);
console.log(`NEXT: ${s.next}`);
if (s.who) console.log(`WHO: ${s.who}`);
for (const k of ["USAGE", "ACTIVE"]) {
  const line = s.out.match(new RegExp(`^${k}: .*$`, "m"))?.[0];
  if (line) console.log(line);
}
