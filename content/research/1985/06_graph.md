# Knowledge graph — game 1985

Nodes: 76 · Edges: 78

## Progression flow

```mermaid
flowchart TD
  C_Island["C-Island"]
  Coralcola_Village["Coralcola Village"]
  Island_Tunnel["Island Tunnel"]
  Dolphin_Island["Dolphin Island"]
  Octos_Lair["Octo's Lair"]
  Tunnel_to_Miracola["Tunnel to Miracola"]
  Miracola_Village["Miracola Village"]
  Magmas_Molten_Tunnel["Magma's Molten Tunnel"]
  Shecola_Castle["Shecola Castle"]
  Ghost_Village["Ghost Village"]
  Ghost_Tunnel["Ghost Tunnel"]
  West_Tunnel["West Tunnel"]
  Hermits_Mountain["Hermit's Mountain"]
  Tunacola_Village["Tunacola Village"]
  Inside_the_Whale["Inside the Whale"]
  Bellcola_Village["Bellcola Village"]
  Captain_Bells_Memorial["Captain Bell's Memorial"]
  Captain_Bells_Cave["Captain Bell's Cave"]
  Chapter_6_Islands["Chapter 6 Islands"]
  Sanctuary["Sanctuary"]
  Lost_Ruins["Lost Ruins"]
  Underground_Ruins["Underground Ruins"]
  Big_Rock_Tunnel["Big Rock Tunnel"]
  Alien_Spaceship_1["Alien Spaceship 1"]
  Alien_Spaceship_2["Alien Spaceship 2"]
  Final_Battle["Final Battle"]
  C_Serpent{{"⚔ C-Serpent"}}
  Octo{{"⚔ Octo"}}
  Magma{{"⚔ Magma the Fierce"}}
  Maxie{{"⚔ Maxie"}}
  Giant_Turboss{{"⚔ Giant Turboss"}}
  Broken_Joe{{"⚔ Broken Joe"}}
  Hoodoo_Dolls{{"⚔ Hoodoo Dolls"}}
  Twin_Sumocho{{"⚔ Statues of Twin Sumocho"}}
  Jet_Pack_Jumpers{{"⚔ Two Jet-Pack Jumpers"}}
  Brown_Jet_Jumper{{"⚔ Brown Jet Jumper"}}
  Ostroid{{"⚔ Ostroid"}}
  Zoda{{"⚔ Zoda"}}
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  C_Island --> Coralcola_Village
  Coralcola_Village --> Island_Tunnel
  C_Serpent -->|Dr. J's lab, Sub-C departs| Dolphin_Island
  Dolphin_Island --> Octos_Lair
  Octo -->|dolphins lead through the coral; storm| Tunnel_to_Miracola
  Tunnel_to_Miracola --> Miracola_Village
  Miracola_Village --> Magmas_Molten_Tunnel
  Magma --> Shecola_Castle
  Shecola_Castle -->|Fortune Teller's lost Crystal Ball| Ghost_Village
  Ghost_Village -->|odd-coloured tombstone| Ghost_Tunnel
  West_Tunnel --> Hermits_Mountain
  Miracola_Village --> Tunacola_Village
  Tunacola_Village --> Inside_the_Whale
  Captain_Bells_Memorial --> Captain_Bells_Cave
  Captain_Bells_Cave -->|ship sinks, strait opens| Chapter_6_Islands
  Chapter_6_Islands --> Sanctuary
  Sanctuary --> Lost_Ruins
  Broken_Joe --> Underground_Ruins
  Underground_Ruins --> Big_Rock_Tunnel
  Twin_Sumocho -->|reunion with Dr. J| Underground_Ruins
  Underground_Ruins --> Alien_Spaceship_1
  Brown_Jet_Jumper --> Ostroid
  Zoda --> Zodas_Revenge
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class C_Serpent,Octo,Magma,Maxie,Giant_Turboss,Broken_Joe,Hoodoo_Dolls,Twin_Sumocho,Jet_Pack_Jumpers,Brown_Jet_Jumper,Ostroid,Zoda,Zodas_Revenge boss;
```

## Achievement dependencies

```mermaid
flowchart LR
  Yo_Yo[/"Yo-Yo"/]
  Ach_5826(["🏆 You're Kidding, Right?"])
  C_Serpent{{"⚔ C-Serpent"}}
  Ach_5829(["🏆 Let the Search Begin"])
  Ach_5836(["🏆 Cobra Commander"])
  Octo{{"⚔ Octo"}}
  Ach_5830(["🏆 Dolphin Rescue"])
  Ach_5841(["🏆 8-Legged Pushover"])
  Magma{{"⚔ Magma the Fierce"}}
  Ach_5842(["🏆 Hot Head"])
  Crystal_Ball[/"Crystal Ball"/]
  Ach_5831(["🏆 You've Got Balls"])
  Ghost_Tunnel["Ghost Tunnel"]
  Ach_5844(["🏆 Search and Destroy"])
  Maxie{{"⚔ Maxie"}}
  Ach_5843(["🏆 I Ain't Afraid of No Ghost"])
  Shooting_Star[/"Shooting Star"/]
  Ach_5827(["🏆 Reach for the Stars"])
  Scroll_of_Obob[/"Scroll of Obob"/]
  Ach_5832(["🏆 Yaaawn, What'd I Miss?"])
  Inside_the_Whale["Inside the Whale"]
  Ach_5833(["🏆 Into the Belly of the Beast"])
  Lighter[/"Lighter"/]
  Ach_5834(["🏆 Hope You Kept the Manual"])
  Worm[/"Worm"/]
  Ach_5837(["🏆 No Gift, No Chat!"])
  Captain_Bells_Cave["Captain Bell's Cave"]
  Ach_5854(["🏆 Looky Here!"])
  Ach_5835(["🏆 Down with the Ship"])
  Apple(["⚠ Apple"])
  Ach_5851(["🏆 It's Delicious!"])
  Sanctuary["Sanctuary"]
  Ach_5838(["🏆 Marco...?"])
  Broken_Joe{{"⚔ Broken Joe"}}
  Ach_5845(["🏆 Easter Island Reject"])
  Big_Rock_Tunnel["Big Rock Tunnel"]
  Ach_5853(["🏆 Looky Here Again!"])
  Twin_Sumocho{{"⚔ Statues of Twin Sumocho"}}
  Ach_5846(["🏆 Off With Their Heads"])
  Ach_5840(["🏆 Polo!"])
  Jet_Pack_Jumpers{{"⚔ Two Jet-Pack Jumpers"}}
  Ach_5847(["🏆 Air Acrobatics"])
  Magic_Cube_1[/"First Magic Cube (Super Nova)"/]
  Ach_5828(["🏆 Phenomenal Cosmic Powers"])
  Ostroid{{"⚔ Ostroid"}}
  Ach_5848(["🏆 Watch Your Step"])
  Magic_Cube_2[/"Second Magic Cube"/]
  Ach_5849(["🏆 The Final Battle!"])
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  Ach_5850(["🏆 Galactic Domination"])
  Ach_5839(["🏆 The End"])
  Ghost_Village["Ghost Village"]
  Yo_Yo -->|unlocks| Ach_5826
  C_Serpent -->|unlocks| Ach_5829
  C_Serpent -->|unlocks| Ach_5836
  Octo -->|unlocks| Ach_5830
  Octo -->|unlocks| Ach_5841
  Magma -->|unlocks| Ach_5842
  Crystal_Ball -->|unlocks| Ach_5831
  Ghost_Tunnel -->|unlocks| Ach_5844
  Maxie -->|unlocks| Ach_5843
  Shooting_Star -->|unlocks| Ach_5827
  Scroll_of_Obob -->|unlocks| Ach_5832
  Inside_the_Whale -->|unlocks| Ach_5833
  Lighter -->|unlocks| Ach_5834
  Worm -->|unlocks| Ach_5837
  Captain_Bells_Cave -->|unlocks| Ach_5854
  Captain_Bells_Cave -->|unlocks| Ach_5835
  Apple -->|unlocks| Ach_5851
  Sanctuary -->|unlocks| Ach_5838
  Broken_Joe -->|unlocks| Ach_5845
  Big_Rock_Tunnel -->|unlocks| Ach_5853
  Twin_Sumocho -->|unlocks| Ach_5846
  Twin_Sumocho -->|unlocks| Ach_5840
  Jet_Pack_Jumpers -->|unlocks| Ach_5847
  Magic_Cube_1 -->|unlocks| Ach_5828
  Ostroid -->|unlocks| Ach_5848
  Magic_Cube_2 -->|unlocks| Ach_5849
  Zodas_Revenge -->|unlocks| Ach_5850
  Zodas_Revenge -->|unlocks| Ach_5839
  Ach_5844 -.->|missable before| Ghost_Village
```

## Chapter 1: Prelude: C-Island and the Island Tunnel

```mermaid
flowchart TD
  C_Island["C-Island"]
  Coralcola_Village["Coralcola Village"]
  Island_Tunnel["Island Tunnel"]
  C_Serpent{{"⚔ C-Serpent"}}
  Octo{{"⚔ Octo"}}
  Magma{{"⚔ Magma the Fierce"}}
  Maxie{{"⚔ Maxie"}}
  Giant_Turboss{{"⚔ Giant Turboss"}}
  Broken_Joe{{"⚔ Broken Joe"}}
  Hoodoo_Dolls{{"⚔ Hoodoo Dolls"}}
  Twin_Sumocho{{"⚔ Statues of Twin Sumocho"}}
  Jet_Pack_Jumpers{{"⚔ Two Jet-Pack Jumpers"}}
  Brown_Jet_Jumper{{"⚔ Brown Jet Jumper"}}
  Ostroid{{"⚔ Ostroid"}}
  Zoda{{"⚔ Zoda"}}
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  C_Island --> Coralcola_Village
  Coralcola_Village --> Island_Tunnel
  Brown_Jet_Jumper --> Ostroid
  Zoda --> Zodas_Revenge
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class C_Serpent,Octo,Magma,Maxie,Giant_Turboss,Broken_Joe,Hoodoo_Dolls,Twin_Sumocho,Jet_Pack_Jumpers,Brown_Jet_Jumper,Ostroid,Zoda,Zodas_Revenge boss;
```

## Chapter 2: Dolphins: Octo's Lair

```mermaid
flowchart TD
  Dolphin_Island["Dolphin Island"]
  Octos_Lair["Octo's Lair"]
  Octo{{"⚔ Octo"}}
  Magma{{"⚔ Magma the Fierce"}}
  Maxie{{"⚔ Maxie"}}
  Giant_Turboss{{"⚔ Giant Turboss"}}
  Broken_Joe{{"⚔ Broken Joe"}}
  Hoodoo_Dolls{{"⚔ Hoodoo Dolls"}}
  Twin_Sumocho{{"⚔ Statues of Twin Sumocho"}}
  Jet_Pack_Jumpers{{"⚔ Two Jet-Pack Jumpers"}}
  Brown_Jet_Jumper{{"⚔ Brown Jet Jumper"}}
  Ostroid{{"⚔ Ostroid"}}
  Zoda{{"⚔ Zoda"}}
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  Dolphin_Island --> Octos_Lair
  Brown_Jet_Jumper --> Ostroid
  Zoda --> Zodas_Revenge
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Octo,Magma,Maxie,Giant_Turboss,Broken_Joe,Hoodoo_Dolls,Twin_Sumocho,Jet_Pack_Jumpers,Brown_Jet_Jumper,Ostroid,Zoda,Zodas_Revenge boss;
```

## Chapter 3: Storm and Calm: Miracola, Shecola and the Hermit

```mermaid
flowchart TD
  Tunnel_to_Miracola["Tunnel to Miracola"]
  Miracola_Village["Miracola Village"]
  Magmas_Molten_Tunnel["Magma's Molten Tunnel"]
  Shecola_Castle["Shecola Castle"]
  Ghost_Village["Ghost Village"]
  Ghost_Tunnel["Ghost Tunnel"]
  West_Tunnel["West Tunnel"]
  Hermits_Mountain["Hermit's Mountain"]
  Magma{{"⚔ Magma the Fierce"}}
  Maxie{{"⚔ Maxie"}}
  Giant_Turboss{{"⚔ Giant Turboss"}}
  Broken_Joe{{"⚔ Broken Joe"}}
  Hoodoo_Dolls{{"⚔ Hoodoo Dolls"}}
  Twin_Sumocho{{"⚔ Statues of Twin Sumocho"}}
  Jet_Pack_Jumpers{{"⚔ Two Jet-Pack Jumpers"}}
  Brown_Jet_Jumper{{"⚔ Brown Jet Jumper"}}
  Ostroid{{"⚔ Ostroid"}}
  Zoda{{"⚔ Zoda"}}
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  Tunnel_to_Miracola --> Miracola_Village
  Miracola_Village --> Magmas_Molten_Tunnel
  Magma --> Shecola_Castle
  Shecola_Castle -->|Fortune Teller's lost Crystal Ball| Ghost_Village
  Ghost_Village -->|odd-coloured tombstone| Ghost_Tunnel
  West_Tunnel --> Hermits_Mountain
  Brown_Jet_Jumper --> Ostroid
  Zoda --> Zodas_Revenge
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Magma,Maxie,Giant_Turboss,Broken_Joe,Hoodoo_Dolls,Twin_Sumocho,Jet_Pack_Jumpers,Brown_Jet_Jumper,Ostroid,Zoda,Zodas_Revenge boss;
```

## Chapter 4: Confession: Inside the Whale

```mermaid
flowchart TD
  Tunacola_Village["Tunacola Village"]
  Inside_the_Whale["Inside the Whale"]
  Giant_Turboss{{"⚔ Giant Turboss"}}
  Broken_Joe{{"⚔ Broken Joe"}}
  Hoodoo_Dolls{{"⚔ Hoodoo Dolls"}}
  Twin_Sumocho{{"⚔ Statues of Twin Sumocho"}}
  Jet_Pack_Jumpers{{"⚔ Two Jet-Pack Jumpers"}}
  Brown_Jet_Jumper{{"⚔ Brown Jet Jumper"}}
  Ostroid{{"⚔ Ostroid"}}
  Zoda{{"⚔ Zoda"}}
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  Tunacola_Village --> Inside_the_Whale
  Brown_Jet_Jumper --> Ostroid
  Zoda --> Zodas_Revenge
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Giant_Turboss,Broken_Joe,Hoodoo_Dolls,Twin_Sumocho,Jet_Pack_Jumpers,Brown_Jet_Jumper,Ostroid,Zoda,Zodas_Revenge boss;
```

## Chapter 5: Captain Bell: The Strait

```mermaid
flowchart TD
  Bellcola_Village["Bellcola Village"]
  Captain_Bells_Memorial["Captain Bell's Memorial"]
  Captain_Bells_Cave["Captain Bell's Cave"]
  Giant_Turboss{{"⚔ Giant Turboss"}}
  Broken_Joe{{"⚔ Broken Joe"}}
  Hoodoo_Dolls{{"⚔ Hoodoo Dolls"}}
  Twin_Sumocho{{"⚔ Statues of Twin Sumocho"}}
  Jet_Pack_Jumpers{{"⚔ Two Jet-Pack Jumpers"}}
  Brown_Jet_Jumper{{"⚔ Brown Jet Jumper"}}
  Ostroid{{"⚔ Ostroid"}}
  Zoda{{"⚔ Zoda"}}
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  Captain_Bells_Memorial --> Captain_Bells_Cave
  Brown_Jet_Jumper --> Ostroid
  Zoda --> Zodas_Revenge
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Giant_Turboss,Broken_Joe,Hoodoo_Dolls,Twin_Sumocho,Jet_Pack_Jumpers,Brown_Jet_Jumper,Ostroid,Zoda,Zodas_Revenge boss;
```

## Chapter 6: Reunion: The Lost Ruins and the Big Rock Tunnel

```mermaid
flowchart TD
  Chapter_6_Islands["Chapter 6 Islands"]
  Sanctuary["Sanctuary"]
  Lost_Ruins["Lost Ruins"]
  Underground_Ruins["Underground Ruins"]
  Big_Rock_Tunnel["Big Rock Tunnel"]
  Giant_Turboss{{"⚔ Giant Turboss"}}
  Broken_Joe{{"⚔ Broken Joe"}}
  Hoodoo_Dolls{{"⚔ Hoodoo Dolls"}}
  Twin_Sumocho{{"⚔ Statues of Twin Sumocho"}}
  Jet_Pack_Jumpers{{"⚔ Two Jet-Pack Jumpers"}}
  Brown_Jet_Jumper{{"⚔ Brown Jet Jumper"}}
  Ostroid{{"⚔ Ostroid"}}
  Zoda{{"⚔ Zoda"}}
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  Chapter_6_Islands --> Sanctuary
  Sanctuary --> Lost_Ruins
  Broken_Joe --> Underground_Ruins
  Underground_Ruins --> Big_Rock_Tunnel
  Twin_Sumocho -->|reunion with Dr. J| Underground_Ruins
  Brown_Jet_Jumper --> Ostroid
  Zoda --> Zodas_Revenge
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Giant_Turboss,Broken_Joe,Hoodoo_Dolls,Twin_Sumocho,Jet_Pack_Jumpers,Brown_Jet_Jumper,Ostroid,Zoda,Zodas_Revenge boss;
```

## Chapter 7: Alien Spaceship: The First and Second Magic Cubes

```mermaid
flowchart TD
  Alien_Spaceship_1["Alien Spaceship 1"]
  Alien_Spaceship_2["Alien Spaceship 2"]
  Jet_Pack_Jumpers{{"⚔ Two Jet-Pack Jumpers"}}
  Brown_Jet_Jumper{{"⚔ Brown Jet Jumper"}}
  Ostroid{{"⚔ Ostroid"}}
  Zoda{{"⚔ Zoda"}}
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  Brown_Jet_Jumper --> Ostroid
  Zoda --> Zodas_Revenge
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Jet_Pack_Jumpers,Brown_Jet_Jumper,Ostroid,Zoda,Zodas_Revenge boss;
```

## Chapter 8: Final Battle: Zoda

```mermaid
flowchart TD
  Final_Battle["Final Battle"]
  Zoda{{"⚔ Zoda"}}
  Zodas_Revenge{{"⚔ Zoda's Revenge"}}
  Zoda --> Zodas_Revenge
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Zoda,Zodas_Revenge boss;
```
