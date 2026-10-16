# retro-walkthroughs

Evidence-first pipeline that produces verifiable, True 100% RetroAchievements walkthroughs, plus a TanStack Start reader site. See `README.md` for the architecture, stage table, and scoring rules.

## Shared agent setup

This repo is worked on by both Antigravity and Claude Code. The single source of truth for agent behavior is `.agents/`:

- Stage skills: `.agents/plugins/retro-walkthrough/skills/<name>/SKILL.md`. The `.claude/skills/` entry points are generated wrappers; edit the `.agents` file, then run `npm run rw:sync-skills` if a skill was added, renamed, or re-described.
- Always-on rules (imported below):

@.agents/rules/formatting.md
@.agents/rules/no-shortcuts.md
@.agents/rules/agent-tools.md

## Working on a game

- Start every pipeline session with `npm run rw:status -- <gameId>` and do the NEXT action it prints. The orchestrator skill is `generate-walkthrough`.
- Delegate Stage 4 batches and Stage 8 chapters to the `rw-worker` agent (Sonnet, fresh context per task); keep planning (6–7) and the adversarial review (9) in the main session. See "Delegating bulk work" in the `generate-walkthrough` skill.
- Never hand-edit script-generated files (`05_verified.json`, `09_qa.json`, `10_score.json`); fix the upstream artifact and re-run the stage.
- `.env` needs `RA_USERNAME` and `RA_API_KEY`.
- Commit each game's walkthrough and research (`content/`) separately from pipeline changes (scripts, skills, agents, README), so either can be reverted alone.

## Line endings in Claude Code

`Write` creates LF files. A PostToolUse hook in `.claude/settings.json` converts every written/edited file to CRLF via `scripts/to-crlf.mjs`. Files created through shell commands are not covered; run `npm run rw:crlf -- <file...>` on them.
