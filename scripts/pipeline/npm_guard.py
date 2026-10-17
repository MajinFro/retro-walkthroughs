"""Stop when PowerShell made npm swallow a --flag meant for this script.

PowerShell runs `npm` as npm.ps1 and strips the `--` before npm sees it, so npm keeps
`--id gf1` as its own config (npm_config_id=true) and passes only the value `gf1` on.
"""
import os
import sys


def check(parser):
    event = os.environ.get("npm_lifecycle_event")
    if not event:
        return
    for opt in parser._option_string_actions:
        if not opt.startswith("--") or opt in ("--help",) or opt in sys.argv:
            continue
        # a swallowed flag always arrives as "true"; npm's own settings (npm_config_prefix=<path>, ...) never do
        if os.environ.get(f"npm_config_{opt[2:].replace('-', '_')}") == "true":
            sys.exit(
                f'{opt} was taken by npm, not passed to this script (PowerShell removes the "--" before npm.ps1 sees it).\n'
                f"Re-run with npm.cmd instead of npm, e.g.  npm.cmd run {event} -- ... {opt} ...  (or run it from Bash)."
            )
