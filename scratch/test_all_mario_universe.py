import urllib.request
import re

sections = [
    ("smb", "https://www.mariouniverse.com/maps-snes-smb/"),
    ("smbll", "https://www.mariouniverse.com/maps-snes-smbll/"),
    ("smb2", "https://www.mariouniverse.com/maps-snes-smb2/"),
    ("smb3", "https://www.mariouniverse.com/maps-snes-smb3/"),
]

for name, url in sections:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode("utf-8")
            maps = re.findall(r'href=["\'](https://www.mariouniverse.com/wp-content/img/maps/snes/[^"\']+\.png)["\']', html)
            print(f"{name.upper()}: {len(maps)} maps found on {url}")
            for m in maps[:3]:
                print(f"  {m}")
    except Exception as e:
        print(f"Error on {name}: {e}")
