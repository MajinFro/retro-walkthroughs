# coding: utf-8
import os

OUT_DIR = os.path.abspath("content/research/253/08_chapters")

ch4_text = """# Chapter 4: Super Mario Bros.: The Lost Levels — Secret Worlds (Worlds 9 & A–D)

In Super Mario All-Stars, clearing The Lost Levels eight times displays a star on the title screen for each completion. Once you hold eight stars, holding the A button while pressing Start unlocks the fabled lettered worlds: Worlds A, B, C, and D. These sixteen secret stages represent the ultimate test of platforming skill in 2D Mario history. [[neo1-62-1]]

[MERMAID]

## SMBTLL World A (Bonus World A)

Begin the secret campaign in SMBTLL World A (Bonus World A). In Stage A-1, maneuver past aggressive Koopa Paratroopas and tight pipe jumps. In Stage A-2, navigate an underground cavern crawling with Buzzy Beetles and red Piranha Plants. In Stage A-3, you face a treacherous chasm filled with tilting scale lifts. To unlock the Unstable Platforms achievement, clear Stage A-3 completely without landing on or touching any of the wooden scale platforms, using high-velocity running leaps and bouncing off Paratroopa shells instead. [[neo1-63-1]]

[ACHIEVEMENT:541021]

In Stage A-4, infiltrate the fiery fortress. Time your jumps between overlapping firebars, navigate narrow ceiling corridors, and sever the bridge axe beneath fake Bowser to conquer the first lettered world. [[neo1-64-1]]

[ACHIEVEMENT:26934]

## SMBTLL World B (Bonus World B)

Venture across the blistering hazards of SMBTLL World B (Bonus World B). Stage B-1 features gale-force headwinds blowing against Mario over wide chasms lined with Bullet Bill cannons. In Stage B-2, dive into a dark water trench packed with erratic Bloopers and schools of Cheep-Cheeps. Stage B-3 presents extreme springboard leaps across bottomless gaps. In Stage B-4, navigate the castle corridors under intense firebar barrages and drop fake Bowser into the lava. [[neo2-118-1]]

[ACHIEVEMENT:26935]

## SMBTLL World C (Bonus World C)

Ascend into the skyward reaches of SMBTLL World C (Bonus World C). In Stage C-1, Lakitu pelts Mario with endless Spinies while narrow ice platforms test your traction. Stage C-2 features precarious loose stone steps and swaying palm tree perches. At the end of Stage C-2, position yourself on the high springboard and execute a maximum-height vault to launch Mario high over the top of the flagpole to earn Sky High. [[neo1-63-2]]

[ACHIEVEMENT:541022]

In Stage C-3, dash across falling bridge planks under heavy cannon fire. Stage C-4 is a complex castle maze: follow the correct sequence of upper and lower corridors to avoid looping, and strike the bridge axe to defeat Bowser. [[neo2-121-1]]

[ACHIEVEMENT:26936]

## SMBTLL World D (Bonus World D)

Infiltrate the final fortress domain in SMBTLL World D (Bonus World D). Stage D-1 is a relentless gauntlet of Hammer Bros patrolling narrow brick pillars. In Stage D-2, weave through a dense vertical pipe labyrinth guarded by snapping red Piranha Plants. Stage D-3 features floating cloud platforms under heavy Bullet Bill bombardment. [[neo2-123-1]]

Stage D-4 is the climactic, multi-chamber volcanic fortress. Navigate through the lava corridors, drop past the flame bars, and weave past the elite Hammer Bro guard. [[neo2-124-1]]

> [!CAUTION]
> **Point of No Return:** Point of No Return: Lost Levels World D-4 Chamber: Defeating the final Bowser in Stage D-4 concludes the secret worlds campaign. [[ra-comments-74-1]]

Enter the final chamber to face Bowser in his supreme incarnation. Evade his dense hammer throws and searing breath, execute a precision leap over his spikes, and strike the golden axe switch. Bowser plunges into the magma, unlocking both the World D completion badge and the coveted Certified Mario Maniac mastery award! [[ra-comments-74-2]]

[ACHIEVEMENT:26937]
[ACHIEVEMENT:28306]

> [!IMPORTANT]
> ### Chapter Cumulative 100% Progress Checkpoint
> - [ ] Conquered all sixteen secret stages across Worlds A through D [[neo1-62-1]]
> - [ ] Cleared Stage A-3 without touching any scale platforms for Unstable Platforms [[neo1-63-1]]
> - [ ] Vaulted completely over the flagpole in Stage C-2 for Sky High [[neo1-63-2]]
> - [ ] Defeated the supreme Bowser in Stage D-4 to earn Certified Mario Maniac [[ra-comments-74-1]]

## Chapter Checklist

- Unlocked and conquered SMBTLL World A, World B, World C, and World D. [[neo1-62-1]]
- Slew the final Bowser in World D-4 to rescue Princess Toadstool. [[ra-comments-74-1]]
- Earned the Unstable Platforms achievement by avoiding all scale lifts in A-3. [[neo1-63-1]]
- Earned the Sky High achievement by leaping over the flagpole in C-2. [[neo1-63-2]]
"""

path = os.path.join(OUT_DIR, "04.md")
with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(ch4_text.strip() + "\r\n")
print(f"Created 04.md: {len(ch4_text.split())} words")
