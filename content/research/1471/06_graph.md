# Knowledge graph — game 1471

Nodes: 83 · Edges: 96

## Progression flow

```mermaid
flowchart TD
  Tantegel_Castle["Tantegel Castle"]
  King_Lorik["King Lorik (save point)"]
  Alefgard["Alefgard"]
  Blue_Slime{{"⚔ Blue Slime"}}
  Brecconary["Brecconary"]
  Erdricks_Cave["Erdrick's Cave"]
  Garinham["Garinham"]
  Mountain_Cave["Mountain Cave"]
  Mountain_Cave_B2["Mountain Cave B2"]
  Kol["Kol"]
  Swamp_Cave["Swamp Cave"]
  Rimuldar["Rimuldar"]
  Goldman{{"⚔ Goldman"}}
  Wyvern{{"⚔ Wyvern"}}
  Garins_Grave["Garin's Grave"]
  Garins_Grave_B3["Garin's Grave B3"]
  Staff_of_Rain_Shrine["Staff of Rain Shrine"]
  Cantlin["Cantlin"]
  Golem{{"⚔ Golem"}}
  Erdricks_Token_Swamp["Erdrick's Token Swamp"]
  Hauksness["Hauksness"]
  Axe_Knight{{"⚔ Axe Knight"}}
  Domdora_Desert["Domdora Desert"]
  Metal_Slime{{"⚔ Metal Slime"}}
  Rainbow_Drop_Shrine["Rainbow Drop Shrine"]
  Rainbow_Bridge["Rainbow Bridge"]
  Charlock_Castle["Charlock Castle"]
  Charlock_Depths["Charlock Castle Depths"]
  Master_Save["Master save at King Lorik before the endings"]
  Green_Dragon{{"⚔ Green Dragon"}}
  Gwaelin_Rescue_PONR>"⛔ Rescuing Gwaelin (cannot be undone)"]
  Dragonlord{{"⚔ Dragonlord"}}
  Dragonlord_Offer>"⛔ Dragonlord's offer (answer Yes = bad ending)"]
  King_Save_Prompt>"⛔ King's save prompt after Gwaelin's return"]
  Tantegel_Castle -->|"castle exit"| Alefgard
  Alefgard -->|"east of the castle"| Brecconary
  Alefgard -->|"desert north of Tantegel"| Erdricks_Cave
  Alefgard -->|"north then west"| Garinham
  Garinham -->|"south over the bridge"| Mountain_Cave
  Mountain_Cave -->|"stairs down"| Mountain_Cave_B2
  Alefgard -->|"north, east over two bridges"| Kol
  Kol -->|"cave south of Kol"| Swamp_Cave
  Swamp_Cave -->|"south exit"| Rimuldar
  Garinham -->|"hidden passage behind the north building"| Garins_Grave
  Garins_Grave -->|"B1F right door, B2F"| Garins_Grave_B3
  Kol -->|"northwest of Kol"| Staff_of_Rain_Shrine
  Alefgard -->|"far south, past Hauksness"| Cantlin
  Cantlin -->|"south over the bridge"| Erdricks_Token_Swamp
  Alefgard -->|"southern desert"| Hauksness
  Hauksness -->|"south of Hauksness"| Domdora_Desert
  Rimuldar -->|"across the bridge south"| Rainbow_Drop_Shrine
  Rimuldar -->|"peninsula northwest of Rimuldar"| Rainbow_Bridge
  Rainbow_Bridge --> Charlock_Castle
  Charlock_Castle -->|"secret stairs"| Charlock_Depths
  Charlock_Castle -->|"Return, save at the King"| Master_Save
  Master_Save -->|"ending run 1"| Swamp_Cave
  Charlock_Castle -->|"courtyard throne"| Dragonlord
  Dragonlord --> Dragonlord_Offer
  Master_Save -->|"ending run 2, Gwaelin left in the cave"| Dragonlord
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gwaelin_Rescue_PONR,Dragonlord_Offer,King_Save_Prompt ponr;
  class Blue_Slime,Goldman,Wyvern,Golem,Axe_Knight,Metal_Slime,Green_Dragon,Dragonlord boss;
```

## Achievement dependencies

```mermaid
flowchart LR
  Magic_Key[/"Magic Key"/]
  Ach_13393(["🏆 Thou Hast Escapth the King's Chamber"])
  Blue_Slime{{"⚔ Blue Slime"}}
  Ach_13398(["🏆 Thou Hast Defeated the Slime"])
  Alefgard["Alefgard"]
  Ach_13381(["🏆 Thou Hast Gained A Level"])
  Ach_13382(["🏆 Thou Hast Learnt a Spell"])
  Erdricks_Tablet[/"Erdrick's Tablet"/]
  Ach_13395(["🏆 Thou Hast Learnt of Thy Quest"])
  Fighters_Ring[/"Fighter's Ring"/]
  Ach_13407(["🏆 Thou Art a Fighter, Not a Lover"])
  Death_Necklace[/"Death Necklace (1/32 gold chest)"/]
  Ach_13397(["🏆 Thou Hast a Death Wish"])
  Mountain_Cave["Mountain Cave"]
  Ach_13383(["🏆 Thou Hast No Need for Torches"])
  Fairy_Flute[/"Fairy Flute"/]
  Ach_13408(["🏆 Thou Art the Pied Piper"])
  Goldman{{"⚔ Goldman"}}
  Ach_13400(["🏆 Thou Hast Defeated the Goldman"])
  Wyvern{{"⚔ Wyvern"}}
  Ach_13401(["🏆 Thou Hast Defeated the Y BURN"])
  Rimuldar["Rimuldar"]
  Ach_13384(["🏆 Thou Hast Seen Sunlight"])
  Stones_of_Sunlight[/"Stones of Sunlight"/]
  Ach_13403(["🏆 Thou Hast Harnessed the Sun"])
  Silver_Harp[/"Silver Harp"/]
  Ach_13402(["🏆 Thou Hast Discovered Thine Inner Bard"])
  Cursed_Belt[/"Cursed Belt"/]
  Ach_13396(["🏆 Thou Hast Gained Weight"])
  Garins_Grave["Garin's Grave"]
  Ach_13385(["🏆 Thou Hast Acquired Body Odor"])
  Staff_of_Rain[/"Staff of Rain"/]
  Ach_13404(["🏆 Thou Hast Acquired the Song of Storms"])
  Silver_Shield[/"Silver Shield"/]
  Ach_13411(["🏆 Thou Hast Hefted a Heavy Burden!"])
  Erdricks_Token[/"Erdrick's Token"/]
  Ach_13406(["🏆 Thou Hast Unearthed a Peaty Sigil"])
  Erdricks_Armor[/"Erdrick's Armor"/]
  Ach_13410(["🏆 Thou Hast the Armor of Legend!"])
  Metal_Slime{{"⚔ Metal Slime"}}
  Ach_13399(["🏆 Thou Hast Defeated the Metal Slime"])
  Rainbow_Drop[/"Rainbow Drop"/]
  Ach_13405(["🏆 Thou Canst Not Have Rainbows Without Reyn"])
  Rainbow_Bridge["Rainbow Bridge"]
  Ach_13412(["🏆 Thou Hast Conjured the Magic Bridge"])
  Charlock_Castle["Charlock Castle"]
  Ach_13413(["🏆 Thou Hast Discerned the Truth"])
  Erdricks_Sword[/"Erdrick's Sword"/]
  Ach_13409(["🏆 Thou Hast the Sword of Legend!"])
  Hauksness["Hauksness"]
  Ach_13386(["🏆 Thou Hast Acquired All Spells"])
  Princess_Gwaelin["Princess Gwaelin"]
  Ach_13416(["🏆 Thine Princess Art Not in Another Castle"])
  Ach_13419(["🏆 Thou Art a Jerk to Women"])
  Gwaelin_Rescue_PONR>"⛔ Rescuing Gwaelin (cannot be undone)"]
  Dragonlord{{"⚔ Dragonlord"}}
  Ach_13418(["🏆 Thine Princess By Thine Side"])
  Ach_13414(["🏆 Thou Hast Vanquished the Darkness!"])
  Ach_13420(["🏆 Thou Hast Triumphed Together"])
  Gwaelins_Love[/"Gwaelin's Love"/]
  Ach_13417(["🏆 Thine Princess Returned to Her Sire"])
  King_Save_Prompt>"⛔ King's save prompt after Gwaelin's return"]
  Dragonlord_Offer>"⛔ Dragonlord's offer (answer Yes = bad ending)"]
  Ach_13415(["🏆 Thou Art a Fool"])
  Magic_Key -->|unlocks| Ach_13393
  Blue_Slime -->|unlocks| Ach_13398
  Alefgard -->|unlocks| Ach_13381
  Alefgard -->|unlocks| Ach_13382
  Erdricks_Tablet -->|unlocks| Ach_13395
  Fighters_Ring -->|unlocks| Ach_13407
  Death_Necklace -->|unlocks| Ach_13397
  Mountain_Cave -->|unlocks| Ach_13383
  Fairy_Flute -->|unlocks| Ach_13408
  Goldman -->|unlocks| Ach_13400
  Wyvern -->|unlocks| Ach_13401
  Rimuldar -->|unlocks| Ach_13384
  Stones_of_Sunlight -->|unlocks| Ach_13403
  Silver_Harp -->|unlocks| Ach_13402
  Cursed_Belt -->|unlocks| Ach_13396
  Garins_Grave -->|unlocks| Ach_13385
  Staff_of_Rain -->|unlocks| Ach_13404
  Silver_Shield -->|unlocks| Ach_13411
  Erdricks_Token -->|unlocks| Ach_13406
  Erdricks_Armor -->|unlocks| Ach_13410
  Metal_Slime -->|unlocks| Ach_13399
  Rainbow_Drop -->|unlocks| Ach_13405
  Rainbow_Bridge -->|unlocks| Ach_13412
  Charlock_Castle -->|unlocks| Ach_13413
  Erdricks_Sword -->|unlocks| Ach_13409
  Hauksness -->|unlocks| Ach_13386
  Princess_Gwaelin -->|unlocks| Ach_13416
  Ach_13419 -.->|missable before| Gwaelin_Rescue_PONR
  Dragonlord -->|unlocks| Ach_13418
  Dragonlord -->|unlocks| Ach_13414
  Ach_13414 -->|unlocks| Ach_13420
  Ach_13414 -->|unlocks| Ach_13419
  Gwaelins_Love -->|unlocks| Ach_13417
  Ach_13418 -.->|missable before| King_Save_Prompt
  Dragonlord_Offer -->|unlocks| Ach_13415
```

## Chapter 1: Tantegel Castle and the First Slimes

```mermaid
flowchart TD
  Tantegel_Castle["Tantegel Castle"]
  King_Lorik["King Lorik (save point)"]
  Alefgard["Alefgard"]
  Blue_Slime{{"⚔ Blue Slime"}}
  Brecconary["Brecconary"]
  Goldman{{"⚔ Goldman"}}
  Wyvern{{"⚔ Wyvern"}}
  Golem{{"⚔ Golem"}}
  Axe_Knight{{"⚔ Axe Knight"}}
  Metal_Slime{{"⚔ Metal Slime"}}
  Master_Save["Master save at King Lorik before the endings"]
  Green_Dragon{{"⚔ Green Dragon"}}
  Gwaelin_Rescue_PONR>"⛔ Rescuing Gwaelin (cannot be undone)"]
  Dragonlord{{"⚔ Dragonlord"}}
  Dragonlord_Offer>"⛔ Dragonlord's offer (answer Yes = bad ending)"]
  King_Save_Prompt>"⛔ King's save prompt after Gwaelin's return"]
  Tantegel_Castle -->|"castle exit"| Alefgard
  Alefgard -->|"east of the castle"| Brecconary
  Dragonlord --> Dragonlord_Offer
  Master_Save -->|"ending run 2, Gwaelin left in the cave"| Dragonlord
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gwaelin_Rescue_PONR,Dragonlord_Offer,King_Save_Prompt ponr;
  class Blue_Slime,Goldman,Wyvern,Golem,Axe_Knight,Metal_Slime,Green_Dragon,Dragonlord boss;
```

## Chapter 2: Erdrick's Cave and Garinham

```mermaid
flowchart TD
  Erdricks_Cave["Erdrick's Cave"]
  Garinham["Garinham"]
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```

## Chapter 3: The Mountain Cave

```mermaid
flowchart TD
  Mountain_Cave["Mountain Cave"]
  Mountain_Cave_B2["Mountain Cave B2"]
  Mountain_Cave -->|"stairs down"| Mountain_Cave_B2
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```

## Chapter 4: Kol, the Swamp Cave and Rimuldar

```mermaid
flowchart TD
  Kol["Kol"]
  Swamp_Cave["Swamp Cave"]
  Rimuldar["Rimuldar"]
  Goldman{{"⚔ Goldman"}}
  Wyvern{{"⚔ Wyvern"}}
  Master_Save["Master save at King Lorik before the endings"]
  Green_Dragon{{"⚔ Green Dragon"}}
  Gwaelin_Rescue_PONR>"⛔ Rescuing Gwaelin (cannot be undone)"]
  Dragonlord{{"⚔ Dragonlord"}}
  Dragonlord_Offer>"⛔ Dragonlord's offer (answer Yes = bad ending)"]
  King_Save_Prompt>"⛔ King's save prompt after Gwaelin's return"]
  Kol -->|"cave south of Kol"| Swamp_Cave
  Swamp_Cave -->|"south exit"| Rimuldar
  Master_Save -->|"ending run 1"| Swamp_Cave
  Dragonlord --> Dragonlord_Offer
  Master_Save -->|"ending run 2, Gwaelin left in the cave"| Dragonlord
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gwaelin_Rescue_PONR,Dragonlord_Offer,King_Save_Prompt ponr;
  class Goldman,Wyvern,Green_Dragon,Dragonlord boss;
```

## Chapter 5: Stones of Sunlight, Garin's Grave and the Staff of Rain

```mermaid
flowchart TD
  Tantegel_Castle["Tantegel Castle"]
  King_Lorik["King Lorik (save point)"]
  Blue_Slime{{"⚔ Blue Slime"}}
  Garinham["Garinham"]
  Goldman{{"⚔ Goldman"}}
  Wyvern{{"⚔ Wyvern"}}
  Garins_Grave["Garin's Grave"]
  Garins_Grave_B3["Garin's Grave B3"]
  Staff_of_Rain_Shrine["Staff of Rain Shrine"]
  Golem{{"⚔ Golem"}}
  Axe_Knight{{"⚔ Axe Knight"}}
  Metal_Slime{{"⚔ Metal Slime"}}
  Master_Save["Master save at King Lorik before the endings"]
  Green_Dragon{{"⚔ Green Dragon"}}
  Gwaelin_Rescue_PONR>"⛔ Rescuing Gwaelin (cannot be undone)"]
  Dragonlord{{"⚔ Dragonlord"}}
  Dragonlord_Offer>"⛔ Dragonlord's offer (answer Yes = bad ending)"]
  King_Save_Prompt>"⛔ King's save prompt after Gwaelin's return"]
  Garinham -->|"hidden passage behind the north building"| Garins_Grave
  Garins_Grave -->|"B1F right door, B2F"| Garins_Grave_B3
  Dragonlord --> Dragonlord_Offer
  Master_Save -->|"ending run 2, Gwaelin left in the cave"| Dragonlord
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gwaelin_Rescue_PONR,Dragonlord_Offer,King_Save_Prompt ponr;
  class Blue_Slime,Goldman,Wyvern,Golem,Axe_Knight,Metal_Slime,Green_Dragon,Dragonlord boss;
```

## Chapter 6: Cantlin, Erdrick's Token and Hauksness

```mermaid
flowchart TD
  Cantlin["Cantlin"]
  Golem{{"⚔ Golem"}}
  Erdricks_Token_Swamp["Erdrick's Token Swamp"]
  Hauksness["Hauksness"]
  Axe_Knight{{"⚔ Axe Knight"}}
  Domdora_Desert["Domdora Desert"]
  Metal_Slime{{"⚔ Metal Slime"}}
  Cantlin -->|"south over the bridge"| Erdricks_Token_Swamp
  Hauksness -->|"south of Hauksness"| Domdora_Desert
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Golem,Axe_Knight,Metal_Slime boss;
```

## Chapter 7: The Rainbow Bridge, Charlock Castle and the Master Save

```mermaid
flowchart TD
  Rainbow_Drop_Shrine["Rainbow Drop Shrine"]
  Rainbow_Bridge["Rainbow Bridge"]
  Charlock_Castle["Charlock Castle"]
  Charlock_Depths["Charlock Castle Depths"]
  Master_Save["Master save at King Lorik before the endings"]
  Green_Dragon{{"⚔ Green Dragon"}}
  Gwaelin_Rescue_PONR>"⛔ Rescuing Gwaelin (cannot be undone)"]
  Dragonlord{{"⚔ Dragonlord"}}
  Dragonlord_Offer>"⛔ Dragonlord's offer (answer Yes = bad ending)"]
  King_Save_Prompt>"⛔ King's save prompt after Gwaelin's return"]
  Rainbow_Bridge --> Charlock_Castle
  Charlock_Castle -->|"secret stairs"| Charlock_Depths
  Charlock_Castle -->|"Return, save at the King"| Master_Save
  Charlock_Castle -->|"courtyard throne"| Dragonlord
  Dragonlord --> Dragonlord_Offer
  Master_Save -->|"ending run 2, Gwaelin left in the cave"| Dragonlord
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gwaelin_Rescue_PONR,Dragonlord_Offer,King_Save_Prompt ponr;
  class Green_Dragon,Dragonlord boss;
```

## Chapter 8: Ending Run 1: Gwaelin at Your Side

```mermaid
flowchart TD
  Swamp_Cave["Swamp Cave"]
  Goldman{{"⚔ Goldman"}}
  Wyvern{{"⚔ Wyvern"}}
  Charlock_Castle["Charlock Castle"]
  Master_Save["Master save at King Lorik before the endings"]
  Green_Dragon{{"⚔ Green Dragon"}}
  Gwaelin_Rescue_PONR>"⛔ Rescuing Gwaelin (cannot be undone)"]
  Dragonlord{{"⚔ Dragonlord"}}
  Dragonlord_Offer>"⛔ Dragonlord's offer (answer Yes = bad ending)"]
  King_Save_Prompt>"⛔ King's save prompt after Gwaelin's return"]
  Charlock_Castle -->|"Return, save at the King"| Master_Save
  Master_Save -->|"ending run 1"| Swamp_Cave
  Charlock_Castle -->|"courtyard throne"| Dragonlord
  Dragonlord --> Dragonlord_Offer
  Master_Save -->|"ending run 2, Gwaelin left in the cave"| Dragonlord
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gwaelin_Rescue_PONR,Dragonlord_Offer,King_Save_Prompt ponr;
  class Goldman,Wyvern,Green_Dragon,Dragonlord boss;
```

## Chapter 9: Ending Run 2: Without the Princess

```mermaid
flowchart TD
  Tantegel_Castle["Tantegel Castle"]
  King_Lorik["King Lorik (save point)"]
  Blue_Slime{{"⚔ Blue Slime"}}
  Mountain_Cave_B2["Mountain Cave B2"]
  Goldman{{"⚔ Goldman"}}
  Wyvern{{"⚔ Wyvern"}}
  Golem{{"⚔ Golem"}}
  Axe_Knight{{"⚔ Axe Knight"}}
  Metal_Slime{{"⚔ Metal Slime"}}
  Charlock_Castle["Charlock Castle"]
  Master_Save["Master save at King Lorik before the endings"]
  Green_Dragon{{"⚔ Green Dragon"}}
  Gwaelin_Rescue_PONR>"⛔ Rescuing Gwaelin (cannot be undone)"]
  Dragonlord{{"⚔ Dragonlord"}}
  Dragonlord_Offer>"⛔ Dragonlord's offer (answer Yes = bad ending)"]
  King_Save_Prompt>"⛔ King's save prompt after Gwaelin's return"]
  Charlock_Castle -->|"Return, save at the King"| Master_Save
  Charlock_Castle -->|"courtyard throne"| Dragonlord
  Dragonlord --> Dragonlord_Offer
  Master_Save -->|"ending run 2, Gwaelin left in the cave"| Dragonlord
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gwaelin_Rescue_PONR,Dragonlord_Offer,King_Save_Prompt ponr;
  class Blue_Slime,Goldman,Wyvern,Golem,Axe_Knight,Metal_Slime,Green_Dragon,Dragonlord boss;
```

## Chapter 10: Ending Run 3: Gwaelin Home and the Dragonlord's Offer

```mermaid
flowchart TD
  Tantegel_Castle["Tantegel Castle"]
  King_Lorik["King Lorik (save point)"]
  Blue_Slime{{"⚔ Blue Slime"}}
  Swamp_Cave["Swamp Cave"]
  Goldman{{"⚔ Goldman"}}
  Wyvern{{"⚔ Wyvern"}}
  Golem{{"⚔ Golem"}}
  Axe_Knight{{"⚔ Axe Knight"}}
  Metal_Slime{{"⚔ Metal Slime"}}
  Master_Save["Master save at King Lorik before the endings"]
  Green_Dragon{{"⚔ Green Dragon"}}
  Gwaelin_Rescue_PONR>"⛔ Rescuing Gwaelin (cannot be undone)"]
  Dragonlord{{"⚔ Dragonlord"}}
  Dragonlord_Offer>"⛔ Dragonlord's offer (answer Yes = bad ending)"]
  King_Save_Prompt>"⛔ King's save prompt after Gwaelin's return"]
  Master_Save -->|"ending run 1"| Swamp_Cave
  Dragonlord --> Dragonlord_Offer
  Master_Save -->|"ending run 2, Gwaelin left in the cave"| Dragonlord
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gwaelin_Rescue_PONR,Dragonlord_Offer,King_Save_Prompt ponr;
  class Blue_Slime,Goldman,Wyvern,Golem,Axe_Knight,Metal_Slime,Green_Dragon,Dragonlord boss;
```
