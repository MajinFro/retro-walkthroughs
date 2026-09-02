import urllib.request
import re

url = "https://www.mariouniverse.com/maps-snes-smb/"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8")
        print("HTML length:", len(html))
        # Find all image links or map links
        links = re.findall(r'href=["\']([^"\']+\.(?:png|jpg|gif))["\']', html, re.I)
        print("Image links:", len(links))
        for l in links[:30]:
            print(" ", l)
except Exception as e:
    print("Error:", e)
