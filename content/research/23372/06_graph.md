# Knowledge graph — game 23372

Nodes: 39 · Edges: 39

## Progression flow

```mermaid
flowchart TD
  Game_Setup["Game Setup"]
  Slam_Dunk["Slam Dunk"]
  Spirals["Spirals"]
  Attack["Attack"]
  Basic_Training["Basic Training"]
  Bonus_Round["Bonus Round"]
  Tornado_Run["Tornado Run"]
  Aggro_Crag["Aggro Crag"]
  Basic_Training -->|"retry requires Basic Training first"| Bonus_Round
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```

## Achievement dependencies

```mermaid
flowchart LR
  Slam_Dunk["Slam Dunk"]
  Ach_598949(["🏆 Come On and Slam"])
  Slam_Dunk_Specials["Slam Dunk special shots (X+Y)"]
  Ach_598959(["🏆 We Wanna Be Like Mike"])
  Ach_598957(["🏆 Like Quickdraw McGraw, Only, Uh, for Sports?"])
  Ach_598958(["🏆 It's All about That Rebound"])
  Spirals["Spirals"]
  Ach_598950(["🏆 The Spiraly Thing Will Make You Go Insane"])
  Spirals_Specials["Spirals specials (X then Y)"]
  Ach_598961(["🏆 Wowing the Crowd"])
  Attack["Attack"]
  Ach_598951(["🏆 What Is This, an Action RPG?"])
  Attack_Specials["Attack specials (10 points)"]
  Ach_598960(["🏆 Sky Dancer"])
  Basic_Training["Basic Training"]
  Ach_598952(["🏆 Move Out, Private!"])
  Ach_598964(["🏆 Call Me Barry Allen"])
  BT_Stopwatches[/"Stopwatch pickups"/]
  Ach_598956(["🏆 It's an Obstacle Course, Not a Scavenger Hunt"])
  BT_Jumping_Jack[/"Jumping jack man (meter refill)"/]
  Ach_598966(["🏆 Artful Dodger"])
  Bonus_Round["Bonus Round"]
  Ach_598963(["🏆 Similar Quality to Ballz"])
  Ach_598962(["🏆 Gotta Collect 'Em All"])
  Tornado_Run["Tornado Run"]
  Ach_598953(["🏆 Tengu Man Would Be Proud"])
  Ach_598965(["🏆 Most Extreme Elimination Challenge"])
  Piece_of_the_Rock[/"Piece of the Rock"/]
  Ach_598954(["🏆 Piece of the Rock"])
  Crag_Summit["Aggro Crag summit flags"]
  Ach_598967(["🏆 Yodelayheehoo!"])
  Advanced_Level["Advanced difficulty"]
  Ach_598955(["🏆 Do You Have It?"])
  Slam_Dunk -->|unlocks| Ach_598949
  Slam_Dunk_Specials -->|unlocks| Ach_598959
  Slam_Dunk_Specials -->|unlocks| Ach_598957
  Slam_Dunk -->|unlocks| Ach_598958
  Spirals -->|unlocks| Ach_598950
  Spirals_Specials -->|unlocks| Ach_598961
  Attack -->|unlocks| Ach_598951
  Attack_Specials -->|unlocks| Ach_598960
  Basic_Training -->|unlocks| Ach_598952
  Basic_Training -->|unlocks| Ach_598964
  BT_Stopwatches -->|unlocks| Ach_598956
  BT_Jumping_Jack -->|unlocks| Ach_598956
  Basic_Training -->|unlocks| Ach_598966
  Bonus_Round -->|unlocks| Ach_598963
  Bonus_Round -->|unlocks| Ach_598962
  Tornado_Run -->|unlocks| Ach_598953
  Tornado_Run -->|unlocks| Ach_598965
  Piece_of_the_Rock -->|unlocks| Ach_598954
  Crag_Summit -->|unlocks| Ach_598967
  Advanced_Level -->|requires| Ach_598955
  Piece_of_the_Rock -->|unlocks| Ach_598955
```

## Chapter 1: Game Setup and Options

```mermaid
flowchart TD
  Game_Setup["Game Setup"]
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```

## Chapter 2: Slam Dunk

```mermaid
flowchart TD
  Slam_Dunk["Slam Dunk"]
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```

## Chapter 3: Spirals

```mermaid
flowchart TD
  Spirals["Spirals"]
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```

## Chapter 4: Attack

```mermaid
flowchart TD
  Attack["Attack"]
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```

## Chapter 5: Basic Training and the Bonus Round

```mermaid
flowchart TD
  Basic_Training["Basic Training"]
  Bonus_Round["Bonus Round"]
  Basic_Training -->|"retry requires Basic Training first"| Bonus_Round
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```

## Chapter 6: Tornado Run

```mermaid
flowchart TD
  Tornado_Run["Tornado Run"]
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```

## Chapter 7: The Aggro Crag

```mermaid
flowchart TD
  Aggro_Crag["Aggro Crag"]
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
```
