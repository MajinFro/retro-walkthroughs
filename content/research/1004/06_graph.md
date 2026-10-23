# Knowledge graph — game 1004

Nodes: 149 · Edges: 156

## Progression flow

```mermaid
flowchart TD
  Fortress_of_Doom["Fortress of Doom"]
  Gades_Prologue{{"⚔ Gades (prologue)"}}
  Amon_Prologue{{"⚔ Amon (prologue)"}}
  Erim{{"⚔ Erim"}}
  Daos_Prologue{{"⚔ Daos (prologue)"}}
  Alekia["Alekia"]
  Chatam["Chatam"]
  Cave_North_of_Chatam["Cave North of Chatam"]
  Cave_to_Sheran["Cave to Sheran"]
  Sheran["Sheran"]
  Gades_Sheran{{"⚔ Gades (Sheran)"}}
  Treck["Treck"]
  East_Cave["East Cave"]
  Guys_House["Guy's House"]
  Demon_Lords{{"⚔ Demon Lords"}}
  Cave_to_Maberia["Cave to Maberia"]
  Goblins{{"⚔ Goblins"}}
  Lorbenia["Lorbenia"]
  Grenoble["Grenoble"]
  Old_Cave["Old Cave"]
  Old_Cave_2["Old Cave 2nd Level"]
  Old_Cave_3["Old Cave 3rd Level"]
  Old_Cave_4["Old Cave 4th Level"]
  Old_Cave_5["Old Cave 5th Level"]
  Old_Cave_6["Old Cave 6th Level"]
  Old_Cave_7["Old Cave 7th Level"]
  Northwest_Tower["Northwest Tower"]
  Apprentice{{"⚔ Apprentice"}}
  Kirof["Kirof"]
  Medan["Medan"]
  Ghost_Cave["Ghost Cave"]
  Phantasm{{"⚔ Phantasm"}}
  Medan_Mine["Medan Mine"]
  Cave_East_of_Medan["Cave East of Medan"]
  Belgen["Belgen"]
  Southwest_Cave["Southwest Cave"]
  Cave_to_Dais["Cave to Dais"]
  Dais["Dais"]
  North_Tower["North Tower"]
  Follower{{"⚔ Follower"}}
  Surinagal["Surinagal"]
  Lost_Forest_Guide_Station["Lost Forest Guide Station"]
  Lost_Forest["Lost Forest"]
  Jenoba["Jenoba"]
  Blue_Tower["Blue Tower"]
  Green_Tower["Green Tower"]
  Ruan["Ruan"]
  Red_Tower["Red Tower"]
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Elfrea["Elfrea"]
  Ranqs["Ranqs"]
  Odel_Tunnel["Odel Tunnel"]
  Odel["Odel"]
  Lyden["Lyden"]
  Arus_Cave["Arus Cave"]
  Arus["Arus"]
  Tower_of_Grief["Tower of Grief"]
  Platina["Platina"]
  Carbis["Carbis"]
  Forfeit["Forfeit"]
  Tower_of_Light["Tower of Light"]
  Bakku["Bakku"]
  Guardian{{"⚔ Guardian"}}
  Linze["Linze"]
  Gayas_Island_Cave["Gayas Island Cave"]
  Cave_to_Marse["Cave to Marse"]
  Marse["Marse"]
  Loire_Island_Cave["Loire Island Cave"]
  Elba_Ulupp_Caves["Elba & Ulupp Island Caves"]
  Herat["Herat"]
  Herat_Castle["Herat Castle"]
  Purple_Newt_Cave["Purple Newt Cave"]
  Aisen_Tower["Aisen Tower"]
  Bosun{{"⚔ Bosun"}}
  Soshette["Soshette"]
  Under_Ring_Island["Under Ring Island"]
  Doom_Island["Doom Island"]
  Epro["Epro"]
  East_Lagoon["East Lagoon"]
  Oil_Cave["Oil Cave"]
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Frederia["Frederia"]
  Dragon_Shrine["Dragon Shrine"]
  Arubus["Arubus"]
  Cave_North_of_Glasdar["Cave North of Glasdar"]
  Cave_to_Glasdar_Tower["Cave to Glasdar Tower"]
  Glasdar_Tower["Glasdar Tower"]
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Fortress_of_Doom -->|"Bridge"| Gades_Prologue
  Gades_Prologue -->|"Heal, go north"| Amon_Prologue
  Amon_Prologue -->|"Heal, continue"| Erim
  Erim -->|"Last Sinistral"| Daos_Prologue
  Daos_Prologue -->|"99 years later"| Alekia
  Alekia -->|"North"| Chatam
  Chatam -->|"North entrance"| Cave_North_of_Chatam
  Chatam -->|"West entrance"| Cave_to_Sheran
  Cave_to_Sheran -->|"West exit"| Sheran
  Sheran -->|"Unwinnable battle"| Gades_Sheran
  Gades_Sheran -->|"Wake in Alekia"| Alekia
  Alekia -->|"Via Chatam"| Treck
  Treck -->|"East"| East_Cave
  East_Cave -->|"Cave exit"| Guys_House
  Treck -->|"Docks"| Demon_Lords
  Demon_Lords -->|"North cave"| Cave_to_Maberia
  Cave_to_Maberia -->|"Ship ambush"| Goblins
  Goblins -->|"Sail"| Lorbenia
  Lorbenia -->|"Road"| Grenoble
  Grenoble -->|"Old Cave"| Old_Cave
  Grenoble -->|"Tower"| Northwest_Tower
  Northwest_Tower -->|"Top floor"| Apprentice
  Apprentice -->|"Warp shrine"| Kirof
  Kirof -->|"Road"| Medan
  Kirof -->|"North cave"| Ghost_Cave
  Ghost_Cave -->|"Boss room"| Phantasm
  Medan -->|"Mine"| Medan_Mine
  Medan -->|"East"| Cave_East_of_Medan
  Cave_East_of_Medan -->|"Bridge guards"| Belgen
  Belgen -->|"Southwest"| Southwest_Cave
  Cave_to_Dais -->|"Cave exit"| Dais
  Dais -->|"North"| North_Tower
  North_Tower -->|"Top"| Follower
  Follower -->|"Return with Jerin"| Belgen
  Belgen -->|"Road"| Surinagal
  Surinagal -->|"Guide station"| Lost_Forest_Guide_Station
  Lost_Forest_Guide_Station -->|"Guide"| Lost_Forest
  Lost_Forest -->|"Forest exit"| Jenoba
  Jenoba -->|"Tower"| Blue_Tower
  Jenoba -->|"Tower"| Green_Tower
  Green_Tower -->|"Road"| Ruan
  Ruan -->|"Return to mine"| Medan_Mine
  Red_Tower -->|"Roof"| Dark_Ghost
  Elfrea -->|"Sail/road"| Ranqs
  Ranqs -->|"Tunnel"| Odel_Tunnel
  Odel_Tunnel -->|"Tunnel exit"| Odel
  Odel -->|"Road"| Lyden
  Odel -->|"Bridge cave"| Arus_Cave
  Arus_Cave -->|"Repaired bridge"| Arus
  Arus -->|"Small cave east"| Tower_of_Grief
  Tower_of_Grief -->|"Warp"| Platina
  Carbis -->|"Sail"| Forfeit
  Forfeit -->|"Sail"| Tower_of_Light
  Tower_of_Light -->|"Next town"| Bakku
  Bakku -->|"Back to Tower of Light"| Guardian
  Linze -->|"Sail"| Gayas_Island_Cave
  Gayas_Island_Cave -->|"Sail"| Cave_to_Marse
  Cave_to_Marse -->|"North"| Marse
  Marse -->|"Sail"| Loire_Island_Cave
  Loire_Island_Cave -->|"Sail"| Elba_Ulupp_Caves
  Elba_Ulupp_Caves -->|"Sail"| Herat
  Herat -->|"East"| Purple_Newt_Cave
  Herat -->|"Aisen Island"| Aisen_Tower
  Aisen_Tower -->|"Top floor"| Bosun
  Bosun -->|"Submarine refit"| Carbis
  Carbis -->|"Sail"| Soshette
  Soshette -->|"Eddies"| Under_Ring_Island
  Under_Ring_Island -->|"Fortress ruins"| Doom_Island
  Epro -->|"Underwater"| East_Lagoon
  East_Lagoon -->|"Cave"| Oil_Cave
  Oil_Cave -->|"Boss"| Oil_Dragon
  Frederia -->|"Fly southwest of Herat"| Dragon_Shrine
  Dragon_Shrine -->|"Fly"| Arubus
  Arubus -->|"North cave"| Cave_North_of_Glasdar
  Cave_to_Glasdar_Tower -->|"Exit"| Glasdar_Tower
  Glasdar_Tower -->|"Top floor"| Nazeby
  Nazeby -->|"Egg quest"| Dragon_Shrine
  Nazeby -->|"Doom Island"| Doom_Island
  Doom_Island -->|"Final fortress"| Gades_Final
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gades_Prologue,Amon_Prologue,Erim,Daos_Prologue,Gades_Sheran,Demon_Lords,Goblins,Apprentice,Phantasm,Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Achievement dependencies

```mermaid
flowchart LR
  Might_Helmet(["⚠ Might Helmet (Tower of Light roof)"])
  Bakku["Bakku"]
  Fortress_of_Doom["Fortress of Doom"]
  Ach_196711(["🏆 First Encounter"])
  Daos_Prologue{{"⚔ Daos (prologue)"}}
  Ach_196718(["🏆 And So It Begins..."])
  Alekia["Alekia"]
  Ach_196717(["🏆 Lufia"])
  Sheran["Sheran"]
  Ach_196719(["🏆 Sheran Rescue"])
  Gades_Sheran{{"⚔ Gades (Sheran)"}}
  Ach_196720(["🏆 Imminent Defeat"])
  Treck["Treck"]
  Ach_196721(["🏆 Aguro"])
  Demon_Lords{{"⚔ Demon Lords"}}
  Ach_196722(["🏆 Demon Horde"])
  Goblins{{"⚔ Goblins"}}
  Ach_196723(["🏆 Goblin Horde"])
  Fairy_Kiss[/"Fairy Kiss"/]
  Ach_187954(["🏆 Fairy Kiss"])
  Apprentice{{"⚔ Apprentice"}}
  Ach_196724(["🏆 Artea's Apprentice"])
  Phantasm{{"⚔ Phantasm"}}
  Ach_196725(["🏆 The Exorcist"])
  Follower{{"⚔ Follower"}}
  Ach_196726(["🏆 Amon's Follower"])
  North_Tower["North Tower"]
  Ach_196727(["🏆 Jerin"])
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Ach_196728(["🏆 Who You Gonna Call?"])
  Elfrea["Elfrea"]
  Ach_187955(["🏆 The Elven Village"])
  Arus_Cave["Arus Cave"]
  Ach_187957(["🏆 Building Bridges"])
  Falcon[/"Falcon"/]
  Ach_187958(["🏆 All Aboard!"])
  Ach_187956(["🏆 Mighty Intelligence"])
  Old_Cave_5["Old Cave 5th Level"]
  Ach_187966(["🏆 Escape Artist"])
  Old_Cave_7["Old Cave 7th Level"]
  Ach_196739(["🏆 World's Greatest"])
  Guardian{{"⚔ Guardian"}}
  Ach_196730(["🏆 Guardian"])
  Loire_Island_Cave["Loire Island Cave"]
  Ach_187967(["🏆 Holes, Holes, and a Brant"])
  Purple_Newt[/"Purple Newt"/]
  Ach_187960(["🏆 We're Off to See the Wizard... Of Taste!"])
  Aisen_Tower["Aisen Tower"]
  Ach_187968(["🏆 Riddle Me This..."])
  Bosun{{"⚔ Bosun"}}
  Ach_196732(["🏆 For Freedom!"])
  Under_Ring_Island["Under Ring Island"]
  Ach_187969(["🏆 Under the Sea, Under the Sea"])
  Dual_Blade[/"Dual Blade"/]
  Ach_196734(["🏆 Sin Slayer"])
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Ach_196735(["🏆 Power the Falcon"])
  Frederia["Frederia"]
  Ach_187970(["🏆 Soaring the Skies"])
  Glasdar_Key[/"Glasdar Key"/]
  Ach_187971(["🏆 The Glasdar Key"])
  Nazeby{{"⚔ Nazeby"}}
  Ach_196736(["🏆 The Agent of Daos"])
  Guard_Daos{{"⚔ Guard Daos"}}
  Ach_196733(["🏆 One-Hundred Years"])
  Dragon_Shrine["Dragon Shrine"]
  Ach_187959(["🏆 I Feel Like Having Dragon Eggs for Breakfast"])
  East_Lagoon["East Lagoon"]
  Ach_187961(["🏆 Stronger Than the Sword of Legends"])
  Ach_187964(["🏆 Elven Warfare"])
  Ach_187962(["🏆 A Hero's Mightiest Shield"])
  Ach_187963(["🏆 Armor of Might"])
  Forfeit["Forfeit"]
  Ach_187965(["🏆 The Black Market"])
  Ach_196731(["🏆 Dragon's Wish"])
  Ach_196712(["🏆 Heavy Pockets"])
  Ach_196729(["🏆 Item Burden"])
  Ach_196713(["🏆 Better Than a Knife"])
  Ach_196714(["🏆 Level 5!"])
  Old_Cave_6["Old Cave 6th Level"]
  Ach_196715(["🏆 Level 25!"])
  Ach_196716(["🏆 Level 50!"])
  Ach_196738(["🏆 Treasure Seeker"])
  Ach_196737(["🏆 Treasure Hunter"])
  Might_Helmet -.->|missable before| Bakku
  Fortress_of_Doom -->|unlocks| Ach_196711
  Daos_Prologue -->|unlocks| Ach_196718
  Alekia -->|unlocks| Ach_196717
  Sheran -->|unlocks| Ach_196719
  Gades_Sheran -->|unlocks| Ach_196720
  Treck -->|unlocks| Ach_196721
  Demon_Lords -->|unlocks| Ach_196722
  Goblins -->|unlocks| Ach_196723
  Fairy_Kiss -->|unlocks| Ach_187954
  Apprentice -->|unlocks| Ach_196724
  Phantasm -->|unlocks| Ach_196725
  Follower -->|unlocks| Ach_196726
  North_Tower -->|unlocks| Ach_196727
  Dark_Ghost -->|unlocks| Ach_196728
  Elfrea -->|unlocks| Ach_187955
  Arus_Cave -->|unlocks| Ach_187957
  Falcon -->|unlocks| Ach_187958
  Might_Helmet -->|unlocks| Ach_187956
  Old_Cave_5 -->|unlocks| Ach_187966
  Old_Cave_7 -->|unlocks| Ach_196739
  Guardian -->|unlocks| Ach_196730
  Loire_Island_Cave -->|unlocks| Ach_187967
  Purple_Newt -->|unlocks| Ach_187960
  Aisen_Tower -->|unlocks| Ach_187968
  Bosun -->|unlocks| Ach_196732
  Under_Ring_Island -->|unlocks| Ach_187969
  Dual_Blade -->|unlocks| Ach_196734
  Oil_Dragon -->|unlocks| Ach_196735
  Frederia -->|unlocks| Ach_187970
  Glasdar_Key -->|unlocks| Ach_187971
  Nazeby -->|unlocks| Ach_196736
  Guard_Daos -->|unlocks| Ach_196733
  Dragon_Shrine -->|unlocks| Ach_187959
  East_Lagoon -->|unlocks| Ach_187961
  Dragon_Shrine -->|unlocks| Ach_187964
  Dragon_Shrine -->|unlocks| Ach_187962
  East_Lagoon -->|unlocks| Ach_187963
  Forfeit -->|unlocks| Ach_187965
  Dragon_Shrine -->|unlocks| Ach_196731
  East_Lagoon -->|unlocks| Ach_196712
  Forfeit -->|unlocks| Ach_196729
  Alekia -->|unlocks| Ach_196713
  Treck -->|unlocks| Ach_196714
  Old_Cave_6 -->|unlocks| Ach_196715
  East_Lagoon -->|unlocks| Ach_196716
  Old_Cave_5 -->|unlocks| Ach_196738
  Aisen_Tower -->|unlocks| Ach_196737
```

## Chapter 1: Prologue: The Fortress of Doom

```mermaid
flowchart TD
  Fortress_of_Doom["Fortress of Doom"]
  Gades_Prologue{{"⚔ Gades (prologue)"}}
  Amon_Prologue{{"⚔ Amon (prologue)"}}
  Erim{{"⚔ Erim"}}
  Daos_Prologue{{"⚔ Daos (prologue)"}}
  Gades_Sheran{{"⚔ Gades (Sheran)"}}
  Demon_Lords{{"⚔ Demon Lords"}}
  Goblins{{"⚔ Goblins"}}
  Apprentice{{"⚔ Apprentice"}}
  Phantasm{{"⚔ Phantasm"}}
  Follower{{"⚔ Follower"}}
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Fortress_of_Doom -->|"Bridge"| Gades_Prologue
  Gades_Prologue -->|"Heal, go north"| Amon_Prologue
  Amon_Prologue -->|"Heal, continue"| Erim
  Erim -->|"Last Sinistral"| Daos_Prologue
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gades_Prologue,Amon_Prologue,Erim,Daos_Prologue,Gades_Sheran,Demon_Lords,Goblins,Apprentice,Phantasm,Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 2: Alekia, Chatam and the Fall of Sheran

```mermaid
flowchart TD
  Alekia["Alekia"]
  Chatam["Chatam"]
  Cave_North_of_Chatam["Cave North of Chatam"]
  Cave_to_Sheran["Cave to Sheran"]
  Sheran["Sheran"]
  Gades_Sheran{{"⚔ Gades (Sheran)"}}
  Demon_Lords{{"⚔ Demon Lords"}}
  Goblins{{"⚔ Goblins"}}
  Apprentice{{"⚔ Apprentice"}}
  Phantasm{{"⚔ Phantasm"}}
  Follower{{"⚔ Follower"}}
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Alekia -->|"North"| Chatam
  Chatam -->|"North entrance"| Cave_North_of_Chatam
  Chatam -->|"West entrance"| Cave_to_Sheran
  Cave_to_Sheran -->|"West exit"| Sheran
  Sheran -->|"Unwinnable battle"| Gades_Sheran
  Gades_Sheran -->|"Wake in Alekia"| Alekia
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gades_Sheran,Demon_Lords,Goblins,Apprentice,Phantasm,Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 3: Treck, Aguro and the Goblin Pirates

```mermaid
flowchart TD
  Treck["Treck"]
  East_Cave["East Cave"]
  Guys_House["Guy's House"]
  Demon_Lords{{"⚔ Demon Lords"}}
  Cave_to_Maberia["Cave to Maberia"]
  Goblins{{"⚔ Goblins"}}
  Lorbenia["Lorbenia"]
  Apprentice{{"⚔ Apprentice"}}
  Phantasm{{"⚔ Phantasm"}}
  Follower{{"⚔ Follower"}}
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Treck -->|"East"| East_Cave
  East_Cave -->|"Cave exit"| Guys_House
  Treck -->|"Docks"| Demon_Lords
  Demon_Lords -->|"North cave"| Cave_to_Maberia
  Cave_to_Maberia -->|"Ship ambush"| Goblins
  Goblins -->|"Sail"| Lorbenia
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Demon_Lords,Goblins,Apprentice,Phantasm,Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 4: Grenoble, the Old Cave and Artea's Apprentice

```mermaid
flowchart TD
  Grenoble["Grenoble"]
  Old_Cave["Old Cave"]
  Old_Cave_2["Old Cave 2nd Level"]
  Old_Cave_3["Old Cave 3rd Level"]
  Northwest_Tower["Northwest Tower"]
  Apprentice{{"⚔ Apprentice"}}
  Phantasm{{"⚔ Phantasm"}}
  Follower{{"⚔ Follower"}}
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Grenoble -->|"Old Cave"| Old_Cave
  Grenoble -->|"Tower"| Northwest_Tower
  Northwest_Tower -->|"Top floor"| Apprentice
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Apprentice,Phantasm,Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 5: Kirof, Medan and the Phantasm

```mermaid
flowchart TD
  Kirof["Kirof"]
  Medan["Medan"]
  Ghost_Cave["Ghost Cave"]
  Phantasm{{"⚔ Phantasm"}}
  Medan_Mine["Medan Mine"]
  Follower{{"⚔ Follower"}}
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Kirof -->|"Road"| Medan
  Kirof -->|"North cave"| Ghost_Cave
  Ghost_Cave -->|"Boss room"| Phantasm
  Medan -->|"Mine"| Medan_Mine
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Phantasm,Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 6: Belgen, Dais and the Rescue of Jerin

```mermaid
flowchart TD
  Old_Cave["Old Cave"]
  Old_Cave_4["Old Cave 4th Level"]
  Cave_East_of_Medan["Cave East of Medan"]
  Belgen["Belgen"]
  Southwest_Cave["Southwest Cave"]
  Cave_to_Dais["Cave to Dais"]
  Dais["Dais"]
  North_Tower["North Tower"]
  Follower{{"⚔ Follower"}}
  Surinagal["Surinagal"]
  Lost_Forest_Guide_Station["Lost Forest Guide Station"]
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Cave_East_of_Medan -->|"Bridge guards"| Belgen
  Belgen -->|"Southwest"| Southwest_Cave
  Cave_to_Dais -->|"Cave exit"| Dais
  Dais -->|"North"| North_Tower
  North_Tower -->|"Top"| Follower
  Follower -->|"Return with Jerin"| Belgen
  Belgen -->|"Road"| Surinagal
  Surinagal -->|"Guide station"| Lost_Forest_Guide_Station
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 7: Lost Forest, the Three Towers and Elfrea

```mermaid
flowchart TD
  Old_Cave["Old Cave"]
  Old_Cave_5["Old Cave 5th Level"]
  Medan_Mine["Medan Mine"]
  Lost_Forest["Lost Forest"]
  Jenoba["Jenoba"]
  Blue_Tower["Blue Tower"]
  Green_Tower["Green Tower"]
  Ruan["Ruan"]
  Red_Tower["Red Tower"]
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Elfrea["Elfrea"]
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Lost_Forest -->|"Forest exit"| Jenoba
  Jenoba -->|"Tower"| Blue_Tower
  Jenoba -->|"Tower"| Green_Tower
  Green_Tower -->|"Road"| Ruan
  Ruan -->|"Return to mine"| Medan_Mine
  Red_Tower -->|"Roof"| Dark_Ghost
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 8: Ranqs, Odel and Piron's Bridge

```mermaid
flowchart TD
  Old_Cave["Old Cave"]
  Old_Cave_6["Old Cave 6th Level"]
  Ranqs["Ranqs"]
  Odel_Tunnel["Odel Tunnel"]
  Odel["Odel"]
  Lyden["Lyden"]
  Arus_Cave["Arus Cave"]
  Arus["Arus"]
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Ranqs -->|"Tunnel"| Odel_Tunnel
  Odel_Tunnel -->|"Tunnel exit"| Odel
  Odel -->|"Road"| Lyden
  Odel -->|"Bridge cave"| Arus_Cave
  Arus_Cave -->|"Repaired bridge"| Arus
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 9: Tower of Grief, the Falcon and Forfeit

```mermaid
flowchart TD
  Tower_of_Grief["Tower of Grief"]
  Platina["Platina"]
  Carbis["Carbis"]
  Forfeit["Forfeit"]
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Tower_of_Grief -->|"Warp"| Platina
  Carbis -->|"Sail"| Forfeit
  Bosun -->|"Submarine refit"| Carbis
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 10: Tower of Light, Bakku and the Old Cave's Last Floor

```mermaid
flowchart TD
  Old_Cave["Old Cave"]
  Old_Cave_5["Old Cave 5th Level"]
  Old_Cave_7["Old Cave 7th Level"]
  Tower_of_Light["Tower of Light"]
  Bakku["Bakku"]
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Tower_of_Light -->|"Next town"| Bakku
  Bakku -->|"Back to Tower of Light"| Guardian
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 11: Linze, the Alumina Hunt and Brant

```mermaid
flowchart TD
  Linze["Linze"]
  Gayas_Island_Cave["Gayas Island Cave"]
  Cave_to_Marse["Cave to Marse"]
  Marse["Marse"]
  Loire_Island_Cave["Loire Island Cave"]
  Elba_Ulupp_Caves["Elba & Ulupp Island Caves"]
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Linze -->|"Sail"| Gayas_Island_Cave
  Gayas_Island_Cave -->|"Sail"| Cave_to_Marse
  Cave_to_Marse -->|"North"| Marse
  Marse -->|"Sail"| Loire_Island_Cave
  Loire_Island_Cave -->|"Sail"| Elba_Ulupp_Caves
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 12: Herat, the Purple Newt and Aisen Tower

```mermaid
flowchart TD
  Lyden["Lyden"]
  Herat["Herat"]
  Herat_Castle["Herat Castle"]
  Purple_Newt_Cave["Purple Newt Cave"]
  Aisen_Tower["Aisen Tower"]
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Herat -->|"East"| Purple_Newt_Cave
  Herat -->|"Aisen Island"| Aisen_Tower
  Aisen_Tower -->|"Top floor"| Bosun
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 13: Under the Sea: Soshette and the Dual Blade

```mermaid
flowchart TD
  Carbis["Carbis"]
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Soshette["Soshette"]
  Under_Ring_Island["Under Ring Island"]
  Doom_Island["Doom Island"]
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Bosun -->|"Submarine refit"| Carbis
  Carbis -->|"Sail"| Soshette
  Soshette -->|"Eddies"| Under_Ring_Island
  Under_Ring_Island -->|"Fortress ruins"| Doom_Island
  Nazeby -->|"Doom Island"| Doom_Island
  Doom_Island -->|"Final fortress"| Gades_Final
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 14: Epro, the Oil Dragon and the Might Farm

```mermaid
flowchart TD
  Epro["Epro"]
  East_Lagoon["East Lagoon"]
  Oil_Cave["Oil Cave"]
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Frederia["Frederia"]
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Epro -->|"Underwater"| East_Lagoon
  East_Lagoon -->|"Cave"| Oil_Cave
  Oil_Cave -->|"Boss"| Oil_Dragon
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 15: The First Dragon Wish and the Second Egg Hunt

```mermaid
flowchart TD
  Alekia["Alekia"]
  Gades_Sheran{{"⚔ Gades (Sheran)"}}
  Demon_Lords{{"⚔ Demon Lords"}}
  Goblins{{"⚔ Goblins"}}
  Northwest_Tower["Northwest Tower"]
  Apprentice{{"⚔ Apprentice"}}
  Phantasm{{"⚔ Phantasm"}}
  Belgen["Belgen"]
  Southwest_Cave["Southwest Cave"]
  Follower{{"⚔ Follower"}}
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Guardian{{"⚔ Guardian"}}
  Cave_to_Marse["Cave to Marse"]
  Elba_Ulupp_Caves["Elba & Ulupp Island Caves"]
  Bosun{{"⚔ Bosun"}}
  Under_Ring_Island["Under Ring Island"]
  Oil_Cave["Oil Cave"]
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Dragon_Shrine["Dragon Shrine"]
  Arubus["Arubus"]
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Gades_Sheran -->|"Wake in Alekia"| Alekia
  Northwest_Tower -->|"Top floor"| Apprentice
  Belgen -->|"Southwest"| Southwest_Cave
  Follower -->|"Return with Jerin"| Belgen
  Oil_Cave -->|"Boss"| Oil_Dragon
  Dragon_Shrine -->|"Fly"| Arubus
  Nazeby -->|"Egg quest"| Dragon_Shrine
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gades_Sheran,Demon_Lords,Goblins,Apprentice,Phantasm,Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 16: Glasdar: the Key, the Cave and Nazeby

```mermaid
flowchart TD
  Cave_North_of_Glasdar["Cave North of Glasdar"]
  Cave_to_Glasdar_Tower["Cave to Glasdar Tower"]
  Glasdar_Tower["Glasdar Tower"]
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Cave_to_Glasdar_Tower -->|"Exit"| Glasdar_Tower
  Glasdar_Tower -->|"Top floor"| Nazeby
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 17: The Last Two Wishes and the Might Set

```mermaid
flowchart TD
  Sheran["Sheran"]
  Gades_Sheran{{"⚔ Gades (Sheran)"}}
  East_Cave["East Cave"]
  Demon_Lords{{"⚔ Demon Lords"}}
  Goblins{{"⚔ Goblins"}}
  Old_Cave_7["Old Cave 7th Level"]
  Apprentice{{"⚔ Apprentice"}}
  Phantasm{{"⚔ Phantasm"}}
  Follower{{"⚔ Follower"}}
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Lyden["Lyden"]
  Forfeit["Forfeit"]
  Guardian{{"⚔ Guardian"}}
  Purple_Newt_Cave["Purple Newt Cave"]
  Bosun{{"⚔ Bosun"}}
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Dragon_Shrine["Dragon Shrine"]
  Cave_North_of_Glasdar["Cave North of Glasdar"]
  Cave_to_Glasdar_Tower["Cave to Glasdar Tower"]
  Glasdar_Tower["Glasdar Tower"]
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Sheran -->|"Unwinnable battle"| Gades_Sheran
  Cave_to_Glasdar_Tower -->|"Exit"| Glasdar_Tower
  Glasdar_Tower -->|"Top floor"| Nazeby
  Nazeby -->|"Egg quest"| Dragon_Shrine
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gades_Sheran,Demon_Lords,Goblins,Apprentice,Phantasm,Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```

## Chapter 18: Doom Island: One Hundred Years Later

```mermaid
flowchart TD
  Fortress_of_Doom["Fortress of Doom"]
  Gades_Prologue{{"⚔ Gades (prologue)"}}
  Amon_Prologue{{"⚔ Amon (prologue)"}}
  Erim{{"⚔ Erim"}}
  Daos_Prologue{{"⚔ Daos (prologue)"}}
  Gades_Sheran{{"⚔ Gades (Sheran)"}}
  Demon_Lords{{"⚔ Demon Lords"}}
  Goblins{{"⚔ Goblins"}}
  Apprentice{{"⚔ Apprentice"}}
  Phantasm{{"⚔ Phantasm"}}
  Follower{{"⚔ Follower"}}
  Dark_Ghost{{"⚔ Dark Ghost"}}
  Guardian{{"⚔ Guardian"}}
  Bosun{{"⚔ Bosun"}}
  Doom_Island["Doom Island"]
  Oil_Dragon{{"⚔ Oil Dragon"}}
  Nazeby{{"⚔ Nazeby"}}
  Gades_Final{{"⚔ Gades (Doom Island)"}}
  Amon_Final{{"⚔ Amon (Doom Island)"}}
  Daos_Final{{"⚔ Daos (Doom Island)"}}
  Guard_Daos{{"⚔ Guard Daos"}}
  Fortress_of_Doom -->|"Bridge"| Gades_Prologue
  Gades_Prologue -->|"Heal, go north"| Amon_Prologue
  Amon_Prologue -->|"Heal, continue"| Erim
  Erim -->|"Last Sinistral"| Daos_Prologue
  Nazeby -->|"Doom Island"| Doom_Island
  Doom_Island -->|"Final fortress"| Gades_Final
  Gades_Final -->|"Next"| Amon_Final
  Amon_Final -->|"Next"| Daos_Final
  Daos_Final -->|"Final battle"| Guard_Daos
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Gades_Prologue,Amon_Prologue,Erim,Daos_Prologue,Gades_Sheran,Demon_Lords,Goblins,Apprentice,Phantasm,Follower,Dark_Ghost,Guardian,Bosun,Oil_Dragon,Nazeby,Gades_Final,Amon_Final,Daos_Final,Guard_Daos boss;
```
