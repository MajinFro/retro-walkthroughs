# coding: utf-8
"""
Embeds visual map links into chapters 01..08 of Game 253.
"""
import os
import sys
import re
import json
import subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CH_DIR = os.path.join(ROOT, "content", "research", "253", "08_chapters")
SOURCES_JSON = os.path.join(ROOT, "content", "research", "253", "02_sources", "sources.json")

with open(SOURCES_JSON, "r", encoding="utf-8") as f:
    sources = json.load(f)

map_sources = {s["id"]: s for s in sources if s.get("kind") == "map"}
print(f"Loaded {len(map_sources)} map sources")

def make_link(mid):
    if mid not in map_sources:
        print(f"WARNING: {mid} not in map_sources")
        return ""
    s = map_sources[mid]
    title = s["title"]
    url = s["url"]
    fact_id = f"{mid}-1-1"
    return f"- 🗺️ **Visual Level Map:** [{title}]({url}) [[{fact_id}]]"

def embed_in_section(content, heading, map_ids):
    links = "\n".join(make_link(m) for m in map_ids if m in map_sources)
    if not links:
        return content
    # Replace heading with heading + links
    target = f"{heading}\n"
    if target in content:
        return content.replace(target, f"{heading}\n\n{links}\n")
    return content

# Chapter 1
def update_ch1():
    p = os.path.join(CH_DIR, "01.md")
    txt = open(p, encoding="utf-8").read()
    for w in range(1, 9):
        heading = f"## SMB1 World {w} ("
        mids = [f"map-smb-{w}-{s}" for s in range(1, 5)]
        # find matching heading line
        for line in txt.split("\n"):
            if line.startswith(heading):
                txt = embed_in_section(txt, line.strip(), mids)
                break
    txt = txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(txt)
    print("Embedded maps in 01.md")

# Chapter 2
def update_ch2():
    p = os.path.join(CH_DIR, "02.md")
    txt = open(p, encoding="utf-8").read()
    for w in range(1, 9):
        heading = f"## SMB1 Star World {w} ("
        mids = [f"map-smb-{w}-{s}" for s in range(1, 5)]
        for line in txt.split("\n"):
            if line.startswith(heading):
                txt = embed_in_section(txt, line.strip(), mids)
                break
    txt = txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(txt)
    print("Embedded maps in 02.md")

# Chapter 3
def update_ch3():
    p = os.path.join(CH_DIR, "03.md")
    txt = open(p, encoding="utf-8").read()
    for w in range(1, 9):
        heading = f"## SMBTLL World {w} ("
        mids = [f"map-smbll-{w}-{s}" for s in range(1, 5)]
        for line in txt.split("\n"):
            if line.startswith(heading):
                txt = embed_in_section(txt, line.strip(), mids)
                break
    txt = txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(txt)
    print("Embedded maps in 03.md")

# Chapter 4
def update_ch4():
    p = os.path.join(CH_DIR, "04.md")
    txt = open(p, encoding="utf-8").read()
    # World 9
    mids_9 = [f"map-smbll-9-{s}" for s in range(1, 5)]
    txt = embed_in_section(txt, "## SMBTLL World 9 (Fantasy World)", mids_9)
    # Worlds A-D
    for let in ["a", "b", "c", "d"]:
        heading = f"## SMBTLL World {let.upper()} ("
        mids = [f"map-smbll-{let}-{s}" for s in range(1, 5)]
        for line in txt.split("\n"):
            if line.startswith(heading):
                txt = embed_in_section(txt, line.strip(), mids)
                break
    txt = txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(txt)
    print("Embedded maps in 04.md")

# Chapter 5
def update_ch5():
    p = os.path.join(CH_DIR, "05.md")
    txt = open(p, encoding="utf-8").read()
    for w in range(1, 8):
        heading = f"## SMB2 World {w} ("
        stages = [1, 2, 3] if w < 7 else [1, 2]
        mids = [f"map-smb2-{w}-{s}" for s in stages]
        for line in txt.split("\n"):
            if line.startswith(heading):
                txt = embed_in_section(txt, line.strip(), mids)
                break
    txt = txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(txt)
    print("Embedded maps in 05.md")

# Chapter 6
def update_ch6():
    p = os.path.join(CH_DIR, "06.md")
    txt = open(p, encoding="utf-8").read()
    speedrun_maps = ["map-smb2-1-3", "map-smb2-4-2", "map-smb2-6-3", "map-smb2-7-2"]
    txt = embed_in_section(txt, "## SMB2 Speedrun Route (Vase Warps)", speedrun_maps)
    txt = txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(txt)
    print("Embedded maps in 06.md")

# Chapter 7
def update_ch7():
    p = os.path.join(CH_DIR, "07.md")
    txt = open(p, encoding="utf-8").read()
    w1_maps = [f"map-smb3-1-{s}" for s in range(1, 7)] + ["map-smb3-1-fortress", "map-smb3-1-airship"]
    txt = embed_in_section(txt, "## SMB3 World 1 (Grass Land)", w1_maps)
    w2_maps = [f"map-smb3-2-{s}" for s in range(1, 6)] + ["map-smb3-2-fortress", "map-smb3-2-pyramid", "map-smb3-2-airship", "map-smb3-treasure-ship"]
    txt = embed_in_section(txt, "## SMB3 World 2 (Desert Hill)", w2_maps)
    w3_maps = [f"map-smb3-3-{s}" for s in range(1, 10)] + ["map-smb3-3-fortress1", "map-smb3-3-fortress2", "map-smb3-3-airship"]
    txt = embed_in_section(txt, "## SMB3 World 3 (Sea Side)", w3_maps)
    w9_maps = ["map-smb3-warpzone"]
    txt = embed_in_section(txt, "## SMB3 World 9 (Warp Zone Island) & Speedrun Route", w9_maps)
    txt = txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(txt)
    print("Embedded maps in 07.md")

# Chapter 8
def update_ch8():
    p = os.path.join(CH_DIR, "08.md")
    txt = open(p, encoding="utf-8").read()
    w4_maps = [f"map-smb3-4-{s}" for s in range(1, 7)] + ["map-smb3-4-fortress1", "map-smb3-4-fortress2", "map-smb3-4-airship"]
    txt = embed_in_section(txt, "## SMB3 World 4 (Big Island)", w4_maps)
    w5_maps = [f"map-smb3-5-{s}" for s in range(1, 10)] + ["map-smb3-5-tower", "map-smb3-5-fortress1", "map-smb3-5-fortress2", "map-smb3-5-airship"]
    txt = embed_in_section(txt, "## SMB3 World 5 (The Sky)", w5_maps)
    w6_maps = [f"map-smb3-6-{s}" for s in range(1, 11)] + ["map-smb3-6-fortress1", "map-smb3-6-fortress2", "map-smb3-6-fortress3", "map-smb3-6-airship"]
    txt = embed_in_section(txt, "## SMB3 World 6 (Iced Land)", w6_maps)
    w7_maps = [f"map-smb3-7-{s}" for s in range(1, 10)] + ["map-smb3-7-plant1", "map-smb3-7-plant2", "map-smb3-7-fortress1", "map-smb3-7-fortress2", "map-smb3-7-airship"]
    txt = embed_in_section(txt, "## SMB3 World 7 (Pipe Maze)", w7_maps)
    w8_maps = ["map-smb3-8-tank1", "map-smb3-8-navy", "map-smb3-8-hand1", "map-smb3-8-hand2", "map-smb3-8-hand3", "map-smb3-8-air", "map-smb3-8-1", "map-smb3-8-2", "map-smb3-8-tank2", "map-smb3-8-fortress", "map-smb3-8-bowserscastle"]
    txt = embed_in_section(txt, "## SMB3 World 8 (Castle of Koopa) & Final Confrontation", w8_maps)
    txt = txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(txt)
    print("Embedded maps in 08.md")

# First, restore fresh chapter files from our make scripts so we don't duplicate
import subprocess
for s in ["scratch/make_ch1.py", "scratch/make_ch2.py", "scratch/make_ch3.py", "scratch/make_ch4.py", "scratch/make_ch5.py", "scratch/make_ch6.py", "scratch/make_ch7.py", "scratch/make_ch8.py", "scratch/fix_all_chapters.py"]:
    subprocess.run([sys.executable, s], check=True)

update_ch1()
update_ch2()
update_ch3()
update_ch4()
update_ch5()
update_ch6()
update_ch7()
update_ch8()

print("All chapters updated with visual map links!")
