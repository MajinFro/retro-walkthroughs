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
    args = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9][a-z0-9\-]{1,40}", args.id):
        ap.error("--id must be short lowercase letters/digits/dashes (e.g. gf1)")
    if not args.url and not args.file:
        ap.error("Provide a URL or --file")

    src_dir = os.path.join(ROOT, "content", "research", args.game_id, "02_sources")
    os.makedirs(src_dir, exist_ok=True)
    manifest_path = os.path.join(src_dir, "sources.json")
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

    with open(manifest_path, "w", encoding="utf-8", newline=CRLF) as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"Saved {len(text):,} chars -> {os.path.relpath(out_path, ROOT)} (source '{args.id}')")
    print(f"Sources registered: {', '.join(s['id'] for s in manifest)}")


if __name__ == "__main__":
    main()
