# Knowledge graph — game 1984

Nodes: 69 · Edges: 69

## Progression flow

```mermaid
flowchart TD
  Prelude["Chapter 1: Prelude"]
  IceAge["Ice Age"]
  CaveMenCave["Cave Men Cave"]
  YumYumCave["Yum Yum's Cave"]
  YumYum{{"⚔ Yum Yum"}}
  Egypt["Egypt"]
  BorderPass["Border Pass"]
  GiantScorpion{{"⚔ Giant Scorpion"}}
  MonkeySavannah["Monkey Savannah"]
  SavannahA["Savannah Dungeon A"]
  SavannahB["Savannah Dungeon B"]
  Pyramid["Pyramid"]
  MonsterMask{{"⚔ Monster Mask"}}
  London["London"]
  LondonSewers["London Sewers"]
  ZodasCreature{{"⚔ Zoda's Creature"}}
  LondonSewers2["London Sewers 2"]
  ZodaX{{"⚔ Zoda-X"}}
  WildWest["Wild Wild West"]
  GoldCave["Gold Cave"]
  BoulderMiner{{"⚔ Boulder Tossing Miner"}}
  GoldCave2["Gold Cave, Part II"]
  MashingMiner{{"⚔ Mashing Miner"}}
  Italy["Italy"]
  LeosBasement["Leo's Basement"]
  SmallIsland["Small Island"]
  EasternCastle["Eastern Castle"]
  Dracula["Dracula's Castle"]
  ZodaY{{"⚔ Zoda-Y"}}
  Camelot["Camelot"]
  DragonsCave["Dragon's Cave"]
  Knight{{"⚔ Knight"}}
  DragonsCave2["Dragon's Cave, Part II"]
  Dragon{{"⚔ The Dragon"}}
  CIsland["C-Island"]
  Coracola["Coracola Cave"]
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  Prelude --> IceAge
  IceAge --> CaveMenCave
  CaveMenCave --> YumYumCave
  YumYum -->|"Tetrad, then the book"| Egypt
  Egypt --> BorderPass
  GiantScorpion -->|"Camel ride for the pizza"| Egypt
  Egypt -->|"Cleopatra's barge"| MonkeySavannah
  MonkeySavannah -->|"Psychic Shock Wave"| Pyramid
  MonsterMask --> London
  London --> LondonSewers
  ZodasCreature --> LondonSewers2
  ZodaX --> WildWest
  WildWest -->|"Dynamite"| GoldCave
  BoulderMiner --> GoldCave2
  MashingMiner --> Italy
  Italy --> LeosBasement
  LeosBasement -->|"Flying machine"| SmallIsland
  SmallIsland --> EasternCastle
  EasternCastle --> Dracula
  ZodaY --> Camelot
  Camelot --> DragonsCave
  Knight --> DragonsCave2
  Dragon --> CIsland
  CIsland --> Coracola
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class YumYum,GiantScorpion,MonsterMask,ZodasCreature,ZodaX,BoulderMiner,MashingMiner,ZodaY,Knight,Dragon,CSerpent,ZodaZ boss;
```

## Achievement dependencies

```mermaid
flowchart LR
  IceAge["Ice Age"]
  Ach_36882(["🏆 Better Than Nothing"])
  CaveMenCave["Cave Men Cave"]
  Ach_36883(["🏆 A Caveman Weapon"])
  YumYum{{"⚔ Yum Yum"}}
  Ach_36884(["🏆 Your First Tetrad"])
  Egypt["Egypt"]
  Ach_36885(["🏆 Jack of All Trades"])
  Ach_36886(["🏆 Sharp Edge"])
  BorderPass["Border Pass"]
  Ach_36887(["🏆 Thrower"])
  YumYumCave["Yum Yum's Cave"]
  Ach_36888(["🏆 Just Like Link"])
  GiantScorpion{{"⚔ Giant Scorpion"}}
  Ach_36889(["🏆 Slowest Pizza Delivery Ever"])
  SavannahA["Savannah Dungeon A"]
  Ach_36890(["🏆 What Do These Do?"])
  MonkeySavannah["Monkey Savannah"]
  Ach_36891(["🏆 Lost in the Tall Grass"])
  Ach_36892(["🏆 Psychic Power"])
  Pyramid["Pyramid"]
  Ach_36893(["🏆 Snake Charmer"])
  MonsterMask{{"⚔ Monster Mask"}}
  Ach_36894(["🏆 Egyptian Tetris"])
  London["London"]
  Ach_36895(["🏆 Down the Sewers"])
  LondonSewers2["London Sewers 2"]
  Ach_36896(["🏆 That Does NOT Look Like a Ball"])
  ZodaX{{"⚔ Zoda-X"}}
  Ach_36897(["🏆 The Mystery of the Tetrad"])
  WildWest["Wild Wild West"]
  Ach_36898(["🏆 Not Quite a Gold Nugget"])
  Ach_36899(["🏆 Real Gold"])
  Ach_36900(["🏆 Heart of Gold"])
  GoldCave["Gold Cave"]
  Ach_36901(["🏆 Not the Traditional Weapon"])
  GoldCave2["Gold Cave, Part II"]
  Ach_36902(["🏆 Super Psychic Shock Wave"])
  Ach_36903(["🏆 Just Like Mario"])
  MashingMiner{{"⚔ Mashing Miner"}}
  Ach_36904(["🏆 Tetrad in a Western"])
  LeosBasement["Leo's Basement"]
  Ach_36905(["🏆 Now We Got a Sword"])
  SmallIsland["Small Island"]
  Ach_36906(["🏆 Heart on the Lone Island"])
  EasternCastle["Eastern Castle"]
  Ach_36907(["🏆 Watch Out for Pits!"])
  Dracula["Dracula's Castle"]
  Ach_36908(["🏆 Triple the Fun"])
  ZodaY{{"⚔ Zoda-Y"}}
  Ach_36909(["🏆 House of the Undead"])
  DragonsCave["Dragon's Cave"]
  Ach_36910(["🏆 Ultra Psychic Shock Wave"])
  Dragon{{"⚔ The Dragon"}}
  Ach_36911(["🏆 The Middle Ages"])
  ZodaZ{{"⚔ Zoda-Z"}}
  Ach_36912(["🏆 C-Island is Normal Again!"])
  IceAge -->|unlocks| Ach_36882
  CaveMenCave -->|unlocks| Ach_36883
  YumYum -->|unlocks| Ach_36884
  Egypt -->|unlocks| Ach_36885
  Egypt -->|unlocks| Ach_36886
  BorderPass -->|unlocks| Ach_36887
  YumYumCave -->|unlocks| Ach_36888
  GiantScorpion -->|unlocks| Ach_36889
  SavannahA -->|unlocks| Ach_36890
  MonkeySavannah -->|unlocks| Ach_36891
  MonkeySavannah -->|unlocks| Ach_36892
  Pyramid -->|unlocks| Ach_36893
  MonsterMask -->|unlocks| Ach_36894
  London -->|unlocks| Ach_36895
  LondonSewers2 -->|unlocks| Ach_36896
  ZodaX -->|unlocks| Ach_36897
  WildWest -->|unlocks| Ach_36898
  WildWest -->|unlocks| Ach_36899
  WildWest -->|unlocks| Ach_36900
  GoldCave -->|unlocks| Ach_36901
  GoldCave2 -->|unlocks| Ach_36902
  GoldCave2 -->|unlocks| Ach_36903
  MashingMiner -->|unlocks| Ach_36904
  LeosBasement -->|unlocks| Ach_36905
  SmallIsland -->|unlocks| Ach_36906
  EasternCastle -->|unlocks| Ach_36907
  Dracula -->|unlocks| Ach_36908
  ZodaY -->|unlocks| Ach_36909
  DragonsCave -->|unlocks| Ach_36910
  Dragon -->|unlocks| Ach_36911
  ZodaZ -->|unlocks| Ach_36912
```

## Chapter 1: Prelude

```mermaid
flowchart TD
  Prelude["Chapter 1: Prelude"]
  YumYum{{"⚔ Yum Yum"}}
  GiantScorpion{{"⚔ Giant Scorpion"}}
  MonsterMask{{"⚔ Monster Mask"}}
  ZodasCreature{{"⚔ Zoda's Creature"}}
  ZodaX{{"⚔ Zoda-X"}}
  BoulderMiner{{"⚔ Boulder Tossing Miner"}}
  MashingMiner{{"⚔ Mashing Miner"}}
  ZodaY{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ The Dragon"}}
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class YumYum,GiantScorpion,MonsterMask,ZodasCreature,ZodaX,BoulderMiner,MashingMiner,ZodaY,Knight,Dragon,CSerpent,ZodaZ boss;
```

## Chapter 2: The Ice Age

```mermaid
flowchart TD
  IceAge["Ice Age"]
  CaveMenCave["Cave Men Cave"]
  YumYumCave["Yum Yum's Cave"]
  YumYum{{"⚔ Yum Yum"}}
  GiantScorpion{{"⚔ Giant Scorpion"}}
  MonsterMask{{"⚔ Monster Mask"}}
  ZodasCreature{{"⚔ Zoda's Creature"}}
  ZodaX{{"⚔ Zoda-X"}}
  BoulderMiner{{"⚔ Boulder Tossing Miner"}}
  MashingMiner{{"⚔ Mashing Miner"}}
  ZodaY{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ The Dragon"}}
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  IceAge --> CaveMenCave
  CaveMenCave --> YumYumCave
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class YumYum,GiantScorpion,MonsterMask,ZodasCreature,ZodaX,BoulderMiner,MashingMiner,ZodaY,Knight,Dragon,CSerpent,ZodaZ boss;
```

## Chapter 3: Cleopatra's Egypt

```mermaid
flowchart TD
  Egypt["Egypt"]
  BorderPass["Border Pass"]
  GiantScorpion{{"⚔ Giant Scorpion"}}
  MonkeySavannah["Monkey Savannah"]
  SavannahA["Savannah Dungeon A"]
  SavannahB["Savannah Dungeon B"]
  Pyramid["Pyramid"]
  MonsterMask{{"⚔ Monster Mask"}}
  ZodasCreature{{"⚔ Zoda's Creature"}}
  ZodaX{{"⚔ Zoda-X"}}
  BoulderMiner{{"⚔ Boulder Tossing Miner"}}
  MashingMiner{{"⚔ Mashing Miner"}}
  ZodaY{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ The Dragon"}}
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  Egypt --> BorderPass
  GiantScorpion -->|"Camel ride for the pizza"| Egypt
  Egypt -->|"Cleopatra's barge"| MonkeySavannah
  MonkeySavannah -->|"Psychic Shock Wave"| Pyramid
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class GiantScorpion,MonsterMask,ZodasCreature,ZodaX,BoulderMiner,MashingMiner,ZodaY,Knight,Dragon,CSerpent,ZodaZ boss;
```

## Chapter 4: Holmes's London

```mermaid
flowchart TD
  London["London"]
  LondonSewers["London Sewers"]
  ZodasCreature{{"⚔ Zoda's Creature"}}
  LondonSewers2["London Sewers 2"]
  ZodaX{{"⚔ Zoda-X"}}
  BoulderMiner{{"⚔ Boulder Tossing Miner"}}
  MashingMiner{{"⚔ Mashing Miner"}}
  ZodaY{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ The Dragon"}}
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  London --> LondonSewers
  ZodasCreature --> LondonSewers2
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class ZodasCreature,ZodaX,BoulderMiner,MashingMiner,ZodaY,Knight,Dragon,CSerpent,ZodaZ boss;
```

## Chapter 5: The Wild West

```mermaid
flowchart TD
  WildWest["Wild Wild West"]
  GoldCave["Gold Cave"]
  BoulderMiner{{"⚔ Boulder Tossing Miner"}}
  GoldCave2["Gold Cave, Part II"]
  MashingMiner{{"⚔ Mashing Miner"}}
  ZodaY{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ The Dragon"}}
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  WildWest -->|"Dynamite"| GoldCave
  BoulderMiner --> GoldCave2
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class BoulderMiner,MashingMiner,ZodaY,Knight,Dragon,CSerpent,ZodaZ boss;
```

## Chapter 6: Leonardo's Italy

```mermaid
flowchart TD
  Italy["Italy"]
  LeosBasement["Leo's Basement"]
  SmallIsland["Small Island"]
  EasternCastle["Eastern Castle"]
  ZodaY{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ The Dragon"}}
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  Italy --> LeosBasement
  LeosBasement -->|"Flying machine"| SmallIsland
  SmallIsland --> EasternCastle
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class ZodaY,Knight,Dragon,CSerpent,ZodaZ boss;
```

## Chapter 7: Dracula's Transylvania

```mermaid
flowchart TD
  Dracula["Dracula's Castle"]
  ZodaY{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ The Dragon"}}
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class ZodaY,Knight,Dragon,CSerpent,ZodaZ boss;
```

## Chapter 8: King Arthur's Camelot

```mermaid
flowchart TD
  Camelot["Camelot"]
  DragonsCave["Dragon's Cave"]
  Knight{{"⚔ Knight"}}
  DragonsCave2["Dragon's Cave, Part II"]
  Dragon{{"⚔ The Dragon"}}
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  Camelot --> DragonsCave
  Knight --> DragonsCave2
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Knight,Dragon,CSerpent,ZodaZ boss;
```

## Chapter 9: Return to C-Island

```mermaid
flowchart TD
  CIsland["C-Island"]
  Coracola["Coracola Cave"]
  CSerpent{{"⚔ C-Serpent"}}
  ZodaZ{{"⚔ Zoda-Z"}}
  CIsland --> Coracola
  CSerpent --> ZodaZ
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class CSerpent,ZodaZ boss;
```
