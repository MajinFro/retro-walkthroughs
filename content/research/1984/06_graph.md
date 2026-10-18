# Knowledge graph — game 1984

Nodes: 109 · Edges: 111

## Progression flow

```mermaid
flowchart TD
  Seattle["Seattle"]
  Ice_Age["Ice Age"]
  Cave_Men_Cave["Cave Men Cave"]
  Yum_Yum_Cave["Yum Yum's Cave"]
  Yum_Yum{{"⚔ Yum Yum"}}
  Egypt["Egypt"]
  Border_Pass["Border Pass"]
  Giant_Scorpion{{"⚔ Giant Scorpion"}}
  Monkey_Maze["Monkey Maze"]
  Great_Pyramid["Great Pyramid"]
  Monster_Mask{{"⚔ Monster Mask"}}
  London["London"]
  London_Museum["London museum"]
  Sewers["Sewers"]
  Sewer_Part_I["Sewer Part I"]
  Zodas_Creature{{"⚔ Zoda's Creature"}}
  Sewer_Part_II["Sewer Part II"]
  Zoda_X{{"⚔ Zoda-X"}}
  Wild_West["Wild West"]
  Gold_Cave["Gold Cave"]
  Boulder_Miner{{"⚔ Boulder Tossing Miner"}}
  Gold_Cave_Part_II["Gold Cave Part II"]
  Mashing_Miner{{"⚔ Mashing Miner"}}
  Italy["Italy"]
  Leos_Basement["Leo's Basement"]
  Art_Studio["Art Studio"]
  Small_Island["Small Island"]
  Eastern_Castle["Eastern Castle"]
  Transylvania["Transylvania"]
  Draculas_Castle["Dracula's Castle"]
  Zoda_Y{{"⚔ Zoda-Y"}}
  Camelot["Camelot"]
  Dragons_Cave["Dragon's Cave"]
  Knight{{"⚔ Knight"}}
  Dragons_Cave_Part_II["Dragon's Cave Part II"]
  Dragon{{"⚔ Dragon"}}
  C_Island["C-Island"]
  Coracola_Cave["Coracola Cave"]
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  Seattle -->|time slip to Chapter 2| Ice_Age
  Ice_Age -->|north across the snow field| Cave_Men_Cave
  Cave_Men_Cave -->|north| Yum_Yum_Cave
  Yum_Yum_Cave --> Yum_Yum
  Yum_Yum_Cave -->|time slip to Chapter 3| Egypt
  Egypt -->|north past the guard| Border_Pass
  Border_Pass --> Giant_Scorpion
  Egypt -->|west shore of the Nile, then north| Monkey_Maze
  Monkey_Maze -->|the monkey warps Mike to the pyramid| Great_Pyramid
  Great_Pyramid -->|snake room secret passage| Monster_Mask
  Great_Pyramid -->|time slip to Chapter 4| London
  London -->|escape the jail, then on to the museum| London_Museum
  London_Museum -->|manhole south of the open manhole| Sewers
  Sewer_Part_I --> Zodas_Creature
  Zodas_Creature --> Sewer_Part_II
  Sewer_Part_II --> Zoda_X
  Sewer_Part_II -->|time slip to Chapter 5| Wild_West
  Wild_West -->|dynamite three spaces below the southern colored-rock cave| Gold_Cave
  Gold_Cave --> Boulder_Miner
  Gold_Cave --> Gold_Cave_Part_II
  Gold_Cave_Part_II --> Mashing_Miner
  Gold_Cave_Part_II -->|time slip to Chapter 6| Italy
  Italy -->|stairs in Leonardo's house| Leos_Basement
  Leos_Basement --> Art_Studio
  Eastern_Castle -->|Zoda-Y sends Mike to Chapter 7| Transylvania
  Transylvania --> Draculas_Castle
  Draculas_Castle --> Zoda_Y
  Draculas_Castle -->|time slip to Chapter 8| Camelot
  Camelot -->|accept King Arthur's quest| Dragons_Cave
  Dragons_Cave --> Knight
  Knight --> Dragons_Cave_Part_II
  Dragons_Cave_Part_II --> Dragon
  Dragons_Cave_Part_II -->|Mica calls Mike back to C-Island| C_Island
  C_Island -->|talk to the man, then enter the cave| Coracola_Cave
  Coracola_Cave --> C_Serpent
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Yum_Yum,Giant_Scorpion,Monster_Mask,Zodas_Creature,Zoda_X,Boulder_Miner,Mashing_Miner,Zoda_Y,Knight,Dragon,C_Serpent,Boss_Rematches,Zoda_Z boss;
```

## Achievement dependencies

```mermaid
flowchart LR
  Rocks[/"Rocks"/]
  Ach_36882(["🏆 Better Than Nothing"])
  Axe[/"Axe"/]
  Ach_36883(["🏆 A Caveman Weapon"])
  Medicine[/"Medicine"/]
  Ach_36888(["🏆 Just Like Link"])
  Tetrad_Ch2[/"Tetrad (Chapter 2)"/]
  Ach_36884(["🏆 Your First Tetrad"])
  Jack["Jack of All Trades"]
  Ach_36885(["🏆 Jack of All Trades"])
  Jack_Dagger_Missable(["⚠ Jack's bronze dagger trade"])
  Dagger[/"Dagger"/]
  Thrower[/"Thrower (Slingshot)"/]
  Ach_36887(["🏆 Thrower"])
  Pizza["Cleopatra's pizza"]
  Ach_36889(["🏆 Slowest Pizza Delivery Ever"])
  Ach_36886(["🏆 Sharp Edge"])
  Small_Stars[/"Small stars"/]
  Ach_36890(["🏆 What Do These Do?"])
  Big_Heart_Ch3[/"Big Heart (Monkey Maze)"/]
  Ach_36891(["🏆 Lost in the Tall Grass"])
  Psychic_Shockwave[/"Psychic Shockwave"/]
  Ach_36892(["🏆 Psychic Power"])
  Flute[/"Flute"/]
  Ach_36893(["🏆 Snake Charmer"])
  Tetrad_Ch3[/"Tetrad (Chapter 3)"/]
  Ach_36894(["🏆 Egyptian Tetris"])
  Big_Heart_Ch4[/"Big Heart (manhole left of the museum)"/]
  Ach_36895(["🏆 Down the Sewers"])
  Spike_Ball[/"Spike Ball (spiked frisbees)"/]
  Ach_36896(["🏆 That Does NOT Look Like a Ball"])
  Tetrad_Ch4[/"Tetrad (Chapter 4)"/]
  Ach_36897(["🏆 The Mystery of the Tetrad"])
  Chicken_Nugget[/"Chicken nugget (the hidden nugget)"/]
  Ach_36898(["🏆 Not Quite a Gold Nugget"])
  Gold_Nugget[/"Gold nugget"/]
  Ach_36899(["🏆 Real Gold"])
  Big_Heart_Ch5[/"Big Heart (between two boulders)"/]
  Ach_36900(["🏆 Heart of Gold"])
  Bola[/"Bola"/]
  Ach_36901(["🏆 Not the Traditional Weapon"])
  Super_Psychic[/"Super Psychic Shockwave"/]
  Ach_36902(["🏆 Super Psychic Shock Wave"])
  Invincibility_Star[/"Invincibility Star"/]
  Ach_36903(["🏆 Just Like Mario"])
  Tetrad_Ch5[/"Tetrad (Chapter 5)"/]
  Ach_36904(["🏆 Tetrad in a Western"])
  Katana[/"Katana"/]
  Ach_36905(["🏆 Now We Got a Sword"])
  Big_Heart_Ch6[/"Big Heart (Small Island)"/]
  Ach_36906(["🏆 Heart on the Lone Island"])
  Tetrad_Ch6[/"Tetrad (Chapter 6)"/]
  Ach_36907(["🏆 Watch Out for Pits!"])
  Room13_Chest_Missable(["⚠ Spooky Castle Room 13 chest"])
  Triple_Spike_Ball[/"Triple Spike Ball"/]
  Ach_36908(["🏆 Triple the Fun"])
  Tetrad_Ch7[/"Tetrad (Chapter 7)"/]
  Ach_36909(["🏆 House of the Undead"])
  Ultra_Psychic[/"Ultra Psychic Shockwave"/]
  Ach_36910(["🏆 Ultra Psychic Shock Wave"])
  Tetrad_Ch8[/"Tetrad (Chapter 8)"/]
  Ach_36911(["🏆 The Middle Ages"])
  Zoda_Z{{"⚔ Zoda-Z"}}
  Ach_36912(["🏆 C-Island is Normal Again!"])
  Rocks -->|unlocks| Ach_36882
  Axe -->|unlocks| Ach_36883
  Medicine -->|unlocks| Ach_36888
  Tetrad_Ch2 -->|unlocks| Ach_36884
  Jack -->|unlocks| Ach_36885
  Jack_Dagger_Missable -.->|missable before| Dagger
  Thrower -->|unlocks| Ach_36887
  Pizza -->|unlocks| Ach_36889
  Dagger -->|unlocks| Ach_36886
  Small_Stars -->|unlocks| Ach_36890
  Big_Heart_Ch3 -->|unlocks| Ach_36891
  Psychic_Shockwave -->|unlocks| Ach_36892
  Flute -->|unlocks| Ach_36893
  Tetrad_Ch3 -->|unlocks| Ach_36894
  Big_Heart_Ch4 -->|unlocks| Ach_36895
  Spike_Ball -->|unlocks| Ach_36896
  Tetrad_Ch4 -->|unlocks| Ach_36897
  Chicken_Nugget -->|unlocks| Ach_36898
  Gold_Nugget -->|unlocks| Ach_36899
  Big_Heart_Ch5 -->|unlocks| Ach_36900
  Bola -->|unlocks| Ach_36901
  Super_Psychic -->|unlocks| Ach_36902
  Invincibility_Star -->|unlocks| Ach_36903
  Tetrad_Ch5 -->|unlocks| Ach_36904
  Katana -->|unlocks| Ach_36905
  Big_Heart_Ch6 -->|unlocks| Ach_36906
  Tetrad_Ch6 -->|unlocks| Ach_36907
  Room13_Chest_Missable -.->|missable before| Triple_Spike_Ball
  Triple_Spike_Ball -->|unlocks| Ach_36908
  Tetrad_Ch7 -->|unlocks| Ach_36909
  Ultra_Psychic -->|unlocks| Ach_36910
  Tetrad_Ch8 -->|unlocks| Ach_36911
  Zoda_Z -->|unlocks| Ach_36912
```

## Chapter 1: Chapter 1: Seattle

```mermaid
flowchart TD
  Seattle["Seattle"]
  Yum_Yum{{"⚔ Yum Yum"}}
  Giant_Scorpion{{"⚔ Giant Scorpion"}}
  Monster_Mask{{"⚔ Monster Mask"}}
  Zodas_Creature{{"⚔ Zoda's Creature"}}
  Zoda_X{{"⚔ Zoda-X"}}
  Boulder_Miner{{"⚔ Boulder Tossing Miner"}}
  Mashing_Miner{{"⚔ Mashing Miner"}}
  Zoda_Y{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ Dragon"}}
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Yum_Yum,Giant_Scorpion,Monster_Mask,Zodas_Creature,Zoda_X,Boulder_Miner,Mashing_Miner,Zoda_Y,Knight,Dragon,C_Serpent,Boss_Rematches,Zoda_Z boss;
```

## Chapter 2: Chapter 2: The Stone Age

```mermaid
flowchart TD
  Ice_Age["Ice Age"]
  Cave_Men_Cave["Cave Men Cave"]
  Yum_Yum_Cave["Yum Yum's Cave"]
  Yum_Yum{{"⚔ Yum Yum"}}
  Giant_Scorpion{{"⚔ Giant Scorpion"}}
  Monster_Mask{{"⚔ Monster Mask"}}
  Zodas_Creature{{"⚔ Zoda's Creature"}}
  Zoda_X{{"⚔ Zoda-X"}}
  Boulder_Miner{{"⚔ Boulder Tossing Miner"}}
  Mashing_Miner{{"⚔ Mashing Miner"}}
  Zoda_Y{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ Dragon"}}
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  Ice_Age -->|north across the snow field| Cave_Men_Cave
  Cave_Men_Cave -->|north| Yum_Yum_Cave
  Yum_Yum_Cave --> Yum_Yum
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Yum_Yum,Giant_Scorpion,Monster_Mask,Zodas_Creature,Zoda_X,Boulder_Miner,Mashing_Miner,Zoda_Y,Knight,Dragon,C_Serpent,Boss_Rematches,Zoda_Z boss;
```

## Chapter 3: Chapter 3: Egypt

```mermaid
flowchart TD
  Egypt["Egypt"]
  Border_Pass["Border Pass"]
  Giant_Scorpion{{"⚔ Giant Scorpion"}}
  Monkey_Maze["Monkey Maze"]
  Great_Pyramid["Great Pyramid"]
  Monster_Mask{{"⚔ Monster Mask"}}
  Zodas_Creature{{"⚔ Zoda's Creature"}}
  Zoda_X{{"⚔ Zoda-X"}}
  Boulder_Miner{{"⚔ Boulder Tossing Miner"}}
  Mashing_Miner{{"⚔ Mashing Miner"}}
  Zoda_Y{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ Dragon"}}
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  Egypt -->|north past the guard| Border_Pass
  Border_Pass --> Giant_Scorpion
  Egypt -->|west shore of the Nile, then north| Monkey_Maze
  Monkey_Maze -->|the monkey warps Mike to the pyramid| Great_Pyramid
  Great_Pyramid -->|snake room secret passage| Monster_Mask
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Giant_Scorpion,Monster_Mask,Zodas_Creature,Zoda_X,Boulder_Miner,Mashing_Miner,Zoda_Y,Knight,Dragon,C_Serpent,Boss_Rematches,Zoda_Z boss;
```

## Chapter 4: Chapter 4: London

```mermaid
flowchart TD
  London["London"]
  London_Museum["London museum"]
  Sewers["Sewers"]
  Sewer_Part_I["Sewer Part I"]
  Zodas_Creature{{"⚔ Zoda's Creature"}}
  Sewer_Part_II["Sewer Part II"]
  Zoda_X{{"⚔ Zoda-X"}}
  Boulder_Miner{{"⚔ Boulder Tossing Miner"}}
  Mashing_Miner{{"⚔ Mashing Miner"}}
  Zoda_Y{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ Dragon"}}
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  London -->|escape the jail, then on to the museum| London_Museum
  London_Museum -->|manhole south of the open manhole| Sewers
  Sewer_Part_I --> Zodas_Creature
  Zodas_Creature --> Sewer_Part_II
  Sewer_Part_II --> Zoda_X
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Zodas_Creature,Zoda_X,Boulder_Miner,Mashing_Miner,Zoda_Y,Knight,Dragon,C_Serpent,Boss_Rematches,Zoda_Z boss;
```

## Chapter 5: Chapter 5: The Wild West

```mermaid
flowchart TD
  Wild_West["Wild West"]
  Gold_Cave["Gold Cave"]
  Boulder_Miner{{"⚔ Boulder Tossing Miner"}}
  Gold_Cave_Part_II["Gold Cave Part II"]
  Mashing_Miner{{"⚔ Mashing Miner"}}
  Zoda_Y{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ Dragon"}}
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  Wild_West -->|dynamite three spaces below the southern colored-rock cave| Gold_Cave
  Gold_Cave --> Boulder_Miner
  Gold_Cave --> Gold_Cave_Part_II
  Gold_Cave_Part_II --> Mashing_Miner
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boulder_Miner,Mashing_Miner,Zoda_Y,Knight,Dragon,C_Serpent,Boss_Rematches,Zoda_Z boss;
```

## Chapter 6: Chapter 6: Italy

```mermaid
flowchart TD
  Italy["Italy"]
  Leos_Basement["Leo's Basement"]
  Art_Studio["Art Studio"]
  Small_Island["Small Island"]
  Eastern_Castle["Eastern Castle"]
  Zoda_Y{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ Dragon"}}
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  Italy -->|stairs in Leonardo's house| Leos_Basement
  Leos_Basement --> Art_Studio
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Zoda_Y,Knight,Dragon,C_Serpent,Boss_Rematches,Zoda_Z boss;
```

## Chapter 7: Chapter 7: Transylvania

```mermaid
flowchart TD
  Transylvania["Transylvania"]
  Draculas_Castle["Dracula's Castle"]
  Zoda_Y{{"⚔ Zoda-Y"}}
  Knight{{"⚔ Knight"}}
  Dragon{{"⚔ Dragon"}}
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  Transylvania --> Draculas_Castle
  Draculas_Castle --> Zoda_Y
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Zoda_Y,Knight,Dragon,C_Serpent,Boss_Rematches,Zoda_Z boss;
```

## Chapter 8: Chapter 8: Camelot

```mermaid
flowchart TD
  Camelot["Camelot"]
  Dragons_Cave["Dragon's Cave"]
  Knight{{"⚔ Knight"}}
  Dragons_Cave_Part_II["Dragon's Cave Part II"]
  Dragon{{"⚔ Dragon"}}
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  Camelot -->|accept King Arthur's quest| Dragons_Cave
  Dragons_Cave --> Knight
  Knight --> Dragons_Cave_Part_II
  Dragons_Cave_Part_II --> Dragon
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Knight,Dragon,C_Serpent,Boss_Rematches,Zoda_Z boss;
```

## Chapter 9: Chapter 9: Return to C-Island

```mermaid
flowchart TD
  C_Island["C-Island"]
  Coracola_Cave["Coracola Cave"]
  C_Serpent{{"⚔ C-Serpent"}}
  Boss_Rematches{{"⚔ Revamped bosses"}}
  Zoda_Z{{"⚔ Zoda-Z"}}
  C_Island -->|talk to the man, then enter the cave| Coracola_Cave
  Coracola_Cave --> C_Serpent
  C_Serpent --> Boss_Rematches
  Boss_Rematches --> Zoda_Z
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class C_Serpent,Boss_Rematches,Zoda_Z boss;
```
