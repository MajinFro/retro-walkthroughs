/**
 * Direct model calls for the bulk pipeline steps (rw:extract, rw:write).
 *
 * One request = one model call with a fixed system prompt and one user message. No agent loop,
 * no tools, no conversation history, so a call costs roughly its input + output and nothing more.
 *
 * Backends (env RW_LLM, auto-detected when unset in this order):
 *   claude-cli  `claude -p` with tools disabled and the system prompt replaced (uses the Claude Code login)
 *   anthropic   Messages API with ANTHROPIC_API_KEY (prompt caching; --batch uses the Message Batches API, half price)
 *   gemini      Gemini API with GEMINI_API_KEY
 *   agy         Antigravity CLI (`agy`, stream-json on stdin) on its own login and quota, not Claude's;
 *               defaults to Gemini Flash. The agent has tools, so the prompt tells it to use none, and it
 *               runs from an empty temp folder.
 *
 * Backend per tier: RW_LLM_EXTRACT / RW_LLM_WRITE override RW_LLM. Guide extraction defaults to agy when
 * it is installed and RW_LLM is unset (RA comments stay on Claude: RW_LLM_RA_COMMENTS); writing stays on
 * Claude. RW_LLM_EXTRACT=claude-cli puts extraction back on Haiku. Models per tier: RW_MODEL_EXTRACT / RW_MODEL_WRITE, or --model on the calling script.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { config } from "dotenv";
import { fingerprint } from "./lib.ts";

config({ quiet: true });

export type Backend = "claude-cli" | "anthropic" | "gemini" | "agy";
export type Tier = "extract" | "write";

export interface LlmRequest {
  key: string; // caller's id for this request (batch name, chapter file)
  system: string;
  user: string;
  tier: Tier;
  maxTokens?: number;
  effort?: "low" | "medium" | "high"; // reasoning effort (claude-cli; anthropic/gemini run without extended thinking)
  backend?: Backend; // overrides the tier's backend for this request (rw:extract: RA comments stay on Claude)
}

export interface Usage {
  input: number;
  output: number;
  cache_read: number;
  cache_write: number;
}

export interface LlmResult {
  key: string;
  text: string;
  usage: Usage;
  error?: string;
}

const DEFAULT_MODELS: Record<Backend, Record<Tier, string>> = {
  "claude-cli": { extract: "haiku", write: "sonnet" },
  anthropic: { extract: "claude-haiku-5-5", write: "claude-sonnet-5-5" },
  gemini: { extract: "gemini-flash-latest", write: "gemini-pro-latest" },
  agy: { extract: "gemini-3.8-flash-medium", write: "gemini-3.8-flash-medium" },
};

let cliAvailable: boolean | undefined;
function hasClaudeCli(): boolean {
  if (cliAvailable === undefined) cliAvailable = spawnSync("claude", ["--version"], { encoding: "utf8" }).status === 0;
  return cliAvailable;
}

/**
 * The backend for one tier: RW_LLM_EXTRACT / RW_LLM_WRITE, else RW_LLM, else auto-detected. Guide
 * extraction defaults to agy (Gemini Flash, no Claude tokens) when the Antigravity CLI is installed:
 * a StarTropics A/B (2026-10-19) scored 94 vs 97 but read as well or better in a blind chapter
 * comparison, and saved ~2.4M Claude tokens. Writing stays on Claude.
 */
export function backendFor(tier?: Tier): Backend {
  const t = tier && process.env[`RW_LLM_${tier.toUpperCase()}`];
  if (t) {
    if (!(t in DEFAULT_MODELS)) throw new Error(`RW_LLM_${tier!.toUpperCase()} must be one of ${Object.keys(DEFAULT_MODELS).join(", ")} (got "${t}")`);
    return t as Backend;
  }
  if (tier === "extract" && !process.env.RW_LLM && hasAgy()) return "agy";
  return backend();
}

/** RA comment batches stay on Claude (RW_LLM_RA_COMMENTS overrides): Flash missed the key warnings there. */
export function raCommentsBackend(): Backend {
  const b = process.env.RW_LLM_RA_COMMENTS as Backend | undefined;
  if (b && !(b in DEFAULT_MODELS)) throw new Error(`RW_LLM_RA_COMMENTS must be one of ${Object.keys(DEFAULT_MODELS).join(", ")} (got "${b}")`);
  return b ?? backend();
}

/** The backend one request runs on: its own override, else its tier's. */
export const backendOf = (req: Pick<LlmRequest, "tier" | "backend">): Backend => req.backend ?? backendFor(req.tier);

export function backend(): Backend {
  const b = process.env.RW_LLM as Backend | undefined;
  if (b) {
    if (!(b in DEFAULT_MODELS)) throw new Error(`RW_LLM must be one of ${Object.keys(DEFAULT_MODELS).join(", ")} (got "${b}")`);
    return b;
  }
  if (hasClaudeCli()) return "claude-cli";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new Error("No model backend: install the claude CLI, or set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env");
}

/** --model and RW_MODEL_<TIER> apply to the tier's backend; a request on another backend gets that backend's default. */
export function modelFor(tier: Tier, override?: string, on?: Backend): string {
  const b = on ?? backendFor(tier);
  if (b !== backendFor(tier)) return DEFAULT_MODELS[b][tier];
  return override ?? process.env[`RW_MODEL_${tier.toUpperCase()}`] ?? DEFAULT_MODELS[b][tier];
}

const zero = (): Usage => ({ input: 0, output: 0, cache_read: 0, cache_write: 0 });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// claude-cli
// ---------------------------------------------------------------------------
const CLI_DIR = path.join(os.tmpdir(), "rw-llm"); // outside the repo, so no CLAUDE.md or project settings load

function callClaudeCli(req: LlmRequest, model: string): Promise<LlmResult> {
  fs.mkdirSync(CLI_DIR, { recursive: true });
  const sysFile = path.join(CLI_DIR, `system-${fingerprint(req.system)}.md`);
  if (!fs.existsSync(sysFile)) fs.writeFileSync(sysFile, req.system, "utf8");
  const args = [
    "-p", "--model", model, "--tools", "", "--system-prompt-file", sysFile, "--output-format", "json",
    ...(req.effort ? ["--effort", req.effort] : []),
    "--no-session-persistence", "--strict-mcp-config", "--disable-slash-commands", "--setting-sources", "",
  ];
  return new Promise((resolve) => {
    const child = spawn("claude", args, { cwd: CLI_DIR, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill(), 15 * 60_000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        const j = JSON.parse(out);
        const u = j.usage ?? {};
        const usage = { input: u.input_tokens ?? 0, output: u.output_tokens ?? 0, cache_read: u.cache_read_input_tokens ?? 0, cache_write: u.cache_creation_input_tokens ?? 0 };
        if (j.is_error) resolve({ key: req.key, text: "", usage, error: String(j.result ?? j.subtype ?? "error") });
        else resolve({ key: req.key, text: String(j.result ?? ""), usage });
      } catch {
        resolve({ key: req.key, text: "", usage: zero(), error: `claude exited ${code}: ${(err || out).slice(0, 400)}` });
      }
    });
    child.stdin.end(req.user);
  });
}

// ---------------------------------------------------------------------------
// anthropic (Messages API + Message Batches API)
// ---------------------------------------------------------------------------
const API = "https://api.anthropic.com/v1";
const apiHeaders = () => ({
  "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
  "anthropic-version": "2023-06-01",
  "content-type": "application/json",
});

function anthropicParams(req: LlmRequest, model: string) {
  return {
    model,
    max_tokens: req.maxTokens ?? 16000,
    system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: req.user }],
  };
}

function anthropicResult(key: string, msg: any): LlmResult {
  const u = msg?.usage ?? {};
  const usage = { input: u.input_tokens ?? 0, output: u.output_tokens ?? 0, cache_read: u.cache_read_input_tokens ?? 0, cache_write: u.cache_creation_input_tokens ?? 0 };
  const text = (msg?.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
  if (msg?.stop_reason === "max_tokens") return { key, text, usage, error: "output hit max_tokens (truncated)" };
  return { key, text, usage };
}

async function callAnthropic(req: LlmRequest, model: string): Promise<LlmResult> {
  const res = await fetch(`${API}/messages`, { method: "POST", headers: apiHeaders(), body: JSON.stringify(anthropicParams(req, model)) });
  const j: any = await res.json();
  if (!res.ok) return { key: req.key, text: "", usage: zero(), error: `HTTP ${res.status}: ${j?.error?.message ?? JSON.stringify(j).slice(0, 300)}` };
  return anthropicResult(req.key, j);
}

async function runAnthropicBatch(reqs: LlmRequest[], modelOverride?: string): Promise<LlmResult[]> {
  const ids = reqs.map((_, i) => `r${i}`); // custom_id must match ^[a-zA-Z0-9_-]{1,64}$
  const body = { requests: reqs.map((r, i) => ({ custom_id: ids[i], params: anthropicParams(r, modelFor(r.tier, modelOverride)) })) };
  const created: any = await (await fetch(`${API}/messages/batches`, { method: "POST", headers: apiHeaders(), body: JSON.stringify(body) })).json();
  if (!created.id) throw new Error(`batch create failed: ${JSON.stringify(created).slice(0, 400)}`);
  console.log(`  batch ${created.id} submitted (${reqs.length} requests); polling every 30s…`);
  let b = created;
  while (b.processing_status !== "ended") {
    await sleep(30_000);
    b = await (await fetch(`${API}/messages/batches/${created.id}`, { headers: apiHeaders() })).json();
    const c = b.request_counts ?? {};
    console.log(`  batch ${created.id}: ${b.processing_status} — ${c.succeeded ?? 0} done, ${c.processing ?? 0} processing, ${c.errored ?? 0} errored`);
  }
  const lines = (await (await fetch(b.results_url, { headers: apiHeaders() })).text()).split(/\r?\n/).filter(Boolean);
  const byId = new Map<string, any>(lines.map((l) => JSON.parse(l)).map((r: any) => [r.custom_id, r.result]));
  return reqs.map((r, i) => {
    const res = byId.get(ids[i]);
    if (res?.type === "succeeded") return anthropicResult(r.key, res.message);
    return { key: r.key, text: "", usage: zero(), error: `batch ${res?.type ?? "missing"}: ${JSON.stringify(res?.error ?? "").slice(0, 300)}` };
  });
}

// ---------------------------------------------------------------------------
// gemini
// ---------------------------------------------------------------------------
async function callGemini(req: LlmRequest, model: string): Promise<LlmResult> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const r = await ai.models.generateContent({
      model,
      contents: req.user,
      config: { systemInstruction: req.system, maxOutputTokens: req.maxTokens ?? 16000 },
    });
    const u = r.usageMetadata ?? {};
    const cached = u.cachedContentTokenCount ?? 0;
    const usage = { input: (u.promptTokenCount ?? 0) - cached, output: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0), cache_read: cached, cache_write: 0 };
    const finish = r.candidates?.[0]?.finishReason;
    if (finish === "MAX_TOKENS") return { key: req.key, text: r.text ?? "", usage, error: "output hit max_tokens (truncated)" };
    return { key: req.key, text: r.text ?? "", usage };
  } catch (e) {
    return { key: req.key, text: "", usage: zero(), error: (e as Error).message.slice(0, 400) };
  }
}

// ---------------------------------------------------------------------------
// agy (Antigravity CLI)
// ---------------------------------------------------------------------------
// agy has no system-prompt option and -p takes the prompt on the command line (too short for a
// batch), so the request goes in as one stream-json user message on stdin.
const AGY_DIR = path.join(os.tmpdir(), "rw-agy"); // empty folder: nothing for the agent to read
const AGY_PREAMBLE =
  "You are being used as a plain text model inside a script. Do not use any tools: do not read, search, " +
  "write or run anything. Everything you need is in this message. Reply with only the output the " +
  "instructions below ask for.\n\n=== INSTRUCTIONS ===\n\n";

const AGY_IDLE_MS = (Number(process.env.RW_AGY_IDLE_SEC) || 180) * 1000;

let agyAvailable: boolean | undefined;
function hasAgy(): boolean {
  if (agyAvailable === undefined) agyAvailable = spawnSync(agyBin(), ["--help"], { encoding: "utf8" }).error === undefined;
  return agyAvailable;
}

function agyBin(): string {
  if (process.env.AGY_BIN) return process.env.AGY_BIN;
  const local = path.join(process.env.LOCALAPPDATA ?? "", "agy", "bin", "agy.exe");
  return fs.existsSync(local) ? local : "agy";
}

function callAgy(req: LlmRequest, model: string): Promise<LlmResult> {
  fs.mkdirSync(AGY_DIR, { recursive: true });
  const prompt = `${AGY_PREAMBLE}${req.system}\n\n=== INPUT ===\n\n${req.user}`;
  const args = ["--input-format", "stream-json", "--output-format", "stream-json", "--model", model, "--mode", "plan", "--disable-slash-commands", "--print-timeout", "900s"];
  return new Promise((resolve) => {
    const child = spawn(agyBin(), args, { cwd: AGY_DIR, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let stalled = false;
    const timer = setTimeout(() => child.kill(), 16 * 60_000);
    // A working agy call streams events every second or so. Some calls hang with no output until the
    // 15-minute print timeout (game 1471: 8 of 66 calls, ~30 of 34 extraction minutes), so kill a call
    // that has been silent for AGY_IDLE_MS; runAll retries it ("stall timeout" is retryable).
    let idle: NodeJS.Timeout;
    const armIdle = () => {
      clearTimeout(idle);
      idle = setTimeout(() => { stalled = true; child.kill(); }, AGY_IDLE_MS);
    };
    armIdle();
    child.stdout.on("data", (d) => { out += d; armIdle(); });
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      clearTimeout(timer);
      clearTimeout(idle);
      if (stalled) return resolve({ key: req.key, text: "", usage: zero(), error: `agy stall timeout: no output for ${AGY_IDLE_MS / 1000}s` });
      const events = out.split(/\r?\n/).filter((l) => l.startsWith("{")).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      const result = events.find((e: any) => e.event === "result")?.result;
      // any tool call means the agent ignored the preamble; the reply cannot be trusted as plain output
      const tools = events.filter((e: any) => e.event === "step_update" && e.step_update?.step_type && !/^(user_input|agent_response|planner_response)$/.test(e.step_update.step_type)).map((e: any) => e.step_update.step_type);
      if (!result) return resolve({ key: req.key, text: "", usage: zero(), error: `agy exited ${code}: ${(err || out).slice(-400)}` });
      const u = result.usage ?? {};
      const usage = { input: u.input_tokens ?? 0, output: (u.output_tokens ?? 0) + (u.thinking_tokens ?? 0), cache_read: u.cache_read_tokens ?? 0, cache_write: 0 };
      if (result.status !== "SUCCESS") return resolve({ key: req.key, text: String(result.response ?? ""), usage, error: `agy ${result.status}: ${String(result.error ?? "").slice(0, 300)}` });
      if (tools.length) return resolve({ key: req.key, text: "", usage, error: `agy used tools (${[...new Set(tools)].join(", ")}) instead of replying` });
      resolve({ key: req.key, text: String(result.response ?? ""), usage });
    });
    child.stdin.end(JSON.stringify({ event: "user", message: { content: prompt } }) + "\n");
  });
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
export interface RunOptions {
  concurrency?: number;
  model?: string; // overrides the tier default for every request
  batch?: boolean; // anthropic only: Message Batches API
  usageLog?: string; // jsonl file to append one usage row per call
  stage?: string;
  onResult?: (r: LlmResult) => void | Promise<void>;
}

/** Parallel model calls. Same tokens at any level; higher only finishes sooner (RW_CONCURRENCY overrides). */
export function defaultConcurrency(): number {
  const env = Number(process.env.RW_CONCURRENCY);
  return env > 0 ? env : 12;
}

const RETRYABLE = /rate|overload|429|529|500|502|503|timeout|ECONNRESET|exited null/i;

async function callOnce(req: LlmRequest, model: string): Promise<LlmResult> {
  const b = backendOf(req);
  if (b === "claude-cli") return callClaudeCli(req, model);
  if (b === "anthropic") return callAnthropic(req, model);
  if (b === "agy") return callAgy(req, model);
  return callGemini(req, model);
}

async function callWithRetry(req: LlmRequest, model: string): Promise<LlmResult> {
  let r = await callOnce(req, model);
  for (let attempt = 1; attempt <= 3 && r.error && RETRYABLE.test(r.error); attempt++) {
    await sleep(15_000 * attempt);
    r = await callOnce(req, model);
  }
  return r;
}

function logUsage(opts: RunOptions, r: LlmResult, model: string, req: LlmRequest) {
  if (!opts.usageLog) return;
  fs.mkdirSync(path.dirname(opts.usageLog), { recursive: true });
  const row = { at: new Date().toISOString(), stage: opts.stage, key: r.key, backend: backendOf(req), model, ...r.usage, error: r.error };
  fs.appendFileSync(opts.usageLog, JSON.stringify(row) + "\r\n");
}

/** Runs every request (a worker pool, or one Message Batch) and calls onResult as each finishes. */
export async function runAll(reqs: LlmRequest[], opts: RunOptions = {}): Promise<LlmResult[]> {
  if (!reqs.length) return [];
  if (opts.batch) {
    if (backend() !== "anthropic") throw new Error("--batch needs RW_LLM=anthropic (Message Batches API)");
    const results = await runAnthropicBatch(reqs, opts.model);
    for (const [i, r] of results.entries()) {
      logUsage(opts, r, modelFor(reqs[i].tier, opts.model), reqs[i]);
      await opts.onResult?.(r);
    }
    return results;
  }
  const results: LlmResult[] = new Array(reqs.length);
  let next = 0;
  const worker = async () => {
    while (next < reqs.length) {
      const i = next++;
      const model = modelFor(reqs[i].tier, opts.model, backendOf(reqs[i]));
      const r = await callWithRetry(reqs[i], model);
      results[i] = r;
      logUsage(opts, r, model, reqs[i]);
      await opts.onResult?.(r);
    }
  };
  await Promise.all(Array.from({ length: Math.min(opts.concurrency ?? defaultConcurrency(), reqs.length) }, worker));
  return results;
}

export function addUsage(a: Usage, b: Usage): Usage {
  return { input: a.input + b.input, output: a.output + b.output, cache_read: a.cache_read + b.cache_read, cache_write: a.cache_write + b.cache_write };
}

export function formatUsage(u: Usage): string {
  const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${(n / 1e3).toFixed(1)}k`);
  return `${k(u.input + u.cache_read + u.cache_write + u.output)} tokens (input ${k(u.input)}, cache read ${k(u.cache_read)}, cache write ${k(u.cache_write)}, output ${k(u.output)})`;
}

/** The first ```json fenced block (or the whole text) parsed as JSON. */
export function parseJsonReply<T>(text: string): T {
  const fence = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const body = (fence ? fence[1] : text).trim();
  try {
    return JSON.parse(body);
  } catch {
    const a = body.indexOf("{");
    const b = body.lastIndexOf("}");
    if (a !== -1 && b > a) return JSON.parse(body.slice(a, b + 1));
    throw new Error(`reply is not JSON: ${body.slice(0, 200)}`);
  }
}

/** Strips a fence wrapped around a whole markdown reply. */
export function unwrapMarkdown(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:markdown|md)?\s*\n([\s\S]*)\n```$/);
  return (m ? m[1] : t).trim() + "\n";
}

/** A stage skill's SKILL.md without its front matter and without the named sections (agent workflow steps). */
export function skillText(name: string, dropSections: string[] = []): string {
  const p = path.join(process.cwd(), ".agents", "plugins", "retro-walkthrough", "skills", name, "SKILL.md");
  let t = fs.readFileSync(p, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, "");
  for (const s of dropSections) {
    const re = new RegExp(`\\n## ${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\n]*\\n[\\s\\S]*?(?=\\n## |$)`);
    t = t.replace(re, "\n");
  }
  return t.trim();
}
