/**
 * Chunk viewer / search used by the fact-extractor and verifier agents.
 *
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --source gf1 --list
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --source gf1 --from 10 --to 14
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --id gf1#117
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --grep "silver sword" [--source gf2]
 *   npx tsx scripts/pipeline/show-chunks.ts <gameId> --progress     (which chunks have facts)
 */
import { type Chunk, chunkProgress, compressRanges, flag, gameIdArg, loadFacts, loadSkipped, nextBatch, norm, paths, readJsonl, requireFile } from "./lib.ts";

const id = gameIdArg();
const P = paths(id);
requireFile(P.chunks, "run rw:chunk first");
let chunks = readJsonl<Chunk>(P.chunks);

const source = flag("source");
if (source) chunks = chunks.filter((c) => c.source_id === source);

if (flag("progress")) {
  const facts = loadFacts(P.factsDir);
  const { bySource, unprocessed } = chunkProgress(chunks, facts, loadSkipped(P.factsDir));
  for (const [s, v] of bySource) {
    const pct = Math.floor((v.done / v.total) * 100);
    console.log(`${s.padEnd(12)} ${v.done}/${v.total} chunks processed (${pct}%)`);
    if (v.todo.length) console.log(`   unprocessed: ${compressRanges(v.todo)}`);
  }
  console.log(`\nTotal facts: ${facts.length}`);
  const next = nextBatch(id, bySource);
  if (next) {
    console.log(`\n${unprocessed.length} chunk(s) left. Stage 4 is complete only at 100% of every source (including ra-comments).`);
    console.log(`NEXT BATCH: ${next}`);
  } else console.log("\n✅ Every chunk is cited by a fact or listed in _skipped.txt. Stage 4 complete.");
  process.exit(0);
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
