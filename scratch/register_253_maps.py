# coding: utf-8
"""
Scrapes and registers all Mario Universe visual level maps for Game 253 (Super Mario All-Stars).
"""
import os
import sys
import json
import re
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SOURCES_JSON = os.path.join(ROOT, "content", "research", "253", "02_sources", "sources.json")
SOURCES_DIR = os.path.join(ROOT, "content", "research", "253", "02_sources")

sections = [
    ("smb", "Super Mario Bros.", "https://www.mariouniverse.com/maps-snes-smb/"),
    ("smbll", "The Lost Levels", "https://www.mariouniverse.com/maps-snes-smbll/"),
    ("smb2", "Super Mario Bros. 2", "https://www.mariouniverse.com/maps-snes-smb2/"),
    ("smb3", "Super Mario Bros. 3", "https://www.mariouniverse.com/maps-snes-smb3/"),
]

all_maps = []
for code, game_name, url in sections:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8")
            # Find links ending with .png
            found = re.findall(r'href=["\'](https://www.mariouniverse.com/wp-content/img/maps/snes/[^"\']+/([^"\'/]+)\.png)["\']', html)
            seen = set()
            for full_url, fname in found:
                if full_url in seen:
                    continue
                seen.add(full_url)
                # Build human readable stage name from fname
                stage_name = fname.replace("-", " ").title()
                mid = f"map-{code}-{fname}".lower()
                # Ensure mid conforms to [a-z0-9\-]{1,40}
                mid = re.sub(r'[^a-z0-9\-]', '', mid)[:38]
                title = f"{game_name} {stage_name} Map"
                all_maps.append({
                    "id": mid,
                    "game": game_name,
                    "stage": stage_name,
                    "title": title,
                    "url": full_url,
                    "author": "Mario Universe",
                    "file": f"{mid}.txt"
                })
    except Exception as e:
        print(f"Error fetching {url}: {e}")

print(f"Total maps collected from Mario Universe: {len(all_maps)}")

# Load existing sources.json
with open(SOURCES_JSON, "r", encoding="utf-8") as f:
    existing_sources = json.load(f)

# Filter out existing map sources from sources.json to avoid duplicates
existing_sources = [s for s in existing_sources if s.get("kind") != "map"]

for m in all_maps:
    txt_path = os.path.join(SOURCES_DIR, m["file"])
    content = f"Map: {m['title']}\r\nURL: {m['url']}\r\nAuthor: {m['author']}\r\nSite: Mario Universe\r\n"
    with open(txt_path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(content)
    
    existing_sources.append({
        "id": m["id"],
        "site": "Mario Universe",
        "title": m["title"],
        "author": m["author"],
        "url": m["url"],
        "image_url": m["url"],
        "kind": "map",
        "file": m["file"],
        "chars": len(content),
        "collected_at": "2026-10-15T21:40:00Z"
    })

# Write updated sources.json
with open(SOURCES_JSON, "w", encoding="utf-8", newline="\r\n") as f:
    json.dump(existing_sources, f, indent=2)

print(f"Successfully registered {len(all_maps)} map sources in sources.json!")
