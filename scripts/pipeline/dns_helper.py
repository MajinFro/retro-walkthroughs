#!/usr/bin/env python3
# coding: utf-8
"""
DNS resolution helper for Playwright on Windows environments.
Resolves public IPs using 8.8.8.8 to bypass captive portals or router interception.
"""
from __future__ import annotations

import os
import platform
import subprocess
from typing import Sequence

_RESOLVED_CACHE: dict[str, str] = {}


def resolve_domain_ip(domain: str) -> str | None:
    """Resolve a domain to an IPv4 address using public DNS (8.8.8.8)."""
    if domain in _RESOLVED_CACHE:
        return _RESOLVED_CACHE[domain]

    # Clean domain
    domain = domain.lower().strip()
    if "/" in domain:
        domain = domain.split("/")[0]

    ip = None
    if platform.system() == "Windows":
        try:
            cmd = f'powershell -NoProfile -Command "(Resolve-DnsName -Server 8.8.8.8 {domain} -Type A -ErrorAction SilentlyContinue).IPAddress"'
            out = subprocess.check_output(cmd, shell=True, timeout=5).decode().strip()
            ips = [l.strip() for l in out.splitlines() if l.strip() and not l.strip().startswith("10.") and not l.strip().startswith("192.168.")]
            if ips:
                ip = ips[0]
        except Exception:
            pass

    if ip:
        _RESOLVED_CACHE[domain] = ip
    return ip


def get_host_resolver_rules(domains: Sequence[str] = (
    "gamefaqs.gamespot.com",
    "strategywiki.org",
    "www.neoseeker.com",
    "neoseeker.com",
    "retroachievements.org",
)) -> str | None:
    """Generate Chromium --host-resolver-rules flag value for known guide domains."""
    rules = []
    for d in domains:
        ip = resolve_domain_ip(d)
        if ip:
            rules.append(f"MAP {d} {ip}")
    return ", ".join(rules) if rules else None


def get_chromium_args(extra_args: Sequence[str] | None = None) -> list[str]:
    """Return Chromium launch arguments with anti-detection and DNS host-resolver-rules."""
    args = [
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
    ]
    if extra_args:
        args.extend(extra_args)

    rules = get_host_resolver_rules()
    if rules:
        args.append(f"--host-resolver-rules={rules}")

    return args
