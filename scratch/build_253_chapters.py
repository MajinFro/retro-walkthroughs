# coding: utf-8
"""
Builder script to generate comprehensive, rich, True 100% walkthrough chapters for Game 253.
"""
import os
import json
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "content", "research", "253", "08_chapters")
os.makedirs(OUT_DIR, exist_ok=True)

# Load verified facts
verified_path = os.path.join(ROOT, "content", "research", "253", "05_verified.json")
with open(verified_path, "r", encoding="utf-8") as f:
    vdata = json.load(f)
fact_map = {f["id"]: f for f in vdata["facts"]}

print(f"Loaded {len(fact_map)} verified facts")
