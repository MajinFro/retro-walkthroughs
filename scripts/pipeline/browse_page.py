#!/usr/bin/env python3
# coding: utf-8
"""
Headless-browser page reader for source discovery on any site.

Many guide and map sites (VGMaps, StrategyWiki, Mario Universe, Fandom, Neoseeker ...)
block AI fetch tools but not a real browser. This prints a page's text and/or links
through headless Chrome so the agent can find guide, map, and checklist URLs.
It never saves anything: download the chosen pages with rw:collect.

Usage:
    python scripts/pipeline/browse_page.py "<url>"                     # page text
    python scripts/pipeline/browse_page.py "<url>" --links             # links (text -> url)
    python scripts/pipeline/browse_page.py "<url>" --links --grep map  # links matching a regex
    python scripts/pipeline/browse_page.py "<url>" --max 20000         # longer text output
"""
from __future__ import annotations

import argparse
import importlib.util
import os
import re
import sys
from urllib.parse import urljoin

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "scripts", "pipeline"))


def _load_downloader():
    """Import scripts/gamefaqs-downloader.py (hyphenated filename) for shared browser settings."""
    p = os.path.join(ROOT, "scripts", "gamefaqs-downloader.py")
    spec = importlib.util.spec_from_file_location("gamefaqs_downloader", p)
    mod = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(mod)
    return mod


def browse(url: str) -> tuple[str, list[tuple[str, str]]]:
    import html2text
    from playwright.sync_api import sync_playwright

    from dns_helper import get_chromium_args

    gd = _load_downloader()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=get_chromium_args())
        try:
            ctx = browser.new_context(user_agent=gd.USER_AGENT, viewport={"width": 1920, "height": 1080}, locale="en-US")
            page = ctx.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=gd.NAV_TIMEOUT_MS)
            gd._wait_for_cloudflare(page)
            page.wait_for_timeout(1500)
            html = page.content()
            links = page.eval_on_selector_all(
                "a[href]", "els => els.map(e => [e.innerText.trim().replace(/\\s+/g, ' '), e.getAttribute('href')])"
            )
        finally:
            browser.close()
    h = html2text.HTML2Text()
    h.body_width = 0
    h.ignore_images = True
    h.ignore_links = True
    text = re.sub(r"\n{3,}", "\n\n", h.handle(html)).strip()
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for label, href in links:
        if not href or href.startswith(("#", "javascript:", "mailto:")):
            continue
        absolute = urljoin(url, href)
        if absolute not in seen:
            seen.add(absolute)
            out.append((label, absolute))
    return text, out


def main() -> None:
    ap = argparse.ArgumentParser(description="Read any page through headless Chrome (discovery only, nothing is saved).")
    ap.add_argument("url")
    ap.add_argument("--links", action="store_true", help="List the page's links instead of its text")
    ap.add_argument("--grep", help="Case-insensitive regex; keep only matching links (or text lines)")
    ap.add_argument("--max", type=int, default=8000, help="Max characters of text to print (default 8000)")
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import npm_guard
    npm_guard.check(ap)
    args = ap.parse_args()

    text, links = browse(args.url)
    pat = re.compile(args.grep, re.I) if args.grep else None
    if args.links:
        rows = [(t, u) for t, u in links if not pat or pat.search(t) or pat.search(u)]
        for t, u in rows:
            print(f"{t or '(no text)'} -> {u}")
        print(f"\n{len(rows)} link(s)", file=sys.stderr)
    else:
        if pat:
            text = "\n".join(line for line in text.splitlines() if pat.search(line))
        print(text[: args.max])
        if len(text) > args.max:
            print(f"\n[... truncated: {len(text):,} chars total, use --max to see more]", file=sys.stderr)


if __name__ == "__main__":
    main()
