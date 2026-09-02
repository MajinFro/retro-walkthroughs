import subprocess
import sys

maps = [
    ("map-alunze-basement", "Alunze Castle Basement Map", "snesmaster1", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/3636-alunze-castle-basement-map"),
    ("map-alunze-nw-cave", "Alunze Northwest Cave Map", "snesmaster1", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/3635-alunze-northwest-cave-map"),
    ("map-ancient-tower", "Ancient Tower Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12294-ancient-tower-map"),
    ("map-cave-bound-kingdom", "Cave to Bound Kingdom Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12270-cave-to-bound-kingdom-map"),
    ("map-cave-sundletan", "Cave to Sundletan Map", "snesmaster1", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/3595-cave-to-sundletan-map"),
    ("map-dankirk-north", "Dankirk North Dungeon Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12338-dankirk-north-dungeon-map"),
    ("map-divine-shrine", "Divine Shrine Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12337-divine-shrine-map"),
    ("map-dragon-mountain", "Dragon Mountain Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12353-dragon-mountain-map"),
    ("map-flower-mountain", "Flower Mountain Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12326-flower-mountain-map"),
    ("map-gordovan-west-tower", "Gordovan West Tower Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12269-gordovan-west-tower-map"),
    ("map-gratze-dungeon", "Gratze Dungeon Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12487-gratze-dungeon-map"),
    ("map-kamirno-tower", "Kamirno Sealed Tower Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12494-kamirno-sealed-tower-map"),
    ("map-karlloon-shrine", "Karlloon North Shrine Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12327-karlloon-north-shrine-map"),
    ("map-lake-cave", "Lake Cave Map", "snesmaster1", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/3633-lake-cave-map"),
    ("map-mt-no-return", "Mountain of No Return Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12340-mountain-of-no-return-map"),
    ("map-northeast-tower", "Northeast Tower Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12339-northeast-tower-map"),
    ("map-northern-labyrinth", "Northern Labyrinth Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12285-northern-labyrinth-map"),
    ("map-northern-lighthouse", "Northern Lighthouse Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12314-northern-lighthouse-map"),
    ("map-phantom-tree-mt", "Phantom Tree Mountain Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12313-phantom-tree-mountain-map"),
    ("map-ruby-cave", "Ruby Cave Map", "snesmaster1", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/3930-ruby-cave-map"),
    ("map-secret-skills-cave", "Secret Skills Cave Map", "snesmaster1", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/3929-secret-skills-cave-map"),
    ("map-shrine-daos", "Shrine of Daos Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12495-shrine-of-daos-map"),
    ("map-shrine-vengeance", "Shrine of Vengeance Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12336-shrine-of-vengeance-map"),
    ("map-shuman-tower", "Shuman Sealed Tower Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12491-shuman-sealed-tower-map"),
    ("map-strahda-tower", "Strahda Sealed Tower Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12493-strahda-sealed-tower-map"),
    ("map-tanbel-se-tower", "Tanbel Southeast Tower Map", "snesmaster1", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/3634-tanbel-souteast-tower-map"),
    ("map-tower-sacrifice", "Tower of Sacrifice Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12315-tower-of-sacrifice-map"),
    ("map-tower-truth", "Tower of Truth Map", "BLAHMASTER", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/12335-tower-of-truth-map"),
    ("map-treasure-sword-shrine", "Treasure Sword Shrine Map", "snesmaster1", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/3931-treasure-sword-shrine-map"),
    ("map-world-map", "World Map", "Telago", "https://gamefaqs.gamespot.com/snes/588451-lufia-ii-rise-of-the-sinistrals/map/1091-world-map")
]

for mid, title, author, url in maps:
    cmd = [
        sys.executable,
        "scripts/pipeline/collect_source.py",
        "1005",
        url,
        "--id", mid,
        "--site", "GameFAQs",
        "--title", title,
        "--author", author,
        "--kind", "map"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error registering {mid}: {res.stderr}")
    else:
        print(f"Registered {mid}: {title}")
