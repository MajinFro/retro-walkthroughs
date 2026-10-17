---
name: ra-fact-verifier
description: Stage 5 of the walkthrough pipeline. Verifies facts across independent sources, resolves naming differences via aliases, resolves conflicts, and finds corroboration.
---

# Stage 5 — Fact Verifier

**Purpose:** Prevent hallucination and resolve conflicting claims across guides before route planning or writing begins.

## Objectives

1. Group equivalent facts across independent sources using naming aliases (`05_aliases.json`).
2. Upgrade single-source facts to verified status by locating corroborating evidence in other sources.
3. Identify and resolve contradictions in `05_resolutions.json`.
4. Ensure no unresolved conflicts exist (`rw:verify` must exit clean with code 0).

## Workflow

### 1. Run Verification Script
```powershell
npm run rw:verify -- <gameId>
```
Review the summary output:
- ✅ **Verified:** Supported by 2+ independent sources.
- 🟡 **Single Source:** Only supported by 1 source (allowed, but flagged).
- ⚠️ **Conflict:** Contradicting evidence or conflicting facts across sources.
- ❌ **Rejected:** Quotes not found verbatim in chunk, missing fields, or malformed schema.

### 2. Normalize Naming Discrepancies (`05_aliases.json`)
Different guides use different spellings or translations (e.g. SNES vs GBA translations, or "Celes" vs "Seles", "Tritoch" vs "Valigarmanda").
Create or update `content/research/<gameId>/05_aliases.json`:
```json
{
  "Canonical Area/Boss/Item Name": [
    "Old Translation Name",
    "Alternate Spelling",
    "Guide A Name"
  ]
}
```
When `rw:verify` runs, it canonicalizes subjects, objects, and locations using these aliases, automatically merging equivalent facts into verified multi-source facts!

### 3. Corroborate Single-Source Facts
Generate candidate matches across other sources:
```powershell
npm run rw:verify -- <gameId> --candidates --limit 100
```
This inspects `05_candidates.md`, ranking chunks from other sources that contain relevant keywords.
For each candidate chunk:
1. Inspect the chunk with `npm run rw:chunks -- <gameId> --id <chunk_id>`
2. If it supports the fact, append an entry to `content/research/<gameId>/05_corroborations.jsonl`:
```json
{"fact_id":"gf1-117-1","source_id":"neo1","chunk_id":"neo1#84","quote":"<verbatim quote from neo1#84>","stance":"supports"}
```
3. If it contradicts the fact:
```json
{"fact_id":"gf1-117-1","source_id":"neo1","chunk_id":"neo1#84","quote":"<verbatim quote from neo1#84>","stance":"contradicts","note":"Guide states Vargas is fought before Sabin joins"}
```

### 4. Resolve Conflicts (`05_resolutions.json`)
If sources disagree on an item location, boss strategy, trigger condition, or missable status, you must investigate the raw chunks or check the RetroAchievements community notes (`ra-comments`).
Document the resolution in `content/research/<gameId>/05_resolutions.json`:
```json
[
  {
    "fact_id": "gf1-117-1",
    "resolution": "accept",
    "rationale": "Verified via RetroAchievements comment and in-game mechanics that Sabin only joins during the Vargas battle sequence."
  },
  {
    "fact_id": "neo1-84-2",
    "resolution": "reject",
    "rationale": "Incorrectly claimed chest contained Elixir; SNES original release contains Hi-Potion as verified by GF1 and GF2."
  }
]
```

### 5. Final Verification Gate
Re-run:
```powershell
npm run rw:verify -- <gameId>
```
Confirm:
- Unresolved conflicts count is 0.
- All achievements have either verified or single-source supporting facts (or are clearly noted as unverifiable).
- Exit code is 0.

Before calling an achievement unverifiable, search for a source yourself (collected chunks with `rw:chunks --grep`, then the web with the `ra-source-collector` tools) and extract anything you find. Report only what is still unsupported after that search, so the user is asked once.
