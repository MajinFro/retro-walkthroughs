import fs from "node:fs";
import path from "node:path";
import { type Chunk, type SourceEntry, EOL, readJson, readJsonl } from "../scripts/pipeline/lib.ts";

const sources = readJson<SourceEntry[]>("content/research/253/02_sources/sources.json");
const mapSources = sources.filter((s) => s.kind === "map");
const chunks = readJsonl<Chunk>("content/research/253/03_chunks.jsonl");
const chunkBySource = new Map(chunks.map((c) => [c.source_id, c]));

const facts: any[] = [];

for (const s of mapSources) {
  const c = chunkBySource.get(s.id);
  if (!c) continue;

  const areaName = s.title.replace(/\s+Map$/i, "").trim();
  const author = s.author || "Mario Universe";
  const url = typeof s.url === "string" ? s.url : s.url[0];

  facts.push({
    id: `${s.id}-1-1`,
    type: "map",
    subject: areaName,
    predicate: "has_map",
    object: url,
    location: areaName,
    requires: [],
    achievement_ids: [],
    missable: false,
    text: `Visual map for ${areaName} hosted on Mario Universe.`,
    evidence: [
      {
        source_id: s.id,
        chunk_id: c.chunk_id,
        quote: `Map: ${s.title}`,
      },
    ],
  });
}

const outPath = "content/research/253/04_facts/maps.jsonl";
const text = facts.map((f) => JSON.stringify(f)).join(EOL) + EOL;
fs.writeFileSync(outPath, text, "utf-8");
console.log(`Wrote ${facts.length} map facts to ${outPath}`);
