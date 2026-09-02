import fs from "node:fs";
import path from "node:path";
import { EOL } from "../scripts/pipeline/lib.ts";

const dir = "content/research/1005/08_chapters";

function patch(file: string, replacements: [RegExp | string, string][]) {
  const p = path.join(dir, file);
  let text = fs.readFileSync(p, "utf-8");
  for (const [target, rep] of replacements) {
    text = text.replace(target, rep);
  }
  fs.writeFileSync(p, text.replace(/\r?\n/g, EOL), "utf-8");
  console.log(`Patched ${file}`);
}

// Chapter 1
patch("01.md", [
  ["### Alunze Kingdom, Foomy Woods, and Castle Basement", "### Alunze Kingdom and Castle Basement"],
]);

// Chapter 2
patch("02.md", [
  ["### Tanbel Region and Southeast Tower", "### Tanbel and Southeast Tower"],
  ["### Ruby Cave and Blaze (Capsule Monster #2)", "### Ruby Cave and Clamento"],
  ["Pierre & Danielle", "Pierre and Danielle"],
  ["Pierre & Danielle", "Pierre and Danielle"],
  ["### Gordovan West Tower & First Confrontation with Gades", "### Gordovan and Gordovan Tower"],
  ["Boss Encounter: Gades (First Battle)", "Boss Encounter: Gades (Gordovan Tower)"],
]);

// Chapter 3
patch("03.md", [
  ["### Northern Lighthouse & The Spike Trap", "### North Lighthouse & The Spike Trap"],
  ["Boss Encounter: Idura (First Battle)", "Boss Encounter: Idura (North Lighthouse)"],
  ["### Phantom Tree Mountain & Recruiting Gusto (Capsule Monster #3)", "### Aleyn and Phantom Tree"],
  ["### Narcysus, Tower of Sacrifice, and Idura's Second Defeat", "### Narcysus and Tower of Sacrifice"],
  ["Boss Encounter: Idura (Second Battle)", "Boss Encounter: Idura (Narcysus Tower)"],
  ["### Treadool, Flower Mountain, and Leefa's Priphea", "### Treadool and Flower Mountain"],
  ["### Dankirk North Dungeon & The Ruby Icon", "### Dankirk and North Dungeon"],
  ["### Eserikto, Recruiting Artea, and Submarine Conversion", "### Portravia and Submarine Lab — Recruiting Artea and Submarine Conversion"],
]);

// Chapter 5
patch("05.md", [
  ["### The Three Sealed Towers & Shrine of Daos", "### Sealed Towers of Shuman, Straf, Kamirno — Shrine of Daos"],
  ["### Doom Island: The Final Sinistral Gauntlet", "### Doom Island (Fortress of Doom)"],
  ["face the four dark gods in consecutive combat", "confront the Sinistrals: Gades, Amon, Erim, Daos in consecutive combat"],
]);

// Chapter 6
patch("06.md", [
  ["### Recruiting Raddian & The Seven Capsule Monsters", "### Capsule Monster Sanctuaries — Recruiting Raddian"],
  ["### Divine Shrine & The Four Egg Dragon Wishes", "### Divine Shrine & Egg Dragon Island and Lair — The Four Wishes"],
]);

// Chapter 7
patch("07.md", [
  ["### Floors B1 to B40: Survival & Gear Foundation", "### Ancient Cave Upper Floors (B1-B40) — Survival & Gear Foundation"],
  ["### Floors B41 to B80: The Deep Descent", "### Ancient Cave Mid Floors (B41-B80) — The Deep Descent"],
  ["### Floors B81 to B99 & Slaying the Master", "### Ancient Cave Deep Floors (B81-B99) — Slaying the Master"],
]);
