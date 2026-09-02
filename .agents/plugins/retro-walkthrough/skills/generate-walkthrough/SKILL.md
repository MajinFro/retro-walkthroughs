---
name: generate-walkthrough
description: Orchestrates the evidence-first RetroAchievements walkthrough pipeline (10 stages, all inside Antigravity, no external LLM APIs). Use when the user asks to generate, resume, or check progress on a walkthrough for a game ID.
---

# Walkthrough Orchestrator (evidence-first pipeline)

**Goal:** an idiot-proof, 100% RetroAchievements walkthrough in which every claim is traceable to a collected source. Accuracy over speed. No Gemini/LLM API calls — every AI step is performed by you (the Antigravity agent) following the stage skill.

All state lives in `content/research/<gameId>/`. Any stage can be resumed in a fresh conversation.

## Always start with

```powershell
npm run rw:status -- <gameId>
```

It prints what is done and the exact **NEXT** action. Do that action, re-run status, repeat.

## Stages

| # | Stage | Who | Command / Skill | Output |
|---|---|---|---|---|
| 1 | Achievement collection | script | `npm run rw:fetch -- <id>` | `01_achievements.json`, `02_sources/ra-comments.txt` |
| 2 | Guide collection | agent + script | skill **ra-source-collector** → `npm run rw:collect -- …` | `02_sources/*.txt`, `sources.json` |
| 3 | Source parsing | script | `npm run rw:chunk -- <id>` | `03_chunks.jsonl` |
| 4 | Fact extraction | agent | skill **ra-fact-extractor** | `04_facts/*.jsonl` |
| 5 | Verification | script + agent | `npm run rw:verify -- <id>`, skill **ra-fact-verifier** | `05_verified.json` |
| 6 | Knowledge graph | agent | skill **ra-route-planner** | `06_graph.json` |
| 7 | Roadmap | agent + script | skill **ra-route-planner**, `npm run rw:plan -- <id>` | `07_roadmap.json`, `06_graph.md` |
| 8 | Writing | agent | `npm run rw:packet -- <id> <overview|N>`, skill **ra-walkthrough-writer** | `08_chapters/*.md` |
| 9 | QA | script + agent | `npm run rw:assemble -- <id>`, `npm run rw:qa -- <id>`, skill **ra-qa-auditor** | `09_qa.json`, `09_review.json` |
| 10 | Scoring | script | `npm run rw:score -- <id>` | `10_score.json` (rejects < 90%) |
| 11 | Post-Approval Cleanup | script | `npm run rw:clean -- <id>` | Purges intermediate draft packets & scratch files |

## Post-Approval Cleanup
Once `rw:score` outputs ACCEPTED and the user reviews and approves the final walkthrough:
```powershell
npm run rw:clean -- <gameId>
```
This purges intermediate draft packets in `content/research/<gameId>/08_packets/` and any leftover game-specific scratch files while preserving all research artifacts. To purge all scratch files across games: `npm run rw:clean -- --scratch`.

## Hard gates (never skip)

- **Stage 2 Guide & Map Quality Gate:** Only substantive guides (>=10k characters) count toward source coverage. If visual maps exist on GameFAQs (`/map/`) or map archives, they MUST be discovered and registered as `kind: "map"`.
- **Stage 4 Fact Authenticity & True 100% Gate:** Gameplay facts must cite guide walkthrough text — quoting achievement descriptions is forbidden. In addition to achievements, extract all dungeon chests, hidden items, sidequests, puzzles, and boss stats for True 100% game completion. Superficial chunk sampling is strictly prohibited.
- **Stage 5 Verification Gate:** Do not start Stage 6 while `rw:verify` reports unresolved conflicts (exit code 2) or unsupported collection achievements.
- **Stage 7 Route & True 100% Criteria Gate:** Do not start Stage 8 until `rw:plan` passes. The roadmap MUST define `"format": "command_steps"` or `"prose"`, and specify `"true_100_criteria"` establishing what 100% completion requires for that game.
- **Stage 8 True 100% Depth & Checkpoints Gate:** Multi-floor dungeons must be routed room-by-room with all chests, puzzles, and map links. Every chapter MUST conclude with a `> [!IMPORTANT]` Cumulative 100% Checkpoint.
- **Stage 9 Adversarial QA Gate:** Stage 9 is NOT a self-approval stamp. The agent acts as an adversarial Red-Team auditor (`ra-qa-auditor`), cross-checking against sources for omitted chests, sparse dungeons, missing puzzle steps, and map links, logging issues in `09_review.json`.
- **Stage 10 Scoring Gate:** Walkthrough is ACCEPTED only if:
  - Overall score is **>= 90%**
  - Every individual category (including `true_100_coverage`) is **>= 80%**
  - Deterministic QA errors is **0**
  - Open critical and major review issues is **0**
  - QA warnings are minimized (each warning penalizes beginner friendliness)
- If a gate fails, fix the upstream artifact and re-run the gate. Never edit script-generated JSON files (`05_verified.json`, `09_qa.json`, `10_score.json`) by hand.

## Context management

These games are large. Work in batches and write to disk after every batch:
- Stage 4: ~5-10 chunks per batch, one `.jsonl` file per batch. Do not skip walkthrough chunks.
- Stage 8: one chapter per turn. Read its packet in slices with `view_file`.
- When context gets long, tell the user the stage/progress and suggest continuing in a new conversation (state is on disk; `rw:status` resumes). For long unattended runs, suggest the `/goal` command.

## Reporting progress

After each batch, report briefly: stage, % complete (from `rw:status` / `rw:chunks -- <id> --progress`), notable findings (missables, conflicts, unsupported achievements).

