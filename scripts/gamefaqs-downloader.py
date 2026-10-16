#!/usr/bin/env python3
# coding: utf-8

"""
Download a GameFaqs.com FAQ in printable text format.
Forked from https://forum.omz-software.com/topic/2648/download-plain-text-html-document-and-save-content-as-text
Updated to use the new gamespot domain, remove Pythonista-specific functionality,
and bypass Cloudflare protections.

Dependencies:
    pip install -r requirements.txt
    python -m playwright install chromium

Usage:
    python ./faq-downloader.py <url>
"""

from __future__ import annotations

import argparse
import logging
import os
import re
import sys
import time
from typing import NamedTuple
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import html2text
from playwright.sync_api import Page, sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
RE_URL = re.compile(
    r"^https?://(www\.)?gamefaqs\.gamespot\.com/.+/faqs/[0-9]{3,8}(/[\w-]+)?/?$",
    re.IGNORECASE,
)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# Playwright / retry tunables
NAV_TIMEOUT_MS = 60_000
SELECTOR_TIMEOUT_MS = 15_000
CLOUDFLARE_POLL_INTERVAL = 0.5  # seconds
CLOUDFLARE_MAX_WAIT = 15  # seconds
MAX_RETRIES = 2
MIN_CONTENT_LENGTH = 100

# Lines matching any of these patterns are considered junk and removed.
_JUNK_PATTERNS: list[re.Pattern[str]] = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"Verify you are human",
        r"needs to review the security of your connection",
        r"Enable JavaScript and cookies to continue",
        r"Ray ID:",
        r"Performance & security by",
        r"Waiting for gamefaqs",
        r"Verification successful",
        r"\bCloudflare\b",
        r"This website uses cookies",
        r"We also share information about your use of our site",
        r"\[Privacy Policy\]",
        r"^\s*Just a moment\s*$",
    )
]

# Selectors that indicate Cloudflare is still challenging the visitor.
_CF_CHALLENGE_INDICATORS = (
    "text='Verify you are human'",
    "text='Just a moment'",
    "#challenge-running",
    "#cf-challenge-running",
)

# Content selectors, in priority order.
_CONTENT_SELECTORS = '[id^="faqspan-"], .faqtext, .ffaq, #content, pre'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
class FetchResult(NamedTuple):
    """Holds the fetched content and whether it is raw HTML."""

    content: str
    is_html: bool


class FAQDownloadError(Exception):
    """Raised when the download cannot be completed."""


def _ensure_print_param(url: str) -> str:
    """Return *url* with ``print=1`` in the query string."""
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    if params.get("print") == ["1"]:
        return url
    params["print"] = ["1"]
    new_query = urlencode(params, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


def _validate_url(url: str) -> bool:
    """Return True if *url* matches the expected GameFAQs FAQ pattern."""
    base_url = url.split("?")[0]
    return bool(RE_URL.match(base_url))


def _generate_filename(url: str) -> str:
    """Derive a human-readable ``.txt`` filename from a GameFAQs URL."""
    try:
        parts = urlparse(url).path.strip("/").split("/")
        # Typical path: <console>/<game-name>/faqs/<id>
        if len(parts) >= 2:
            return f"{parts[1]}.txt"
    except Exception:
        pass
    return "gamefaqs_download.txt"


def _clean_content(text: str) -> str:
    """Strip Cloudflare / cookie-notice artefacts from converted text."""
    cleaned: list[str] = []
    prev_was_junk = False

    for line in text.split("\n"):
        if any(pat.search(line) for pat in _JUNK_PATTERNS):
            prev_was_junk = True
            continue

        # Collapse blank lines that directly followed junk lines so we
        # don't leave large vertical gaps where the banners used to be.
        if prev_was_junk and not line.strip():
            continue

        prev_was_junk = False
        cleaned.append(line)

    return "\n".join(cleaned).rstrip()


# ---------------------------------------------------------------------------
# Cloudflare helpers
# ---------------------------------------------------------------------------
def _has_cloudflare_challenge(page: Page) -> bool:
    """Return True if the page is currently showing a Cloudflare challenge."""
    for selector in _CF_CHALLENGE_INDICATORS:
        try:
            if page.locator(selector).count() > 0:
                return True
        except Exception:
            continue
    return False


def _wait_for_cloudflare(page: Page) -> None:
    """Poll until the Cloudflare challenge disappears or we time out."""
    if not _has_cloudflare_challenge(page):
        logger.info("No Cloudflare challenge detected — continuing.")
        return

    logger.info("Cloudflare challenge detected — waiting for it to clear …")
    deadline = time.monotonic() + CLOUDFLARE_MAX_WAIT
    while time.monotonic() < deadline:
        page.wait_for_timeout(int(CLOUDFLARE_POLL_INTERVAL * 1000))
        if not _has_cloudflare_challenge(page):
            logger.info("Cloudflare challenge cleared.")
            return

    logger.warning(
        "Cloudflare challenge did not clear within %d s — proceeding anyway.",
        CLOUDFLARE_MAX_WAIT,
    )


# ---------------------------------------------------------------------------
# Content extraction
# ---------------------------------------------------------------------------
def _extract_content(page: Page) -> FetchResult | None:
    """Try progressively less-specific selectors to pull FAQ content."""

    # 1. [id^="faqspan-"] — print-view splits long FAQs across multiple
    #    sequential <pre> elements: faqspan-1, faqspan-2, …, faqspan-N.
    #    Collect ALL of them and concatenate.
    spans = page.locator('[id^="faqspan-"]')
    span_count = spans.count()
    if span_count > 0:
        logger.info(
            "Found %d faqspan element(s) — extracting and concatenating text.",
            span_count,
        )
        parts: list[str] = []
        for i in range(span_count):
            parts.append(spans.nth(i).inner_text())
        return FetchResult(content="\n".join(parts), is_html=False)

    # 2. .faqtext — may be a <pre> (ASCII) or a rich-HTML guide.
    loc = page.locator(".faqtext").first
    if loc.count() > 0:
        is_pre: bool = loc.evaluate("el => el.tagName === 'PRE'")
        if is_pre:
            logger.info("Found .faqtext (PRE) — extracting text.")
            return FetchResult(content=loc.inner_text(), is_html=False)
        logger.info("Found .faqtext (HTML) — extracting outer HTML.")
        return FetchResult(content=loc.outer_html(), is_html=True)

    # 2b. .ffaq — rich-HTML (multi-page) guides. The print view puts every
    #     page of the guide into one .ffaq block; take the largest.
    blocks = page.locator(".ffaq").all()
    if blocks:
        best = max(blocks, key=lambda el: len(el.inner_text()))
        if len(best.inner_text().strip()) >= 500:
            logger.info("Found %d .ffaq block(s) (HTML guide) — extracting the largest.", len(blocks))
            return FetchResult(content=best.inner_html(), is_html=True)

    # 3. Largest <pre> on the page.
    pres = page.locator("pre").all()
    if pres:
        logger.info("Found %d <pre> tag(s) — extracting the largest.", len(pres))
        best = max(pres, key=lambda el: len(el.inner_text()))
        text = best.inner_text()
        if len(text.strip()) >= MIN_CONTENT_LENGTH:
            return FetchResult(content=text, is_html=False)

    # 4. Full-page fallback.
    full = page.content()
    if len(full.strip()) >= MIN_CONTENT_LENGTH:
        logger.info("Using full-page HTML as fallback.")
        return FetchResult(content=full, is_html=True)

    return None


# ---------------------------------------------------------------------------
# Main downloader class
# ---------------------------------------------------------------------------
class FAQDownloader:
    """Download and save a single GameFAQs guide as a plain-text file."""

    def __init__(self, url: str = None, search: str = None, output_dir: str = ".") -> None:
        self.url = None
        self.search_query = search
        if url:
            if not _validate_url(url) and "/faqs" not in url:
                # Accept base game URLs too
                pass
            self.url = _ensure_print_param(url) if "/faqs/" in url else url
        self.output_dir = os.path.expanduser(output_dir)

    # ---- public API -------------------------------------------------------

    def fetch_and_save(self) -> str:
        """Fetch the FAQ, convert it to text, and write it to disk.

        Returns the path of the saved file.

        Raises ``FAQDownloadError`` on failure.
        """
        result = self._fetch_with_retries()

        # Convert HTML → plain text when necessary.
        if result.is_html:
            h = html2text.HTML2Text()
            h.body_width = 0  # preserve wide ASCII art
            text = h.handle(result.content)
        else:
            text = result.content

        text = _clean_content(text)

        filename = _generate_filename(self.url)
        filepath = os.path.join(self.output_dir, filename)

        try:
            os.makedirs(self.output_dir, exist_ok=True)
            with open(filepath, "w", encoding="utf-8") as fh:
                fh.write(text)
        except OSError as exc:
            raise FAQDownloadError(f"Failed to write {filepath}: {exc}") from exc

        logger.info('Success!  Saved to "%s"', filepath)
        return filepath

    # ---- private ----------------------------------------------------------

    def _fetch_with_retries(self) -> FetchResult:
        """Try up to *MAX_RETRIES* times to fetch content via Playwright."""
        last_err: Exception | None = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return self._fetch_content_playwright()
            except FAQDownloadError as exc:
                last_err = exc
                if attempt < MAX_RETRIES:
                    wait = 2 ** attempt
                    logger.warning(
                        "Attempt %d/%d failed (%s).  Retrying in %d s …",
                        attempt,
                        MAX_RETRIES,
                        exc,
                        wait,
                    )
                    time.sleep(wait)
        raise FAQDownloadError(
            f"All {MAX_RETRIES} attempt(s) failed."
        ) from last_err

    def _fetch_content_playwright(self) -> FetchResult:
        """Launch a headless browser, navigate, and extract content.

        Raises ``FAQDownloadError`` if content cannot be retrieved.
        """
        logger.info("Navigating to %s …", self.url)

        with sync_playwright() as pw:
            launch_args = [
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
            ]
            try:
                sys.path.insert(0, os.path.join(os.path.dirname(__file__), "pipeline"))
                import dns_helper
                launch_args = dns_helper.get_chromium_args()
            except Exception:
                pass

            browser = pw.chromium.launch(
                headless=True,
                args=launch_args,
            )
            try:
                context = browser.new_context(
                    user_agent=USER_AGENT,
                    viewport={"width": 1920, "height": 1080},
                    locale="en-US",
                    timezone_id="America/New_York",
                )
                # Stealth tweaks to avoid bot-detection fingerprints.
                context.add_init_script(
                    """
                    Object.defineProperty(navigator, 'webdriver',
                        { get: () => undefined });
                    Object.defineProperty(navigator, 'plugins',
                        { get: () => [1, 2, 3, 4, 5] });
                    Object.defineProperty(navigator, 'languages',
                        { get: () => ['en-US', 'en'] });
                    window.chrome = { runtime: {} };
                    """
                )

                page = context.new_page()
                
                # --- AUTO DISCOVERY LOGIC ---
                target_url = self.url
                if self.search_query:
                    try:
                        from googlesearch import search as gsearch
                        logger.info("Searching Google for: %s site:gamefaqs.gamespot.com", self.search_query)
                        
                        first_link = None
                        for r in gsearch(f"{self.search_query} site:gamefaqs.gamespot.com", num_results=5):
                            if "gamefaqs.gamespot.com" in r and ("/faqs" in r or re.search(r'/\d+-[^/]+$', r)):
                                first_link = r
                                break
                        
                        if not first_link:
                            raise FAQDownloadError("Could not find any search results for the game.")
                            
                        # Ensure we get the /faqs base URL
                        if "/faqs/" in first_link:
                            target_url = first_link.split("/faqs/")[0] + "/faqs"
                        elif "/faqs" in first_link:
                            target_url = first_link
                        else:
                            target_url = first_link.rstrip("/") + "/faqs"
                            
                        logger.info("Found base game URL: %s", target_url)
                    except Exception as e:
                        raise FAQDownloadError(f"Search failed: {e}")
                
                # If target_url is a base URL (no specific guide ID), find the best text guide
                if not re.search(r'/faqs/\d+(/[\w-]+)?/?$', target_url.split('?')[0]):
                    if not target_url.endswith("/faqs"):
                        target_url = target_url.rstrip("/") + "/faqs"
                    logger.info("Navigating to FAQ list: %s", target_url)
                    page.goto(target_url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
                    _wait_for_cloudflare(page)
                    
                    # Run JS to find the best text guide in "Full Game Guides"
                    best_guide_href = page.evaluate('''() => {
                        let bestHref = null;
                        let maxSize = -1;
                        
                        // Find Full Game Guides header
                        const headers = Array.from(document.querySelectorAll('h2, h3'));
                        const fullGuidesHeader = headers.find(h => h.textContent.includes('Full Game Guides'));
                        if (!fullGuidesHeader) return null;
                        
                        // Find the next list of guides
                        let next = fullGuidesHeader.nextElementSibling;
                        while (next && next.tagName !== 'OL' && next.tagName !== 'DIV') {
                            next = next.nextElementSibling;
                        }
                        
                        // If not found, check the parent's siblings (handles <div class="head"> wrappers)
                        if (!next && fullGuidesHeader.parentElement) {
                            next = fullGuidesHeader.parentElement.nextElementSibling;
                            while (next && next.tagName !== 'OL' && next.tagName !== 'DIV') {
                                next = next.nextElementSibling;
                            }
                        }
                        
                        if (!next) return null;
                        
                        const items = next.querySelectorAll('li');
                        items.forEach(li => {
                            const link = li.querySelector('a');
                            const meta = li.querySelector('.meta');
                            if (!link || !meta) return;
                            
                            // Check for HTML badge (we want text guides)
                            if (meta.textContent.includes('HTML')) return;
                            
                            // Check for KB size
                            const match = meta.textContent.match(/(\\d+)\\s*[Kk][Bb]/);
                            if (match) {
                                const size = parseInt(match[1], 10);
                                // Prioritize guides that are marked complete (full star or "Complete")
                                const isComplete = meta.innerHTML.includes('star_full') || meta.textContent.includes('Complete');
                                const weight = isComplete ? size * 10 : size;
                                
                                if (weight > maxSize) {
                                    maxSize = weight;
                                    bestHref = link.getAttribute('href');
                                }
                            }
                        });
                        
                        return bestHref;
                    }''')
                    
                    if not best_guide_href:
                        raise FAQDownloadError("Could not find any classic text guides in the Full Game Guides section.")
                        
                    target_url = f"https://gamefaqs.gamespot.com{best_guide_href}"
                    logger.info("Auto-selected best guide: %s", target_url)
                    
                target_url = _ensure_print_param(target_url)
                # --- END AUTO DISCOVERY LOGIC ---

                logger.info("Navigating to guide %s …", target_url)
                try:
                    page.goto(
                        target_url,
                        wait_until="domcontentloaded",
                        timeout=NAV_TIMEOUT_MS,
                    )
                except PlaywrightTimeoutError as exc:
                    raise FAQDownloadError(
                        f"Navigation timed out after {NAV_TIMEOUT_MS} ms"
                    ) from exc

                _wait_for_cloudflare(page)

                # Wait for a known content selector to appear.
                logger.info("Waiting for content selector …")
                try:
                    page.wait_for_selector(
                        _CONTENT_SELECTORS, timeout=SELECTOR_TIMEOUT_MS
                    )
                except PlaywrightTimeoutError:
                    logger.warning(
                        "Timed out waiting for content selectors — "
                        "will attempt extraction anyway."
                    )

                result = _extract_content(page)
                if result is None or len(result.content.strip()) < MIN_CONTENT_LENGTH:
                    raise FAQDownloadError(
                        "Extracted content was empty or too short."
                    )
                return result
            except FAQDownloadError:
                raise
            except Exception as exc:
                raise FAQDownloadError(
                    f"Playwright error: {exc}"
                ) from exc
            finally:
                browser.close()


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download GameFAQs guides as text files.",
    )
    parser.add_argument("url", nargs="?", help="The URL of the FAQ to download (optional if --search is provided)")
    parser.add_argument(
        "--search",
        help="Search query to automatically find the best guide (e.g. 'Lufia SNES')",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=".",
        help="Output directory (default: current directory)",
    )
    args = parser.parse_args()

    if not args.url and not args.search:
        parser.error("You must provide either a URL or a --search query.")

    try:
        downloader = FAQDownloader(url=args.url, search=args.search, output_dir=args.output)
        downloader.fetch_and_save()
    except FAQDownloadError as exc:
        logger.error("%s", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()
