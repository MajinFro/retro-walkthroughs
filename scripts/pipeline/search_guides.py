#!/usr/bin/env python3
# coding: utf-8
"""
Permanent Guide Discovery Tool.
Searches GameFAQs and lists all available guides, authors, sizes, and formats.

Usage:
    python scripts/pipeline/search_guides.py "Princess Tomato in the Salad Kingdom"
    python scripts/pipeline/search_guides.py --url "https://gamefaqs.gamespot.com/nes/587528-princess-tomato-in-the-salad-kingdom/faqs"
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import sys
from urllib.parse import quote_plus

from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "scripts", "pipeline"))
import dns_helper

GAME_PAGE = re.compile(r"^(https://gamefaqs\.gamespot\.com/[a-z0-9-]+/\d+-[a-z0-9-]+)(?:/faqs)?/?(?:[?#].*)?$")

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


def search_gamefaqs(query: str) -> list[dict[str, str]]:
    """Search GameFAQs for game titles and return matching FAQ listing URLs."""
    url = f"https://gamefaqs.gamespot.com/search?game={quote_plus(query)}"
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=dns_helper.get_chromium_args())
        ctx = browser.new_context(user_agent=USER_AGENT)
        page = ctx.new_page()
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(2000)
            items = page.evaluate('''() => {
                const out = [];
                document.querySelectorAll('a').forEach(a => {
                    const href = a.getAttribute('href') || '';
                    const text = a.textContent.trim().replace(/\\s+/g, ' ');
                    if (href.includes('/faqs') || (href.split('/').length >= 4 && !href.includes('/search') && !href.includes('/user/'))) {
                        out.push({ href: href, title: text });
                    }
                });
                return out;
            }''')
            seen = set()
            for item in items:
                href = item["href"]
                if not href.startswith("http"):
                    href = f"https://gamefaqs.gamespot.com{href}"
                # Only game pages (/<platform>/<id>-<slug>), not site links such as /sitemap or /careers.
                m = GAME_PAGE.match(href)
                if not m:
                    continue
                href = m.group(1) + "/faqs"
                if href not in seen and item["title"]:
                    seen.add(href)
                    results.append({"title": item["title"], "url": href})
        finally:
            browser.close()
    return results


def list_faqs(faqs_url: str) -> list[dict[str, str]]:
    """Extract all guides from a GameFAQs /faqs page."""
    if not faqs_url.endswith("/faqs"):
        faqs_url = faqs_url.rstrip("/") + "/faqs"

    guides = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=dns_helper.get_chromium_args())
        ctx = browser.new_context(user_agent=USER_AGENT)
        page = ctx.new_page()
        try:
            page.goto(faqs_url, wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(2500)
            items = page.evaluate('''() => {
                const out = [];
                document.querySelectorAll('li').forEach(li => {
                    const a = li.querySelector('a[href*="/faqs/"], a[href*="/map/"]');
                    if (!a) return;
                    const href = a.getAttribute('href') || '';
                    const meta = li.querySelector('.meta');
                    const metaText = meta ? meta.textContent.trim().replace(/\\s+/g, ' ') : '';
                    const author = li.querySelector('.link_color')?.textContent.trim() || '';
                    let size = '';
                    const sizeMatch = metaText.match(/(\\d+K|\\d+M|\\d+KB|\\d+MB)/i);
                    if (sizeMatch) size = sizeMatch[1];
                    const isComplete = li.innerHTML.includes('star_full') || metaText.includes('Complete');
                    const kind = href.includes('/map/') ? 'map' : 'guide';
                    out.push({
                        title: a.textContent.trim().replace(/\\s+/g, ' '),
                        href: href,
                        meta: metaText,
                        author: author,
                        size: size,
                        kind: kind,
                        complete: isComplete
                    });
                });
                return out;
            }''')
        finally:
            browser.close()

    formatted = []
    seen = set()
    for g in items:
        href = g["href"]
        if not href.startswith("http"):
            href = f"https://gamefaqs.gamespot.com{href}"
        if href in seen:
            continue
        seen.add(href)
        formatted.append({
            "title": g["title"],
            "url": href,
            "size": g.get("size", ""),
            "author": g.get("author", ""),
            "kind": g.get("kind", "guide"),
            "complete": g.get("complete", False),
            "meta": g.get("meta", ""),
        })
    return formatted


def main() -> None:
    parser = argparse.ArgumentParser(description="Search and discover GameFAQs guides.")
    parser.add_argument("query", nargs="?", help="Game title to search for")
    parser.add_argument("--url", help="Direct GameFAQs game /faqs URL")
    parser.add_argument("--json", action="store_true", help="Output results in JSON")
    import npm_guard
    npm_guard.check(parser)
    args = parser.parse_args()

    if args.url:
        print(f"Inspecting guides and maps from {args.url} ...")
        items = list_faqs(args.url)
        if args.json:
            print(json.dumps(items, indent=2))
        else:
            guides = [x for x in items if x["kind"] == "guide"]
            maps = [x for x in items if x["kind"] == "map"]
            print(f"\nFound {len(guides)} guide(s) and {len(maps)} map(s):\n")
            if guides:
                print(f"{'#':<3} | {'Type':<7} | {'Title':<35} | {'Author':<15} | {'Size':<6} | {'URL'}")
                print("-" * 110)
                for i, f in enumerate(guides, 1):
                    auth = f.get('author', '')[:15]
                    print(f"{i:<3} | {'GUIDE':<7} | {f['title'][:35]:<35} | {auth:<15} | {f['size']:<6} | {f['url']}")
            if maps:
                print(f"\n{'#':<3} | {'Type':<7} | {'Map Title':<35} | {'Author':<15} | {'URL'}")
                print("-" * 110)
                for i, m in enumerate(maps, 1):
                    auth = m.get('author', '')[:15]
                    print(f"{i:<3} | {'MAP':<7} | {m['title'][:35]:<35} | {auth:<15} | {m['url']}")
        return

    if not args.query:
        parser.print_help()
        sys.exit(1)

    print(f"Searching GameFAQs for: '{args.query}' ...")
    games = search_gamefaqs(args.query)
    if not games:
        # GameFAQs' search returns an empty page to headless browsers (checked 2026-10-17),
        # so this usually means "search unavailable", not "no such game".
        print(
            "No GameFAQs game pages found. GameFAQs search often shows nothing to a headless browser.\n"
            "Find the game's page with your web search tool (e.g. 'site:gamefaqs.gamespot.com <title> <platform>'),\n"
            "then list its guides and maps with:  npm run rw:find-guides -- --url \"https://gamefaqs.gamespot.com/<platform>/<id>-<slug>/faqs\""
        )
        sys.exit(2)

    if args.json:
        print(json.dumps(games, indent=2))
    else:
        print(f"\nFound {len(games)} matching game(s):\n")
        for i, g in enumerate(games[:10], 1):
            print(f"{i}. {g['title']}")
            print(f"   FAQs: {g['url']}\n")


if __name__ == "__main__":
    main()
