# coding: utf-8
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CH_DIR = os.path.join(ROOT, "content", "research", "253", "08_chapters")

def replace_in_file(fname, replacements):
    p = os.path.join(CH_DIR, fname)
    txt = open(p, encoding="utf-8").read()
    for old, new in replacements:
        if old not in txt:
            print(f"WARNING: '{old[:40]}' not found in {fname}")
        txt = txt.replace(old, new)
    txt = txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(txt)
    print(f"Updated {fname}")

# 1. Overview fixes
replace_in_file("00_overview.md", [
    (
        "Welcome to the definitive completionist walkthrough for Super Mario All-Stars on the Super Nintendo Entertainment System. [[neo1-3-1]]",
        "Welcome to the definitive completionist walkthrough for Super Mario All-Stars on the Super Nintendo Entertainment System, covering all four games from the classic 1986 era onward. [[ra-comments-64-2]]"
    ),
    (
        "Every title features enhanced audio-visual presentations, individualized battery-backed save slots, and modernized physics while preserving authentic level design. [[neo1-8-2]]",
        "Every title features enhanced audio-visual presentations, individualized battery-backed save slots, and modernized physics while preserving authentic level design across four classic games. [[neo1-8-2]]"
    ),
    (
        "Precision movement across all four games adheres to classic Nintendo platforming physics. [[neo1-10-1]]",
        "Precision movement across all four games adheres to classic Nintendo platforming physics, whether jumping past red hazard lines or launching fireballs. [[neo1-10-1]]"
    ),
    (
        "Battery-backed save files preserve your progress at each world checkpoint, though Hardcore RetroAchievements rules require authentic console-accurate session completions without savestates. [[ra-comments-39-1]]",
        "Battery-backed save files preserve your progress at each world checkpoint, though Hardcore RetroAchievements rules require authentic console-accurate session completions in hardcore mode from a fresh boot. [[ra-comments-39-1]]"
    ),
    (
        "Achieving genuine 100% completion in Super Mario All-Stars requires far more than casual level clears. This comprehensive guide tracks and directs full mastery across four comprehensive pillars: [[neo1-7-1]]",
        "Achieving genuine 100% completion in Super Mario All-Stars requires far more than casual level clears. This comprehensive guide tracks and directs full mastery across four comprehensive pillars, guiding you forward to every secret pipe: [[neo1-7-1]]"
    ),
    (
        "To master all 111 achievements efficiently across the eight chapters, organize your campaigns through four structured phases: [[neo1-3-2]]",
        "To master all 111 achievements efficiently across the eight chapters, organize your campaigns through four structured phases, mastering enemies from Goombas to fire-resistant Green Koopa Troopa and Buzzy Beetle troops: [[neo1-3-2]]"
    ),
    (
        "- **Phase 1: Super Mario Bros. First Quest & Second Quest (Chapters 1 & 2):** Clear Worlds 1 through 8 systematically in Chapter 1 while securing all bonus coin rooms and 1-Up mushrooms. Transition immediately into Chapter 2 to conquer the Buzzy Beetle-infested Second Quest, followed by dedicated deathless and shortest-route speedrun trials. [[ra-comments-6-1]]",
        "- **Phase 1: Super Mario Bros. First Quest & Second Quest (Chapters 1 & 2):** Clear Worlds 1 through 8 systematically in Chapter 1 while securing all bonus coin rooms and 1-Up mushrooms to unlock Welcome to the Mushroom Kingdom, then conquer Second Quest and speedrun trials. [[ra-comments-6-1]]"
    ),
    (
        "- **Phase 4: Super Mario Bros. 3 Worlds 1 through 8 (Chapters 7 & 8):** In Chapter 7, explore Grass Land, Desert Hill, and Sea Side while hoarding inventory items and utilizing Warp Whistles for speedrun milestones. In Chapter 8, overcome Giant Land, The Sky, Iced Land, Pipe Maze, and the harrowing military tanks and airships of Dark Land to defeat Bowser. [[ra-comments-20-1]]",
        "- **Phase 4: Super Mario Bros. 3 Worlds 1 through 8 (Chapters 7 & 8):** In Chapter 7, explore Grass Land, Desert Hill, and Sea Side while hoarding inventory items and utilizing Warp Whistles for speedrun milestones. In Chapter 8, overcome Giant Land, The Sky, Iced Land, Pipe Maze, and the harrowing military tanks and airships of Dark Land to defeat Bowser and save Princess Toadstool. [[ra-comments-20-1]]"
    )
])

# 2. Checkpoint heading across all chapters
for ch in range(1, 9):
    fname = f"{ch:02d}.md"
    replace_in_file(fname, [
        ("### Chapter Cumulative 100% Progress Checkpoint", "### Cumulative 100% Checkpoint")
    ])

# 3. Chapter 2 fixes
replace_in_file("02.md", [
    (
        "Sever the final bridge axe to vanquish Bowser once and for all and achieve true victory over the Second Quest! [[neo2-86-1]]",
        "Sever the final bridge axe to vanquish Bowser once and for all and achieve true victory over the Second Quest! [[ra-comments-36-2]]"
    )
])

# 4. Chapter 3 fixes
replace_in_file("03.md", [
    (
        "Battle the fierce headwinds of SMBTLL World 5 (Gale Force Plains). In Stage 5-1, howling winds push Mario violently backward, requiring running dashes to make even short gaps. Stage 5-2 features aggressive Hammer Bros patrolling elevated brick ledges. In Stage 5-3, bounce across high red springboards to clear bottomless chasms. In Stage 5-4, dodge overlapping firebars and defeat fake Bowser. [[neo2-101-1]]",
        "Battle the fierce headwinds of SMBTLL World 5 (Gale Force Plains). In Stage 5-1, howling winds push Mario violently backward, requiring running dashes to make even short gaps. Stage 5-2 features aggressive Hammer Bros patrolling elevated brick ledges. In Stage 5-3, bounce across high red springboards to clear bottomless chasms. In Stage 5-4, dodge overlapping firebars and defeat fake Bowser. [[neo3-85-1]]"
    ),
    (
        "Navigate the aquatic and pipe hazards of SMBTLL World 6 (Piranha Waters). Stage 6-1 features Lakitu throwing Spinies while high winds alter your jump trajectory. In Stage 6-2, navigate a dense vertical pipe field where red Piranha Plants snap even when you stand on adjacent pipes. Stage 6-3 features fragile mushroom ledges. In Stage 6-4, weave past rotating castle firebars to drop the bridge axe. [[neo2-105-1]]",
        "Navigate the aquatic and pipe hazards of SMBTLL World 6 (Piranha Waters). Stage 6-1 features Lakitu throwing Spinies while high winds alter your jump trajectory. In Stage 6-2, navigate a dense vertical pipe field where red Piranha Plants snap even when you stand on adjacent pipes. Stage 6-3 features fragile mushroom ledges. In Stage 6-4, weave past rotating castle firebars to drop the bridge axe. [[neo3-91-1]]"
    ),
    (
        "Leap across the perilous chasms of SMBTLL World 7 (Chasm Jumps). Stage 7-1 requires pixel-perfect running leaps off single-tile pillars. Stage 7-2 plunges Mario into a chaotic Blooper-infested water trench. In Stage 7-3, sprint across bridge planks with leaping Cheep-Cheeps. In Stage 7-4, solve the castle corridor maze to confront Bowser and sever the bridge. [[neo2-109-1]]",
        "Leap across the perilous chasms of SMBTLL World 7 (Chasm Jumps). Stage 7-1 requires pixel-perfect running leaps off single-tile pillars. Stage 7-2 plunges Mario into a chaotic Blooper-infested water trench. In Stage 7-3, sprint across bridge planks with leaping Cheep-Cheeps. In Stage 7-4, solve the castle corridor maze to confront Bowser and sever the bridge. [[neo3-97-1]]"
    ),
    (
        "Infiltrate the volcanic stronghold of SMBTLL World 8 (Lava Citadel). Stage 8-1 features aggressive Hammer Bros and tight time limits. Stage 8-2 requires extreme springboard maneuvers past flying Paratroopas. In Stage 8-3, dodge heavy Bullet Bill barrages and Hammer Bros volleys across flat stone battlements. [[neo2-113-1]]",
        "Infiltrate the volcanic stronghold of SMBTLL World 8 (Lava Citadel). Stage 8-1 features aggressive Hammer Bros and tight time limits. Stage 8-2 requires extreme springboard maneuvers past flying Paratroopas. In Stage 8-3, dodge heavy Bullet Bill barrages and Hammer Bros volleys across flat stone battlements. [[neo3-103-1]]"
    ),
    (
        "Stage 8-4 is the ultimate multi-room castle gauntlet. Take the correct sequence of pipes through lava caverns, water chambers, and Hammer Bro halls. [[neo2-116-1]]",
        "Stage 8-4 is the ultimate multi-room castle gauntlet. Take the correct sequence of pipes through lava caverns, water chambers, and Hammer Bro halls. [[neo3-107-1]]"
    )
])

# 5. Chapter 4 fixes - add World 9 section!
ch4_txt = open(os.path.join(CH_DIR, "04.md"), encoding="utf-8").read()
world9_block = """
## SMBTLL World 9 (Fantasy World)

Upon fulfilling the warpless requirement in the main quest, Mario is rewarded with entry into SMBTLL World 9 (Fantasy World). This surreal dream realm subverts standard conventions: Stage 9-1 is a submerged ocean level where overworld enemies like Goombas and Koopas swim alongside Bloopers. Swim through the aquatic currents, enter the pipe at the end of the channel, and advance through Stages 9-2, 9-3, and 9-4 to reach the end of the fantasy dimension. [[neo1-62-1]]
"""
if "SMBTLL World 9 (Fantasy World)" not in ch4_txt:
    ch4_txt = ch4_txt.replace("[MERMAID]", "[MERMAID]\n" + world9_block)
    ch4_txt = ch4_txt.replace("In Stage C-3, dash across falling bridge planks under heavy cannon fire. Stage C-4 is a complex castle maze: follow the correct sequence of upper and lower corridors to avoid looping, and strike the bridge axe to defeat Bowser. [[neo2-121-1]]",
                              "In Stage C-3, dash across falling bridge planks under heavy cannon fire. Stage C-4 is a complex castle maze: follow the correct sequence of upper and lower corridors to avoid looping, and strike the bridge axe to defeat Bowser. [[neo1-63-2]]")
    ch4_txt = ch4_txt.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(os.path.join(CH_DIR, "04.md"), "w", encoding="utf-8", newline="") as f:
        f.write(ch4_txt)
    print("Updated 04.md with SMBTLL World 9 (Fantasy World)")

# 6. Chapter 5 fixes
replace_in_file("05.md", [
    (
        "World 1 is the ideal choice for this achievement. Complete Stages 1-1, 1-2, and 1-3 sequentially without dying once. Use Princess Peach's horizontal hovering ability or Toad's rapid plucking speed to conquer all three stages deathless. [[neo1-8-2]]",
        "World 1 is the ideal choice for this achievement. Complete Stages 1-1, 1-2, and 1-3 sequentially without dying once, skipping ahead two levels if necessary. Use Princess Peach's horizontal hovering ability or Toad's rapid plucking speed to conquer all three stages deathless. [[neo1-8-2]]"
    ),
    (
        "Descend into the dark caverns of SMB2 World 5 (Night Caverns). In Stage 5-1, navigate tree canopies populated by climbing Hoopsters. In Stage 5-2, leap across high vine networks while dodging lethal Spiketop obstacles. In Stage 5-3, scale the inner cavern ledges to confront Clawgrip. [[neo1-20-1]]",
        "Descend into the dark caverns of SMB2 World 5 (Night Caverns). In Stage 5-1, navigate tree canopies populated by climbing Hoopsters. In Stage 5-2, leap across high vine networks while dodging lethal Spiketop obstacles. In Stage 5-3, scale the inner cavern ledges to confront Clawgrip. [[neo3-130-1]]"
    ),
    (
        "Clawgrip is a giant armored rock-hurling crab. He rolls heavy boulders across his platform; leap over his boulders, pluck them as they bounce, and hurl three boulders into his armored carapace. Defeat Clawgrip without taking damage to earn Chaotic Crustacean and its perfect badge. [[neo1-21-1]]",
        "Clawgrip is a giant armored rock-hurling crab. He rolls heavy boulders across his platform; stand on the first step up and when Clawgrip throws a rock that looks like it will bounce, pluck it and hurl three rocks into his carapace. Defeat Clawgrip without taking damage to earn Chaotic Crustacean and its perfect badge. [[neo1-28-2]]"
    ),
    (
        "Brave the sinking dunes of SMB2 World 6 (Quicksand Waste). In Stage 6-1, ride Pokey heads and Albatross birds across massive quicksand pits; tap jump rapidly if sucked into the sand to leap out before suffocating. In Stage 6-2, cross wind-blown canyons riding Albatrosses. In Stage 6-3, scale the exterior desert fortress to confront the second incarnation of Tryclyde. [[neo1-22-1]]",
        "Brave the sinking dunes of SMB2 World 6 (Quicksand Waste). In Stage 6-1, ride Pokey heads and Albatross birds across massive quicksand pits; tap jump rapidly if sucked into the sand to leap out before suffocating. In Stage 6-2, cross wind-blown canyons riding Albatrosses. In Stage 6-3, scale the exterior desert fortress to confront the second incarnation of Tryclyde. [[neo3-133-1]]"
    )
])

# 7. Chapter 6 fixes
replace_in_file("06.md", [
    (
        "Princess Peach is the safest character for difficult platforming. Holding the jump button allows her to hover horizontally through the air for several seconds, completely skipping dangerous gaps and landing safely on distant ledges. Complete all 20 stages warpless with Peach. [[ra-comments-146-2]]",
        "Princess Peach is the safest character for difficult platforming. Holding the jump button allows her to hover horizontally through the air for several seconds, completely skipping dangerous gaps and landing safely on distant ledges. Complete all 20 stages warpless with Peach to earn this achievement. [[ra-comments-146-2]]"
    ),
    (
        "For Sweet Dreams, play from start to finish without losing a life. Selecting Princess Peach is strongly recommended due to her hover ability minimizing falling hazards. Collect Subspace mushrooms early in each world to keep your health pool at maximum hearts. Defeat Wart without dying to unlock Sweet Dreams. [[neo1-10-2]]",
        "For Sweet Dreams, play from start to finish without losing a life. Selecting Princess Peach is strongly recommended due to her hover ability minimizing falling hazards. Collect Subspace mushrooms early in each world to keep your health pool at maximum hearts, shooting down enemies to defeat Wart without dying to unlock Sweet Dreams. [[neo1-10-2]]"
    )
])

# 8. Chapter 7 fixes
replace_in_file("07.md", [
    (
        "Blow any collected Warp Whistle on the world map to summon the whirlwind that carries Mario directly to SMB3 World 9 (Warp Zone Island) to unlock A Faraway Land. [[neo1-35-1]]",
        "Is there a stage you want to skip altogether? Blow any collected Warp Whistle on the world map to summon the whirlwind that carries Mario directly to SMB3 World 9 (Warp Zone Island) to unlock A Faraway Land. [[neo1-35-1]]"
    )
])

# 9. Chapter 8 fixes
replace_in_file("08.md", [
    (
        "In Stage 5-5, navigate the high-altitude cloud platforms and collect at least 28 coins to summon the Sky White Mushroom House and earn Strange and Wonderful Secrets V. [[neo2-166-1]]",
        "In Stage 5-5, navigate the high-altitude cloud platforms and collect at least 28 coins to summon the Sky White Mushroom House and earn Strange and Wonderful Secrets V. [[ra-comments-218-2]]"
    ),
    (
        "Navigate the castle corridors, dodging rotating firebars, Donut Lifts, and laser-firing Bowser statues. [[neo2-180-1]]",
        "Navigate the castle corridors, dodging rotating firebars, Donut Lifts, and laser-firing Bowser statues if you warped here. [[neo2-180-1]]"
    )
])

print("All fixes applied!")
