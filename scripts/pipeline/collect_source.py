#!/usr/bin/env python3
# coding: utf-8
"""
Stage 2 - Guide Collector.

Downloads a complete guide (no summarization) into
content/research/<gameId>/02_sources/<source_id>.txt and registers it in
02_sources/sources.json with full attribution.

Usage:
    # GameFAQs guide URL (or a game's /faqs list page -> auto-picks best text guide)
    python scripts/pipeline/collect_source.py <gameId> <url> --id gf1 --site GameFAQs --title "Walkthrough by X" --author X

    # Any other site (Neoseeker, Fandom, StrategyWiki, Steam guide, RA forum ...)
    python scripts/pipeline/collect_source.py <gameId> <url> --id neo1 --site Neoseeker --title "..." --kind guide

    # Multi-page guides: call once per page with --append to build one source
    python scripts/pipeline/collect_source.py <gameId> <page2-url> --id neo1 --append

    # Register text you already saved by hand (never agent fetch-tool output; see ra-source-collector "Blocked Sites")
    python scripts/pipeline/collect_source.py <gameId> --file path/to/text.txt --id wiki1 --site Fandom --title "..."
"""
from __future__ import annotations

import argparse
import datetime as dt
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CRLF = "\r\n"


def _load_downloader():
    """Import scripts/gamefaqs-downloader.py (hyphenated filename)."""
    p = os.path.join(ROOT, "scripts", "gamefaqs-downloader.py")
    spec = importlib.util.spec_from_file_location("gamefaqs_downloader", p)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


def fetch_gamefaqs(url: str) -> str:
    gd = _load_downloader()
    d = gd.FAQDownloader(url=url, output_dir=".")
    result = d._fetch_with_retries()
    if result.is_html:
        import html2text

        h = html2text.HTML2Text()
        h.body_width = 0
        text = h.handle(result.content)
    else:
        text = result.content
    return gd._clean_content(text)


_GENERIC_SELECTORS = [
    ".mw-parser-output",  # MediaWiki / Fandom / StrategyWiki
    "#guide-content",
    ".guide-content",
    ".subGuide",  # Steam guides
    "article",
    "main",
    "#content",
    ".content",
    "body",
]


def fetch_generic(url: str) -> str:
    import html2text
    from playwright.sync_api import sync_playwright

    gd = _load_downloader()
    from dns_helper import get_chromium_args

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=get_chromium_args())
        try:
            ctx = browser.new_context(user_agent=gd.USER_AGENT, viewport={"width": 1920, "height": 1080}, locale="en-US")
            page = ctx.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=gd.NAV_TIMEOUT_MS)
            gd._wait_for_cloudflare(page)
            page.wait_for_timeout(1500)
            best_html, best_len = None, 0
            for sel in _GENERIC_SELECTORS:
                loc = page.locator(sel)
                for i in range(min(loc.count(), 5)):
                    el = loc.nth(i)
                    try:
                        n = len(el.inner_text())
                    except Exception:
                        continue
                    # prefer the most specific selector that holds most of the text
                    if n > best_len * 1.5:
                        best_html, best_len = el.inner_html(), n
                if best_html and sel not in ("body",) and best_len > 2000:
                    break
            if not best_html:
                raise RuntimeError("No content found")
        finally:
            browser.close()
    h = html2text.HTML2Text()
    h.body_width = 0
    h.ignore_images = True
    return gd._clean_content(h.handle(best_html))


# Console names a guide may use, keyed by a short platform id. Order matters only for readability;
# each pattern is counted on its own. Patterns avoid overlaps (NES vs Super NES, Game Boy vs Game Boy Color).
PLATFORMS: dict[str, str] = {
    "nes": r"(?<!super )\bnes\b|\bfamicom\b(?! disk)|nintendo entertainment system",
    "snes": r"\bsnes\b|super nintendo|super nes\b|super famicom|\bsfc\b",
    "n64": r"\bn64\b|nintendo 64",
    "gb": r"\bgame ?boy\b(?! ?(colou?r|advance))",
    "gbc": r"game ?boy colou?r|\bgbc\b",
    "gba": r"game ?boy advance|\bgba\b",
    "nds": r"nintendo ds\b|\bnds\b",
    "gamecube": r"gamecube|\bngc\b",
    "wii": r"\bwii\b(?! ?u)",
    "switch": r"nintendo switch",
    "virtualboy": r"virtual boy",
    "genesis": r"genesis|mega ?drive",
    "sms": r"master system|\bsms\b",
    "gamegear": r"game ?gear",
    "segacd": r"sega ?cd|mega[- ]?cd",
    "32x": r"\b32x\b",
    "saturn": r"\bsaturn\b",
    "dreamcast": r"dreamcast",
    "ps1": r"playstation(?! ?[2-5]| portable| vita)|\bpsx\b|\bps1\b|\bpsone\b",
    "ps2": r"playstation ?2|\bps2\b",
    "psp": r"playstation portable|\bpsp\b",
    "pce": r"pc ?engine|turbografx|\btg-?16\b",
    "arcade": r"\barcade\b(?!'? mode)",
    "atari2600": r"atari 2600|\bvcs\b",
    "atari7800": r"atari 7800",
    "lynx": r"\blynx\b",
    "jaguar": r"\bjaguar\b",
    "neogeo": r"neo ?geo",
    "3do": r"\b3do\b",
    "msx": r"\bmsx\b",
    "pc": r"\bms-?dos\b|\bpc version\b|\bsteam (version|release|edition)\b",
    "xbox": r"\bxbox\b",
    "mobile": r"\bios\b|\bandroid\b|iphone",
}

# RetroAchievements console name (01_achievements.json "console") -> platform id
RA_CONSOLE = [
    (r"^snes|super nintendo|super famicom", "snes"),
    (r"^nes|famicom", "nes"),
    (r"nintendo 64", "n64"),
    (r"game boy advance", "gba"),
    (r"game boy color", "gbc"),
    (r"game boy", "gb"),
    (r"nintendo ds", "nds"),
    (r"gamecube", "gamecube"),
    (r"^wii", "wii"),
    (r"virtual boy", "virtualboy"),
    (r"genesis|mega drive", "genesis"),
    (r"master system", "sms"),
    (r"game gear", "gamegear"),
    (r"sega cd", "segacd"),
    (r"32x", "32x"),
    (r"saturn", "saturn"),
    (r"dreamcast", "dreamcast"),
    (r"playstation 2", "ps2"),
    (r"playstation portable", "psp"),
    (r"playstation", "ps1"),
    (r"pc engine|turbografx", "pce"),
    (r"arcade", "arcade"),
    (r"atari 2600", "atari2600"),
    (r"atari 7800", "atari7800"),
    (r"lynx", "lynx"),
    (r"jaguar", "jaguar"),
    (r"neo geo", "neogeo"),
    (r"3do", "3do"),
    (r"msx", "msx"),
]


def ra_platform(game_dir: str) -> str | None:
    p = os.path.join(game_dir, "01_achievements.json")
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8-sig") as fh:
        console = (json.load(fh).get("console") or "").lower()
    for pat, key in RA_CONSOLE:
        if re.search(pat, console):
            return key
    return None


def classify_platform(text: str, target: str | None) -> dict | None:
    """Count console names in a guide and say whether it is for the game's console only.

    same    = names the target console; no other console 3+ times
    multi   = names the target console and also another console 3+ times (multi-version guide)
    other   = names other consoles (3+ mentions) but not the target, or the target only in passing
              (other consoles 5x as often)
    unknown = names no console, or other consoles only once or twice (a passing remark)
    A stray mention or two (a port, Virtual Console, a sequel) does not count: the agent reads the intro.
    """
    if not target:
        return None
    low = text.lower()
    counts = {k: len(re.findall(p, low)) for k, p in PLATFORMS.items()}
    counts = {k: n for k, n in counts.items() if n}
    t = counts.get(target, 0)
    others = {k: n for k, n in counts.items() if k != target}
    other_total = sum(others.values())
    if not t:
        match = "other" if other_total >= 3 else "unknown"
    elif other_total >= 5 * t and other_total >= 5:
        match = "other"
    elif any(n >= 3 for n in others.values()):
        match = "multi"
    else:
        match = "same"
    return {"target": target, "match": match, "counts": dict(sorted(counts.items(), key=lambda kv: -kv[1]))}


def set_decision(manifest_path: str, source_id: str, approve: bool) -> None:
    with open(manifest_path, encoding="utf-8-sig") as fh:
        manifest = json.load(fh)
    entry = next((s for s in manifest if s["id"] == source_id), None)
    if not entry:
        sys.exit(f"ERROR: no source '{source_id}' in {manifest_path}")
    entry["use"] = approve
    entry["decision"] = "user-approved" if approve else "user-declined"
    with open(manifest_path, "w", encoding="utf-8", newline=CRLF) as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"{source_id}: {'used (user-approved)' if approve else 'kept on disk but not used (user-declined)'}. Run rw:chunk next.")


def hold_source(manifest_path: str, source_id: str, match: str) -> None:
    with open(manifest_path, encoding="utf-8-sig") as fh:
        manifest = json.load(fh)
    entry = next((s for s in manifest if s["id"] == source_id), None)
    if not entry:
        sys.exit(f"ERROR: no source '{source_id}' in {manifest_path}")
    plat = entry.get("platform") or {"target": None, "counts": {}}
    plat["match"] = match
    plat["set_by"] = "agent (--hold)"
    entry["platform"] = plat
    entry["use"] = False
    entry.pop("decision", None)
    with open(manifest_path, "w", encoding="utf-8", newline=CRLF) as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"{source_id}: held as {match} (saved, not used). rw:status asks the user.")


def main() -> None:
    ap = argparse.ArgumentParser(description="Collect a full guide into the research folder.")
    ap.add_argument("game_id")
    ap.add_argument("url", nargs="?")
    ap.add_argument("--id", required=True, help="Short source id: gf1, gf2, neo1, wiki1, steam1, raforum1 ...")
    ap.add_argument("--site", help="GameFAQs, Neoseeker, Fandom, StrategyWiki, Steam, RA Forum ...")
    ap.add_argument("--title")
    ap.add_argument("--author")
    ap.add_argument("--image-url", help="Direct raw image URL for map sources")
    ap.add_argument("--kind", default="guide", choices=["guide", "wiki", "forum", "map", "checklist", "other"])
    ap.add_argument("--file", help="Register an already-saved text file instead of downloading")
    ap.add_argument("--append", action="store_true", help="Append a page to an existing source")
    ap.add_argument("--approve", action="store_true", help="The user approved a held guide (other console / multi-version): use it")
    ap.add_argument("--decline", action="store_true", help="The user declined a held guide: keep it on disk, never use it")
    ap.add_argument("--hold", choices=["other", "multi"], help="Hold a saved guide whose intro shows it is for another console or several (the console count missed it)")
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import npm_guard
    npm_guard.check(ap)
    args = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9][a-z0-9\-]{1,40}", args.id):
        ap.error("--id must be short lowercase letters/digits/dashes (e.g. gf1)")

    game_dir = os.path.join(ROOT, "content", "research", args.game_id)
    src_dir = os.path.join(game_dir, "02_sources")
    os.makedirs(src_dir, exist_ok=True)
    manifest_path = os.path.join(src_dir, "sources.json")
    if sum(bool(x) for x in (args.approve, args.decline, args.hold)) > 1:
        ap.error("--approve, --decline and --hold are exclusive")
    if args.approve or args.decline:
        set_decision(manifest_path, args.id, args.approve)
        return
    if args.hold:
        hold_source(manifest_path, args.id, args.hold)
        return
    if not args.url and not args.file:
        ap.error("Provide a URL or --file")
    manifest = []
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8-sig") as fh:
            manifest = json.load(fh)

    existing = next((s for s in manifest if s["id"] == args.id), None)
    if existing and not args.append:
        ap.error(f"Source id '{args.id}' already exists. Use --append for another page or pick a new id.")
    if args.append and not existing:
        ap.error(f"--append given but source '{args.id}' does not exist yet.")

    image_url = args.image_url
    if args.kind == "map":
        origin = args.url or (os.path.abspath(args.file) if args.file else "")
        if not image_url and "gamefaqs.gamespot.com" in origin and "/map/" in origin:
            m_id = re.search(r"/map/(\d+)", origin)
            if m_id:
                image_url = re.sub(r"/map/\d+.*", f"/map/{m_id.group(1)}?raw=1", origin)
        text = f"Map: {args.title}\nAuthor: {args.author or 'Unknown'}\nPage URL: {origin}\nImage URL: {image_url or origin}\n"
    elif args.file:
        with open(args.file, encoding="utf-8-sig", errors="replace") as fh:
            text = fh.read()
        origin = args.url or os.path.abspath(args.file)
    elif "gamefaqs.gamespot.com" in args.url:
        text = fetch_gamefaqs(args.url)
        origin = args.url
    else:
        text = fetch_generic(args.url)
        origin = args.url

    if args.kind != "map" and len(text.strip()) < 500:
        print(f"ERROR: fetched content is suspiciously short ({len(text)} chars). Not saved.", file=sys.stderr)
        sys.exit(1)

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    out_path = os.path.join(src_dir, f"{args.id}.txt")
    if args.append:
        header = f"\n\n{'=' * 60}\nPAGE: {origin}\n{'=' * 60}\n\n"
        with open(out_path, "a", encoding="utf-8", newline=CRLF) as fh:
            fh.write(header + text)
        urls = existing["url"] if isinstance(existing["url"], list) else [existing["url"]]
        if origin not in urls:
            urls.append(origin)
        existing["url"] = urls
        with open(out_path, encoding="utf-8") as fh:
            existing["chars"] = len(fh.read())
    else:
        with open(out_path, "w", encoding="utf-8", newline=CRLF) as fh:
            fh.write(text)
        if not args.site or not args.title:
            ap.error("--site and --title are required for a new source")
        entry = {
            "id": args.id,
            "site": args.site,
            "title": args.title,
            "author": args.author,
            "url": origin,
            "kind": args.kind,
            "file": f"{args.id}.txt",
            "chars": len(text),
            "collected_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        if image_url:
            entry["image_url"] = image_url
        manifest.append(entry)

    # Guides must be for the console the RA set is on. Other-console and multi-version guides are saved
    # but not used (use: false) until the user decides (rw:status asks; --approve / --decline record it).
    held_msg = ""
    if args.kind != "map":
        entry = next(s for s in manifest if s["id"] == args.id)
        with open(out_path, encoding="utf-8") as fh:
            plat = classify_platform(fh.read(), ra_platform(game_dir))
        if plat:
            entry["platform"] = plat
            if plat["match"] in ("other", "multi") and not entry.get("decision"):
                entry["use"] = False
                held_msg = (
                    f"HELD: '{args.id}' looks like a {'multi-version' if plat['match'] == 'multi' else 'other-console'} guide "
                    f"(target {plat['target']}; console mentions {plat['counts']}). Saved but NOT used: rw:status asks the user. "
                    "Read its introduction; if it is really for this console only, say so in your report."
                )
            elif plat["match"] in ("same", "unknown"):
                entry.pop("use", None)

    with open(manifest_path, "w", encoding="utf-8", newline=CRLF) as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"Saved {len(text):,} chars -> {os.path.relpath(out_path, ROOT)} (source '{args.id}')")
    if held_msg:
        print(held_msg)
    elif args.kind != "map" and entry.get("platform"):
        print(f"Console check: {entry['platform']['match']} ({entry['platform']['counts'] or 'no console named'})")
    print(f"Sources registered: {', '.join(s['id'] for s in manifest)}")


if __name__ == "__main__":
    main()
