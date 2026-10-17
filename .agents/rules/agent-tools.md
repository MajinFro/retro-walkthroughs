---
description: Maps the generic actions used in the retro-walkthrough skills to the tool names of each supported agent (Antigravity, Claude Code).
---

# Agent Tool Reference

The skills in `.agents/plugins/retro-walkthrough/skills/` are shared by **Antigravity** and **Claude Code**. They describe actions generically ("read the file", "fetch the page"). Use the tool for your agent:

| Action in a skill | Antigravity | Claude Code |
|---|---|---|
| Read a file (or a slice of a large file) | `view_file` | `Read` (use `offset` / `limit` for slices) |
| Write / create a file | `write_to_file` | `Write` |
| Edit part of a file | `replace_file_content` | `Edit` |
| Run a terminal command (`npm run rw:*`) | `run_command` | `PowerShell` or `Bash` |
| Fetch a web page's content | `read_url_content` | `WebFetch` |
| Search the web | `search_web` | `WebSearch` |
| Search file contents | `grep_search` | `Grep` |
| Spawn a subagent | `invoke_subagent` | `Agent` |
| Load another stage skill | open its `SKILL.md` | `Skill` tool (e.g. `ra-fact-extractor`), or `Read` its `SKILL.md` |

## Notes

- **Commands:** All `npm run rw:*` commands are run from the repository root. Pass script arguments after `--` exactly as written in the skills. **In PowerShell, type `npm.cmd run` instead of `npm run`** whenever the command has a `--flag` (`npm.cmd run rw:write -- 471 --fix`): plain `npm` there is `npm.ps1`, PowerShell strips the `--`, and npm takes the flags as its own. The scripts stop with an error when that happens. Bash needs no change.
- **Sites that block AI:** GameFAQs and many guide sites block agent fetch tools (`read_url_content`, `WebFetch`) but not a real browser. Download all guide text with `npm run rw:collect`, read or list links on any other site with `npm run rw:browse`, and discover GameFAQs guides with `npm run rw:find-guides`; all three drive a headless Chrome browser (Playwright). Agent fetch/search tools are for discovering URLs only, never for source text. See "Blocked Sites" in the `ra-source-collector` skill.
- **Long runs:** Pipeline state lives on disk, so any stage resumes with `npm run rw:status -- <gameId>`. Antigravity: suggest a new conversation or the `/goal` command for long unattended runs. Claude Code: context is compacted automatically, so keep working; write to disk after every batch so nothing is lost.
- **Line endings:** Whatever tool writes a file, the result must use CRLF (see `formatting.md`). The `rw:*` scripts already write CRLF.
