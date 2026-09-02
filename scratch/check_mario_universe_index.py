import urllib.request
import re

url = "https://www.mariouniverse.com/maps/snes/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8")
        links = re.findall(r'href=["\'](https://www.mariouniverse.com/maps-snes-[^"\']+)["\']', html)
        print("Found SNES map sections:")
        for l in sorted(set(links)):
            print(" ", l)
except Exception as e:
    print("Error:", e)
