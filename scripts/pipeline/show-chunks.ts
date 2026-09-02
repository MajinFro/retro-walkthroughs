/**
 * Chunk viewer / search used by the fact-extractor and verifier agents.
 *
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --source gf1 --list
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --source gf1 --from 10 --to 14
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --id gf1#117
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --grep "silver sword" [--source gf2]
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --progress     (which chunks have facts)
 */
import fs from "node:fs";
import path from "node:path";
import { type Chunk, flag, gameIdArg, loadFacts, norm, paths, readJsonl, requireFile } from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
requireFile(P.chunks, "run rw:chunk first");
let chunks = readJsonl<Chunk>(P.chunks);

const source = flag("source");
if (source) chunks = chunks.filter((c) => c.source_id === source);

if (flag("progress")) {
  const facts = loadFacts(P.factsDir);
  const done = new Set(facts.flatMap((f) => f.evidence.map((e) => e.chunk_id)));
  const skipped = new Set<string>();
  const skipFile = path.join(P.factsDir, "_skipped.txt");
  if (fs.existsSync(skipFile))
    fs.readFileSync(skipFile, "utf-8").split(/\r?\n/).forEach((l) => l.trim() && skipped.add(l.trim().split(/\s/)[0]));
  const bySrc = new Map<string, { total: number; done: number; todo: string[] }>();
  for (const c of chunks) {
    const s = bySrc.get(c.source_id) ?? { total: 0, done: 0, todo: [] };
    s.total++;
    if (done.has(c.chunk_id) || skipped.has(c.chunk_id)) s.done++;
    else s.todo.push(String(c.n));
    bySrc.set(c.source_id, s);
  }
  for (const [s, v] of bySrc) {
    const pct = Math.round((v.done / v.total) * 100);
    console.log(`${s.padEnd(12)} ${v.done}/${v.total} chunks processed (${pct}%)`);
    if (v.todo.length) console.log(`   unprocessed: ${compress(v.todo.map(Number))}`);
  }
  console.log(`\nTotal facts: ${facts.length}`);
  process.exit(0);
}

function compress(ns: number[]): string {
  const out: string[] = [];
  let a = ns[0];
  let b = ns[0];
  for (let i = 1; i <= ns.length; i++) {
    if (ns[i] === b + 1) b = ns[i];
    else {
      out.push(a === b ? `${a}` : `${a}-${b}`);
      a = b = ns[i];
    }
  }
  return out.join(", ");
}

if (flag("list")) {
  for (const c of chunks)
    console.log(`${c.chunk_id.padEnd(16)} L${c.line_start}-${c.line_end}  ${String(c.text.length).padStart(5)}ch ${c.has_ascii_map ? "[MAP] " : ""}${c.section}`);
  process.exit(0);
}

const one = flag("id");
const grep = flag("grep");
const from = Number(flag("from") ?? 0);
const to = Number(flag("to") ?? from);

let sel: Chunk[];
if (one) sel = chunks.filter((c) => c.chunk_id === one);
else if (grep) {
  const terms = grep.split("|").map(norm);
  sel = chunks.filter((c) => {
    const t = norm(c.text);
    return terms.every((term) => t.includes(term));
  });
  console.log(`# ${sel.length} chunk(s) contain all of: ${terms.join(" + ")}\n`);
  if (!flag("full")) {
    for (const c of sel) {
      const t = c.text;
      const i = norm(t).indexOf(terms[0]);
      // approximate snippet location in raw text
      const rawIdx = Math.max(0, Math.floor((i / Math.max(1, norm(t).length)) * t.length) - 200);
      console.log(`--- ${c.chunk_id} [${c.section}]`);
      console.log(t.slice(rawIdx, rawIdx + 500).trim(), "\n");
    }
    process.exit(0);
  }
} else sel = chunks.filter((c) => c.n >= from && c.n <= to);

for (const c of sel) {
  console.log(`\n================ ${c.chunk_id} | ${c.site}: ${c.source_title}`);
  console.log(`section: ${c.section} | lines ${c.line_start}-${c.line_end}${c.has_ascii_map ? " | contains ASCII map" : ""}`);
  console.log("----------------------------------------------------------------");
  console.log(c.text);
}
