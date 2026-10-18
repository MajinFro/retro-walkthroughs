#!/usr/bin/env python3
"""Find and register every VGMaps map of a game as a `kind: map` source (no model calls).

    npm run rw:maps -- <gameId> [--dry-run] [--folder PSX] [--prefix SpyroTheDragon] [--keep-unmarked]

Reads the title and console from 01_achievements.json, opens the console's VGMaps atlas page
(https://www.vgmaps.com/Atlas/<folder>/index.htm), keeps the table rows whose image file name starts
with the game's prefix (the title in CamelCase, e.g. SpyroTheDragon-Artisans-Homeworld.png), and
registers each through collect_source.py. Sources that are already registered are left alone.
"(Unmarked)" copies of a marked map are skipped unless --keep-unmarked is given.
If no maps match, it prints the closest file-name prefixes on the page so you can pass --prefix.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter
from urllib.parse import unquote

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

# RetroAchievements console name -> VGMaps atlas folder (folders checked against vgmaps.com/Atlas/index.htm, 2026-10-17)
FOLDERS = [
    (r"^NES|Famicom Disk", "NES"),
    (r"^SNES|Super Famicom", "SuperNES"),
    (r"^Nintendo 64", "N64"),
    (r"^Game Boy Advance", "GBA"),
    (r"^Game Boy", "GB-GBC"),
    (r"^Nintendo DS", "DS"),
    (r"^Nintendo 3DS", "3DS"),
    (r"^GameCube", "GCN"),
    (r"^Wii U", "WiiU"),
    (r"^Wii", "Wii"),
    (r"^Virtual Boy", "VirtualBoy"),
    (r"^PlayStation Portable", "PSP"),
    (r"^PlayStation 2", "PS2"),
    (r"^PlayStation", "PSX"),
    (r"Genesis|Mega Drive", "Genesis"),
    (r"^Master System", "MasterSystem"),
    (r"^Game Gear", "GameGear"),
    (r"^Saturn", "Saturn"),
    (r"^Dreamcast", "DC"),
    (r"PC Engine|TurboGrafx", "TG16"),
    (r"^Neo Geo Pocket", "NGP-NGPC"),
    (r"^Atari 2600", "Atari2600"),
    (r"^Atari 5200", "Atari5200"),
    (r"^Atari 7800", "Atari7800"),
    (r"^Atari Lynx", "Lynx"),
    (r"^Atari ST", "AtariST"),
    (r"^Commodore 64", "C64"),
    (r"^Amiga", "Amiga"),
    (r"^Amstrad CPC", "CPC"),
    (r"^Apple II", "AppleII"),
    (r"^MSX", "MSX"),
    (r"^ZX Spectrum", "ZXSpectrum"),
    (r"^ColecoVision", "ColecoVision"),
    (r"^Intellivision", "Intellivision"),
    (r"^Arcade", "Arcade"),
    (r"^Sharp X68000", "X68000"),
    (r"^Sharp X1", "X1"),
    (r"^Arduboy", "Arduboy"),
    (r"^Xbox", "Xbox"),
    (r"^DOS", "PC"),
]


def folder_for(console: str) -> str | None:
    return next((f for pat, f in FOLDERS if re.search(pat, console, re.I)), None)


def camel(s: str) -> str:
    return "".join(w[:1].upper() + w[1:] for w in re.findall(r"[A-Za-z0-9]+", s.replace("'", "")))


def prefixes(title: str) -> list[str]:
    """Candidate VGMaps file-name prefixes, longest first: full title, then the part before ':' / ' - '."""
    out = [camel(title)]
    for sep in (":", " - ", " ("):
        if sep in title:
            out.append(camel(title.split(sep)[0]))
    return list(dict.fromkeys(p for p in out if p))


def slug(s: str) -> str:
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", s.replace("'", "").replace("’", ""))
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


MAX_ID = 41  # collect_source.py accepts [a-z0-9][a-z0-9-]{1,40}


def fit_id(part_slug: str, taken: set[str]) -> str:
    """map-<slug> within MAX_ID chars and not in `taken`. Long slugs shorten "chapter" to "ch", then
    drop middle words, keeping the first word and the most specific trailing ones."""
    words = part_slug.replace("chapter", "ch").split("-")
    base = "map-" + "-".join(words)
    if len(base) > MAX_ID:
        tail: list[str] = []
        for w in reversed(words[1:]):
            if len("map-" + "-".join([words[0], w, *tail])) > MAX_ID:
                break
            tail.insert(0, w)
        base = ("map-" + "-".join([words[0], *tail]))[:MAX_ID].rstrip("-")
    out, n = base, 2
    while out in taken:
        room = MAX_ID - len(str(n)) - 1
        stem = base if len(base) <= room else base[: room + 1].rsplit("-", 1)[0]  # cut at a word boundary
        out = f"{stem}-{n}"
        n += 1
    return out


def humanize(s: str) -> str:
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", s.replace("-", " ").replace("_", " "))
    return re.sub(r"\s+", " ", s).strip()


def atlas_rows(folder: str) -> list[dict]:
    from playwright.sync_api import sync_playwright
    import dns_helper

    url = f"https://www.vgmaps.com/Atlas/{folder}/index.htm"
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=dns_helper.get_chromium_args())
        page = browser.new_context(user_agent=USER_AGENT).new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            rows = page.evaluate(
                """() => [...document.querySelectorAll('tr')].map(tr => {
                    const a = tr.querySelector('a[href]');
                    if (!a) return null;
                    const href = a.href;
                    if (!/\\.(png|gif|jpe?g|webp)$/i.test(href)) return null;
                    const cells = [...tr.querySelectorAll('td')].map(td => td.textContent.trim().replace(/\\s+/g, ' '));
                    return { href, cells };
                }).filter(Boolean)"""
            )
        finally:
            browser.close()
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description="Register a game's VGMaps maps as map sources.")
    ap.add_argument("game_id")
    ap.add_argument("--folder", help="VGMaps atlas folder (default: from the console in 01_achievements.json)")
    ap.add_argument("--prefix", help="Map file-name prefix (default: the title in CamelCase)")
    ap.add_argument("--keep-unmarked", action="store_true", help='Also register "(Unmarked)" copies')
    ap.add_argument("--dry-run", action="store_true", help="List the maps without registering them")
    import npm_guard
    npm_guard.check(ap)
    args = ap.parse_args()

    research = os.path.join(ROOT, "content", "research", args.game_id)
    with open(os.path.join(research, "01_achievements.json"), encoding="utf-8-sig") as fh:
        game = json.load(fh)
    folder = args.folder or folder_for(game.get("console", ""))
    if not folder:
        sys.exit(f'No VGMaps folder known for console "{game.get("console")}". Find it on https://www.vgmaps.com/Atlas/index.htm and pass --folder.')

    rows = atlas_rows(folder)
    files = [(r, unquote(os.path.basename(r["href"].split("?")[0]))) for r in rows]
    cands = [args.prefix] if args.prefix else prefixes(game["title"])
    prefix, mine = None, []
    for p in cands:
        mine = [(r, f) for r, f in files if f.lower().startswith(p.lower() + "-") or re.match(re.escape(p) + r"\.(png|gif|jpe?g|webp)$", f, re.I)]
        if mine:
            prefix = p
            break
    if not mine:
        tried = ", ".join(cands)
        first = re.findall(r"[A-Za-z0-9]+", game["title"])[0].lower() if re.findall(r"[A-Za-z0-9]+", game["title"]) else ""
        near = Counter(f.split("-")[0] for _, f in files if f.lower().startswith(first[:4]))
        hint = ", ".join(p for p, _ in near.most_common(8)) or "none"
        print(f"No VGMaps maps for {game['title']} in Atlas/{folder} (tried prefixes: {tried}). Prefixes on that page starting like the title: {hint}.")
        print(f"If one is this game, re-run with --prefix <prefix>. Otherwise this game has no VGMaps maps.")
        sys.exit(2)

    names = {f for _, f in mine}
    manifest_path = os.path.join(research, "02_sources", "sources.json")
    manifest = []
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8-sig") as fh:
            manifest = json.load(fh)
    have = {s["id"] for s in manifest}
    have_urls = {s.get("url") for s in manifest}
    url_id = {s.get("url"): s["id"] for s in manifest}
    taken = set(have)
    maps = []
    for r, f in mine:
        stem = re.sub(r"\.(png|gif|jpe?g|webp)$", "", f, flags=re.I)
        unmarked = bool(re.search(r"\(unmarked\)", stem, re.I))
        if unmarked and not args.keep_unmarked and re.sub(r"\(unmarked\)", "", f, flags=re.I) in names:
            continue
        part = stem[len(prefix):].lstrip("-") or "Full"
        author = r["cells"][-1] if r["cells"] else ""
        # a map already registered keeps its id; a new one gets a unique id that fits the limit
        mid = url_id.get(r["href"]) or fit_id(slug(part), taken)
        taken.add(mid)
        maps.append({"id": mid, "title": f"{humanize(part)} Map", "author": author, "url": r["href"]})

    new = [m for m in maps if m["url"] not in have_urls]
    print(f"VGMaps Atlas/{folder}, prefix {prefix}: {len(maps)} map(s), {len(maps) - len(new)} already registered, {len(new)} to add")
    for m in maps:
        print(f"  {'+' if m in new else '='} {m['id']:<40} {m['title']:<40} {m['author']}")
    if args.dry_run or not new:
        return
    failed = 0
    for m in new:
        cmd = [sys.executable, os.path.join(HERE, "collect_source.py"), args.game_id, m["url"], "--id", m["id"], "--site", "VGMaps",
               "--title", m["title"], "--kind", "map", "--image-url", m["url"]]
        if m["author"]:
            cmd += ["--author", m["author"]]
        env = {k: v for k, v in os.environ.items() if not k.startswith("npm_")}  # the npm guard is for this script only
        r = subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True)
        if r.returncode != 0:
            failed += 1
            print(f"  ❌ {m['id']}: {(r.stderr or r.stdout).strip()[-200:]}")
    print(f"Registered {len(new) - failed} map source(s){f', {failed} failed' if failed else ''}. Re-run npm run rw:chunk -- {args.game_id} afterwards.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
