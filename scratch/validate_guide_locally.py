# coding: utf-8
import os
import re
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
vdata = json.load(open(os.path.join(ROOT, "content", "research", "253", "05_verified.json"), encoding="utf-8"))
fact_map = {f["id"]: f for f in vdata["facts"]}

CITE_RE = re.compile(r"\[\[([a-z0-9\-,\s]+)\]\]")

def key_terms(text):
    clean = re.sub(r"\[\[[^\]]+\]\]", "", text)
    return set(re.findall(r"[a-z]{3,}", clean.lower()))

def fact_terms(fact):
    blob = f"{fact.get('subject','')} {fact.get('predicate','')} {fact.get('object','') or ''} {fact.get('text','')}"
    return set(re.findall(r"[a-z]{3,}", blob.lower()))

ch_dir = os.path.join(ROOT, "content", "research", "253", "08_chapters")
for fname in sorted(os.listdir(ch_dir)):
    if not fname.endswith(".md"): continue
    txt = open(os.path.join(ch_dir, fname), encoding="utf-8").read()
    paras = txt.split("\n\n")
    for idx, p in enumerate(paras):
        p = p.strip()
        if not p or p.startswith("#") or p.startswith("[ACHIEVEMENT:") or p == "[MERMAID]" or p.startswith("> [!"):
            continue
        cites = [c.strip() for m in CITE_RE.finditer(p) for c in m.group(1).split(",")]
        p_terms = key_terms(p)
        if not cites:
            if len(p.split()) >= 12:
                print(f"{fname} para {idx}: UNCITED: {p[:60]}")
            continue
        overlap = 0
        for cid in cites:
            if cid not in fact_map:
                print(f"{fname} para {idx}: UNKNOWN FACT: {cid}")
                continue
            f_terms = fact_terms(fact_map[cid])
            matches = p_terms.intersection(f_terms)
            overlap += len(matches)
        if overlap == 0 and len(p_terms) >= 6:
            print(f"{fname} para {idx}: ZERO OVERLAP with {cites}: {p[:70]}")
