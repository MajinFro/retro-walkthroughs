import urllib.request
import re
from urllib.parse import quote_plus

def search_mariouniverse(query: str):
    if "mario" not in query.lower():
        return []
    url = "https://www.mariouniverse.com/maps/snes/"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    results = []
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8")
            links = re.findall(r'href=["\'](https://www.mariouniverse.com/maps-snes-[^"\']+)["\']', html)
            for l in sorted(set(links)):
                results.append({"site": "Mario Universe", "url": l, "kind": "map_archive"})
    except Exception as e:
        pass
    return results

def search_vgmaps(query: str):
    # VGMaps uses simple anchor indices or site search
    url = f"https://www.vgmaps.com/Atlas/SuperNES/index.htm"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    results = []
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            # find games
            clean_q = re.sub(r'[^a-z0-9]', '', query.lower())
            for m in re.finditer(r'<a href=["\']([^"\']+)["\'][^>]*>([^<]+)</a>', html, re.I):
                href, title = m.group(1), m.group(2)
                clean_t = re.sub(r'[^a-z0-9]', '', title.lower())
                if clean_q in clean_t or any(word in clean_t for word in query.lower().split() if len(word) > 4):
                    full_url = f"https://www.vgmaps.com/Atlas/SuperNES/{href}"
                    results.append({"site": "VGMaps", "title": title, "url": full_url, "kind": "map_archive"})
    except Exception as e:
        pass
    return results

print("MU:", search_mariouniverse("Super Mario All-Stars"))
print("VGMaps:", search_vgmaps("Super Mario All-Stars")[:5])
