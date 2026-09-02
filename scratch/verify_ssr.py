import urllib.request
import re

url = 'http://localhost:3001/walkthroughs/253'
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')
    print('Status:', resp.status)
    print('Has referrer meta:', 'referrer' in html and 'no-referrer' in html)
    matches = re.findall(r'<a[^>]+href="https://www\.mariouniverse\.com[^>]+>', html)
    print('Found Mario Universe link tags:', len(matches))
    if matches:
        print('Sample tag:', matches[0])
