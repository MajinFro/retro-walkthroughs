/**
 * Stage 6 helper - import name aliases from version-comparison tables.
 *
 *   npx tsx scripts/pipeline/import-aliases.ts <gameId> [--dry-run]
 *
 * Some guides compare releases in tables whose header row names the versions
 * ("FC | NES | GBC | iOS/Android/Switch") and whose rows give one thing's name in each version
 * ("Roresia | Midenhall | Lorasia | Midenhall"). Matching those by hand took most of the 1470 route
 * agent's time. This finds every such table in 02_sources/, picks the version column whose names
 * appear most in the achievement titles and descriptions (the set's own naming), and merges each row
 * into 05_aliases.json: that column's name is the canonical one, the others become its aliases.
 * Existing entries are kept; a name that already belongs to another canonical name is skipped and listed.
 */
import path from "node:path";
import { type AchievementsFile, type SourceEntry, exists, flag, gameIdArg, norm, paths, readJson, readJsonOr, readText, writeJson } from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
const dry = Boolean(flag("dry-run"));

const VERSION = /^(fc|nes|snes|sfc|famicom|super famicom|gb|gbc|gba|ds|3ds|psx?|ps\d|ps one|msx\d?|pc|jp|jpn|japan(ese)?|us|usa|na|eu|pal|english|original|remake|mobile|ios.*|android.*|switch|i\/a\/s|wii|wii ?u|sms|genesis|mega ?drive|saturn|n64|steam)$/i;
const cells = (l: string) => l.split("|").map((c) => c.replace(/\*+/g, "").trim());
const isName = (c: string) => /[a-z]{3}/i.test(c) && !/\s\.\s/.test(c) && c.length <= 40 && !/^\d/.test(c);

type Table = { source: string; versions: string[]; rows: string[][] };
const tables: Table[] = [];
const sources = exists(P.sourcesManifest) ? readJson<SourceEntry[]>(P.sourcesManifest) : [];
for (const s of sources.filter((x) => x.kind !== "map" && x.kind !== "ra-comments")) {
  const file = path.join(P.sourcesDir, s.file);
  if (!exists(file)) continue;
  const lines = readText(file).split(/\r?\n/);
  let cur: Table | null = null;
  for (const l of lines) {
    const c = cells(l);
    // the version columns lead the header row; later columns (prices, levels) are ignored
    let k = 0;
    while (k < c.length && VERSION.test(c[k])) k++;
    if (l.includes("|") && k >= 2) {
      cur = { source: s.id, versions: c.slice(0, k), rows: [] };
      tables.push(cur);
      continue;
    }
    if (!cur) continue;
    if (/^#{1,6}\s/.test(l.trim())) { cur = null; continue; } // a new section ends the table
    if (!l.includes("|")) continue; // sub-headings like "**Item Shop**" sit inside a table
    // A row with data columns after the names (price, level, HP) describes one thing in every version.
    // A names-only table (a town page) has the thing's names in its first row only; the rows after it
    // are shop stock, where each version may sell a different item (1470: Steel Shield vs Full Plate).
    const withData = c.length > cur.versions.length;
    if (!withData && cur.rows.length) { cur = null; continue; }
    const row = c.slice(0, cur.versions.length);
    if (row.length === cur.versions.length && row.some(isName)) cur.rows.push(row);
  }
}
if (!tables.length) {
  console.log(`No version-comparison tables found in ${sources.length} source(s) — nothing to import.`);
  process.exit(0);
}

// the set's own naming: the version column with the most names found in achievement text
const ach = readJson<AchievementsFile>(P.achievements);
const achText = ` ${norm(ach.achievements.map((a) => `${a.title} ${a.description}`).join(" "))} `;
const hits = new Map<string, number>();
for (const t of tables)
  t.versions.forEach((v, i) => {
    const key = v.toLowerCase();
    const n = t.rows.filter((r) => isName(r[i]) && achText.includes(` ${norm(r[i])} `)).length;
    hits.set(key, (hits.get(key) ?? 0) + n);
  });
const ranked = [...hits].sort((a, b) => b[1] - a[1]);
const target = ranked[0][0];
console.log(`Version columns (names found in achievement text): ${ranked.map(([v, n]) => `${v} ${n}`).join(", ")} → canonical: ${target}`);

const raw = readJsonOr<Record<string, string[]>>(P.aliases, {});
const owner = new Map<string, string>(); // norm(name) -> canonical key in raw
for (const [c, list] of Object.entries(raw)) {
  owner.set(norm(c), c);
  for (const a of list) if (!owner.has(norm(a))) owner.set(norm(a), c);
}
let added = 0;
let created = 0;
const skipped: string[] = [];
const colOf = (t: Table) => t.versions.findIndex((v) => v.toLowerCase() === target);
// a name the set's own version uses is never an alias of something else (1470: the GBC item "Antidote"
// is the NES spell "Antidote", not the NES item "Antidote Herb")
const targetNames = new Set(tables.flatMap((t) => (colOf(t) < 0 ? [] : t.rows.map((r) => norm(r[colOf(t)])))));
for (const t of tables) {
  const col = colOf(t);
  if (col < 0) continue;
  for (const r of t.rows) {
    const name = r[col];
    if (!isName(name)) continue; // "-": the thing does not exist in the set's version
    const others = [...new Set(r.filter((x, i) => i !== col && isName(x) && norm(x) !== norm(name)))].filter((x) => {
      if (!targetNames.has(norm(x))) return true;
      skipped.push(`"${x}" (${t.source}) is also a ${target} name, so not an alias of "${name}"`);
      return false;
    });
    if (!others.length) continue;
    let canon = owner.get(norm(name));
    if (!canon) {
      canon = name;
      raw[canon] = [];
      owner.set(norm(name), canon);
      created++;
    }
    for (const o of others) {
      const has = owner.get(norm(o));
      if (has === canon) continue;
      if (has) { skipped.push(`"${o}" (${t.source}) already belongs to "${has}", not "${canon}"`); continue; }
      raw[canon].push(o);
      owner.set(norm(o), canon);
      added++;
    }
  }
}
for (const k of Object.keys(raw)) if (!raw[k].length) delete raw[k];

console.log(`${tables.length} table(s) in ${[...new Set(tables.map((t) => t.source))].join(", ")}: ${added} alias(es) added, ${created} new canonical name(s)${dry ? " (dry run, nothing written)" : ""}`);
for (const s of skipped.slice(0, 20)) console.log(`  skipped: ${s}`);
if (skipped.length > 20) console.log(`  … ${skipped.length - 20} more skipped`);
if (!dry && added) writeJson(P.aliases, raw);
