---
name: generate-walkthrough
description: Orchestrates the evidence-first RetroAchievements walkthrough pipeline (10 stages; bulk extraction and writing run as scripts that call a model directly, judgment stages are done by the coding agent in Antigravity or Claude Code). Use when the user asks to generate, resume, or check progress on a walkthrough for a game ID.
---

# Walkthrough Orchestrator (evidence-first pipeline)

**Goal:** an idiot-proof, 100% RetroAchievements walkthrough in which every claim is traceable to a collected source. Accuracy over speed, but never waste tokens: the bulk stages are scripts, and you spend your own context only on judgment.

All state lives in `content/research/<gameId>/`. Any stage can be resumed in a fresh conversation.

**Tools:** These skills name actions generically (read a file, fetch a page, search the web, run a command). `.agents/rules/agent-tools.md` maps each action to the Antigravity and Claude Code tool names. Read it once before starting if it is not already loaded as a rule.

**Loading stage skills:** All stage skills live next to this one in `.agents/plugins/retro-walkthrough/skills/<skill-name>/SKILL.md`. In Claude Code they are also available through the `Skill` tool under the same names.

## Always start with

```powershell
npm run rw:status -- <gameId>
```

It prints what is done, the exact **NEXT** action, and a **WHO** line: run it yourself (`coordinator`) or hand it to a fresh `rw-stage` agent (`rw-stage`). See "Coordinator mode" below. Do that action, re-run status, repeat.

## Stages

| # | Stage | Who | Command / Skill | Output |
|---|---|---|---|---|
| 1 | Achievement collection | script | `npm run rw:fetch -- <id>` | `01_achievements.json`, `02_sources/ra-comments.txt`, `02_sources/ra-guide.txt` (RA guides wiki, when the game has a guide) |
| 2 | Guide collection | `rw-stage` agent + script | skill **ra-source-collector** → `npm run rw:collect -- …` | `02_sources/*.txt`, `sources.json` |
| 3 | Source parsing | script | `npm run rw:chunk -- <id>` | `03_chunks.jsonl` |
| 4 | Fact extraction | **script (model calls)** | `npm run rw:extract -- <id>` (rules: **ra-fact-extractor**) | `04_facts/*.jsonl` |
| 5 | Verification | script; real conflicts only: `rw-stage` agent (alias cleanup happens in Stages 6–7) | `npm run rw:verify -- <id>`, skill **ra-fact-verifier** | `05_verified.json` |
| 6 | Knowledge graph | `rw-stage` agent | skill **ra-route-planner** | `06_graph.json` |
| 7 | Roadmap | `rw-stage` agent + script | skill **ra-route-planner**, `npm run rw:plan -- <id>` | `07_roadmap.json`, `06_graph.md` |
| 8 | Writing | **script (model calls)** | `npm run rw:write -- <id>` (rules: **ra-walkthrough-writer**) | `08_chapters/*.md` |
| 9 | QA | script; review: `rw-stage` agent | `rw:write` runs `rw:assemble` + `rw:qa`; fixes via `npm run rw:write -- <id> --fix`; skill **ra-qa-auditor** | `09_qa.json`, `09_review.json` |
| 10 | Scoring | script | `npm run rw:score -- <id>` | `10_score.json` (rejects < 90%) |
| 11 | Post-Approval Cleanup | script | `npm run rw:clean -- <id>` | Purges intermediate draft packets & scratch files |

## Bulk stages run as scripts (cost control)

Stages 4 and 8 are most of a run's volume. `rw:extract` and `rw:write` send each batch or chapter to a model as **one call** (fixed system prompt from the stage skill, the chunks or packet as the message), check the reply deterministically, send one repair call for anything that fails, and write the files. There is no agent loop, so a call costs its input plus its output and nothing more. Both scripts log every call to `_usage.jsonl`; `rw:status` prints the total.

- **Guide extraction runs on Gemini Flash** through the Antigravity CLI (`agy`) when it is installed, so it costs no Claude tokens; RA comment batches stay on Haiku and writing stays on Sonnet. `RW_LLM_EXTRACT` / `RW_LLM_WRITE` choose the backend per stage (`RW_LLM_EXTRACT=claude-cli` for Haiku). `rw:status` USAGE splits Claude and agy tokens; report both.
- **Backend:** `RW_LLM` = `claude-cli` (default when the `claude` CLI is installed; uses its login), `anthropic` (`ANTHROPIC_API_KEY`; add `--batch` to `rw:extract` for the Message Batches API at half price), or `gemini` (`GEMINI_API_KEY`). Models: extraction defaults to the small tier (Haiku / Gemini Flash), writing to the middle tier (Sonnet / Gemini Pro); override with `--model` or `RW_MODEL_EXTRACT` / `RW_MODEL_WRITE`. Extraction runs at `--effort medium` (`RW_EFFORT_EXTRACT` overrides; `low` loses facts). Calls run 12 at a time (`--concurrency N` or `RW_CONCURRENCY`); that changes speed, not token cost.
- **`rw:extract`** processes every unprocessed chunk; re-run it until `rw:status` shows Stage 4 at 100%, then run `rw:verify`. The primary guide is the one marked `"primary": true` in `sources.json`, else the largest guide, and is always extracted in full. Other walkthroughs of 100k+ characters (not `checklist-*`) get a *focused* prompt: chests, items, bosses, puzzles, missables, numbers and achievement facts only, no story or plain navigation. Set `"extract": "full"` on a source in `sources.json`, or pass `--full`, to extract it completely. `--dry-run` shows the batches; `--max-batches N` limits a run.
- **`rw:write`** builds each missing chapter's packet and writes the chapter, then runs `rw:assemble` + `rw:qa`. Name chapters (`rw:write -- <id> 3 7`) or pass `--force` to rewrite existing ones.
- **`rw:write -- <id> --fix`** revises every chapter with QA errors or score-affecting warnings (sends the draft, the QA findings and the packet). Errors are revised every pass; each kind of warning gets one attempt per chapter (recorded in `_fix_tried.json`; `--force` retries), since repeat attempts rewrite whole chapters and rarely clear them. Use it instead of editing chapters in your own context; do one-line fixes by hand only.
- Never write facts or chapters yourself in bulk. If a script fails (no backend available, repeated errors), report it to the user; the `rw-worker` agent is the fallback only when no backend can run.

## Coordinator mode (cost control)

Every turn of a long conversation re-reads the whole conversation, so a stage that runs on top of earlier stages' context costs many times more than the same stage in a fresh context. You therefore act as a **thin coordinator**: you run commands and hand every judgment stage to a fresh subagent. Your own context should stay at a few tens of thousands of tokens for the whole game.

`rw:status` prints a `WHO:` line under NEXT:

- **`WHO: coordinator`** (command stages: 1 fetch, 3 chunk, 4 `rw:extract`, 5 `rw:verify` when it passes, 8 `rw:write` / `rw:write --fix`, 9 assemble + qa, 10 score): run the command yourself. Read only its summary lines; never open the facts, packets or chapters it wrote.
- **`WHO: rw-stage`** (judgment stages: 2 source collection, 5 conflict resolution, 6–7 graph & roadmap, 9 adversarial review, score blockers): spawn the **`rw-stage`** agent (`.claude/agents/rw-stage.md`, Opus, fresh context) with the Agent tool, one stage per agent, and wait for its report. Prompt template:
  `Game <id>. Stage <N> (<name>): <the NEXT line from rw:status>. Follow .claude/agents/rw-stage.md.` Add anything the user told you that the stage needs (e.g. "the user wants the Japanese guide included").
  Stage 2 (source collection) runs on **Sonnet**: `rw:status` prints `WHO: rw-stage (Sonnet)`, so pass `model: "sonnet"` to the Agent tool. Its lookups and downloads are scripts (`rw:find-guides --url`, `rw:maps`, `rw:collect`) and the stage gate checks the result; keep Opus for stages 5, 6–7 and 9.

The loop:
1. `npm run rw:status -- <id>`.
2. Do what NEXT says, yourself or via `rw-stage` as `WHO:` says. For command stages, run **`npm run rw:auto -- <id>`** (in the background; it can take a while) instead of each command by hand: it runs every command stage in a row (fetch, chunk, extract, verify, plan, write, `--fix`, assemble + qa, score) and stops at the first stage that needs judgment, a usage limit, or a step that makes no progress, then prints NEXT/WHO. It never runs `rw:clean`. Full output is in `_auto.log`; read only its summary.
3. **Log every stage agent** as soon as it finishes, so `rw:status` can total active time and agent tokens: `npm run rw:log-agent -- <id> --stage "<N name>" --ms <run time ms> --tokens <tokens> --tools <tool uses> --model <model>` (e.g. `--stage "6-7 route"`). In Claude Code, copy `duration_ms`, `subagent_tokens` and `tool_uses` from the agent's completion notice; for a `claude` agent run in its own terminal (e.g. a Herdr pane, which gives no notice), pass `--session <claude session id>` instead and the script reads all three from the session log; in Antigravity, use what `invoke_subagent` reports and leave out what it doesn't. Log a failed or retried agent too. `rw:auto` logs its own steps, so run command stages through it rather than by hand; time spent waiting for the user or a usage-limit reset is never logged.
   Re-run status and trust it over any report. If a stage agent's gate did not pass, spawn a fresh `rw-stage` for the same stage with its report's open problems in the prompt; do not fix the stage in your own context.
4. After each stage, give the user a 2–3 line update (stage, result, model usage from status), then continue. Stop and ask only when a stage agent reports a decision that belongs to the user, or when the score is ACCEPTED (the user reviews the walkthrough before `rw:clean`; see "Approval summary and improvement analysis").

- **`WHO: user`** (held guides): Stage 2 saved a multi-version guide, or an other-console guide while fewer than 3 same-console guides exist. Ask the user once about every guide NEXT lists (title, what consoles it names, what the Stage 2 report says about it), then run `npm run rw:collect -- <id> --id <sourceId> --approve` (use it) or `--decline` (keep it unused) for each, then `rw:chunk`. `rw:auto` stops here too.

Fewer agents, fewer questions:
- When `rw:verify` passes (exit 0), go straight to Stages 6–7: that agent does the alias, corroboration and possible-conflict cleanup first (route-planner skill, "Step 0"). Spawn a separate Stage 5 agent only for real conflicts (exit 2).
- Unsupported achievements: the agent that finds them searches for a source itself before reporting. Ask the user once, with everything that is still unsupported, and keep going on other work while they decide.
- If `rw:status` prints a `NOTE:` about achievements from a recent set revision, pass it to the Stage 2 agent so it searches for them during collection.

Rules: run one `rw-stage` agent at a time (stages depend on each other); never paste file contents into a stage prompt (the agent reads from disk); never do judgment work yourself "because it is small" — that is how the coordinator's context grows. If the `rw-stage` agent type is not available in this session, use `general-purpose` with `model: "opus"` and tell it to read and follow `.claude/agents/rw-stage.md`.

**Antigravity:** use `invoke_subagent` for judgment stages the same way. If subagents are unavailable, suggest a new conversation at each judgment stage instead.

## Approval summary and improvement analysis

When `rw:score` outputs ACCEPTED, run `npm run rw:analyze -- <gameId>` before asking the user to approve. It condenses `_usage.jsonl`, `_activity.jsonl`, `_extract_rejects.jsonl`, `_auto.log`, `09_qa.json`, `09_review.json` and `10_score.json` into about 40 lines, including a comparison with earlier games. Read its output, not those files. If one specific claim needs checking, filter the file for it (for example, a few rejects of one reason); never read a whole log.

The approval message has two parts:
1. **Result:** score, the decisions the user should check (judgment calls, unverifiable achievements), active time, and script + agent tokens.
2. **Improvement analysis:** up to 5 suggestions, ranked by expected gain, covering **quality**, **token usage** and **run time**. Each one must:
   - start from a number in `rw:analyze` (a rejection reason, a repair share, the slowest agent, a review issue), not from general ideas;
   - name the pipeline stage, script or skill to change, and fix the cause where it starts: a major review issue that an earlier stage should have caught means changing that earlier stage;
   - state its expected effect on all three areas. **A suggestion must not make any area noticeably worse.** Better quality may not cost a large token increase (no extra review passes, no bigger model tiers, no larger packets), and saving tokens or time may not cost quality. Prefer changes that help one area and are neutral or better for the others: deterministic script checks and auto-fixes, prompt rules that prevent a repair call, and catching problems earlier so later stages do less;
   - say which past game, if any, showed the same problem (the comparison table, or the earlier games' logs), since a problem that repeats is worth more than a one-off.
   Flag regressions against earlier games (score, active time, tokens per chunk, repair share). Offer to implement the suggestions, but change nothing in the pipeline until the user says so, and commit pipeline changes separately from the game's content.

## Post-Approval Cleanup
Once `rw:score` outputs ACCEPTED and the user reviews and approves the final walkthrough:
```powershell
npm run rw:clean -- <gameId>
```
This purges intermediate draft packets in `content/research/<gameId>/08_packets/` and any leftover game-specific scratch files while preserving all research artifacts. To purge all scratch files across games: `npm run rw:clean -- --scratch`.

## Hard gates (never skip)

- **Stage 2 Guide & Map Quality Gate:** Only substantive guides (>=10k characters) count toward source coverage, and 3 are required. The RA guide (`ra-guide`) and RA comments from Stage 1 are extras on top and never count; `rw:status` and `rw:auto` block at Stage 2 until 3 are registered (or Stage 2 wrote `_fewer_guides.txt` after an exhaustive search; pass that on to the user). Guides must be for the game's RetroAchievements console: multi-version and other-console guides are saved but unused (`"use": false`) until the user approves them, and they never count. If visual maps exist on GameFAQs (`/map/`) or map archives, they MUST be discovered and registered as `kind: "map"`.
- **Stage 4 Completeness Gate:** Every chunk of every source, including `ra-comments`, must be cited by a fact or listed in `_skipped.txt` with a reason. `rw:status`, `rw:plan`, and `rw:score` all enforce 100%; re-run `rw:extract` until nothing is left.
- **Stage 4 Fact Authenticity & True 100% Gate:** Gameplay facts must cite guide walkthrough text — quoting achievement descriptions is forbidden. In addition to achievements, extract all dungeon chests, hidden items, sidequests, puzzles, and boss stats for True 100% game completion. `rw:extract` checks every fact with the `rw:verify` rules before writing it.
- **Stage 5 Verification Gate:** Do not start Stage 6 while `rw:verify` reports unresolved conflicts (exit code 2) or unsupported collection achievements.
- **Stage 7 Route & True 100% Criteria Gate:** Do not start Stage 8 until `rw:plan` passes. The roadmap MUST define `"format": "command_steps"` or `"prose"`, and specify `"true_100_criteria"` establishing what 100% completion requires for that game. Fix every `rw:plan` warning about area labels that match no fact location (rename the label or add `05_aliases.json` entries) before writing: those chapters get thin packets otherwise.
- **Stage 8 True 100% Depth & Checkpoints Gate:** Multi-floor dungeons must be routed room-by-room with all chests, puzzles, and map links. Every chapter MUST conclude with a `> [!IMPORTANT]` Cumulative 100% Checkpoint whose numbers match the totals the packet gives (computed from the roadmap; `rw:qa` checks them).
- **Stage 9 Adversarial QA Gate:** Stage 9 is NOT a self-approval stamp. The agent acts as an adversarial Red-Team auditor (`ra-qa-auditor`), cross-checking against sources for omitted chests, sparse dungeons, missing puzzle steps, and map links, logging issues in `09_review.json`.
- **Stage 10 Scoring Gate:** Walkthrough is ACCEPTED only if:
  - Overall score is **>= 90%**
  - Every individual category (including `true_100_coverage`) is **>= 80%**
  - Deterministic QA errors is **0**
  - Open critical and major review issues is **0**
  - QA warnings are minimized (each warning penalizes beginner friendliness)
- If a gate fails, fix the upstream artifact and re-run the gate. Never edit script-generated JSON files (`05_verified.json`, `09_qa.json`, `10_score.json`) by hand.

## Context management

- Stage 4 and 8 output goes straight to disk from the scripts; read only their summaries, not the files.
- Judgment stages run in `rw-stage` agents (see "Coordinator mode"), so the coordinator's context should stay small. If it still grows long, state is on disk and `rw:status` resumes any stage in a new session.

## Reporting progress

After each stage, report briefly: stage, % complete (from `rw:status`), notable findings (missables, conflicts, unsupported achievements), and the `USAGE` and `ACTIVE` lines `rw:status` prints. At the end of a game, give the final active time, script tokens and agent tokens.
