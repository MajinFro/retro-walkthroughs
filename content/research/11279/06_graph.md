# Knowledge graph — game 11279

Nodes: 139 · Edges: 136

## Progression flow

```mermaid
flowchart TD
  TitleScreen["Title screen"]
  ArtisansWorld["Artisans World"]
  ArtisansHome["Artisans Home"]
  StoneHill["Stone Hill"]
  DarkHollow["Dark Hollow"]
  TownSquare["Town Square"]
  Toasty["Toasty"]
  SunnyFlight["Sunny Flight"]
  PeaceKeepersWorld["Peace Keepers World"]
  PeaceKeepersHome["Peace Keepers Home"]
  DryCanyon["Dry Canyon"]
  CliffTown["Cliff Town"]
  IceCavern["Ice Cavern"]
  DoctorShemp["Doctor Shemp"]
  NightFlight["Night Flight"]
  MagicCraftersWorld["Magic Crafters World"]
  MagicCraftersHome["Magic Crafters Home"]
  AlpineRidge["Alpine Ridge"]
  HighCaves["High Caves"]
  WizardPeak["Wizard Peak"]
  Blowhard["Blowhard"]
  CrystalFlight["Crystal Flight"]
  BeastMakersWorld["Beast Makers World"]
  BeastMakersHome["Beast Makers Home"]
  TerraceVillage["Terrace Village"]
  MistyBog["Misty Bog"]
  TreeTops["Tree Tops"]
  Metalhead["Metalhead"]
  WildFlight["Wild Flight"]
  DreamWeaversWorld["Dream Weavers World"]
  DreamWeaversHome["Dream Weavers Home"]
  DarkPassage["Dark Passage"]
  LoftyCastle["Lofty Castle"]
  HauntedTowers["Haunted Towers"]
  Jacques["Jacques"]
  IcyFlight["Icy Flight"]
  GnastysWorld["Gnasty's World"]
  GnorcGnexus["Gnorc Gnexus"]
  GnorcCove["Gnorc Cove"]
  TwilightHarbor["Twilight Harbor"]
  GnastyGnorc["Gnasty Gnorc"]
  GnastysLoot["Gnasty's Loot"]
  Boss_Toasty{{"⚔ Toasty (boss fight)"}}
  Boss_DoctorShemp{{"⚔ Doctor Shemp (boss fight)"}}
  Boss_Blowhard{{"⚔ Blowhard (boss fight)"}}
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  TitleScreen -->|New game| ArtisansHome
  ArtisansHome --> StoneHill
  ArtisansHome -->|Portal in the bushy area| DarkHollow
  ArtisansHome --> TownSquare
  PeaceKeepersHome --> DryCanyon
  PeaceKeepersHome --> CliffTown
  PeaceKeepersHome --> IceCavern
  PeaceKeepersHome --> NightFlight
  PeaceKeepersHome -->|Portal on the middle island| DoctorShemp
  MagicCraftersHome --> AlpineRidge
  MagicCraftersHome --> HighCaves
  MagicCraftersHome --> WizardPeak
  MagicCraftersHome --> Blowhard
  MagicCraftersHome --> CrystalFlight
  BeastMakersHome --> TerraceVillage
  BeastMakersHome --> MistyBog
  BeastMakersHome --> TreeTops
  BeastMakersHome --> WildFlight
  BeastMakersHome -->|Bridge and whirlwind near Tree Tops| Metalhead
  DreamWeaversHome --> DarkPassage
  DreamWeaversHome --> LoftyCastle
  DreamWeaversHome --> HauntedTowers
  DreamWeaversHome --> IcyFlight
  DreamWeaversHome --> Jacques
  GnorcGnexus --> GnorcCove
  GnorcCove -->|Next dragon head| TwilightHarbor
  TwilightHarbor -->|Middle dragon head| GnastyGnorc
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_Toasty,Boss_DoctorShemp,Boss_Blowhard,Boss_Metalhead,Boss_Jacques,Boss_GnastyGnorc boss;
```

## Achievement dependencies

```mermaid
flowchart LR
  IcyFlight["Icy Flight"]
  IcyFlight_Missable(["⚠ Icy Flight: lights and chests missable past the train tracks"])
  Ach_284533(["🏆 Where's Gnasty Gnorc? I'll Torch Him!"])
  PeaceKeepersHome["Peace Keepers Home"]
  Ach_284534(["🏆 Nifty Fifty"])
  DreamWeaversHome["Dream Weavers Home"]
  Ach_284535(["🏆 The Gang's All Here"])
  GnastysLoot["Gnasty's Loot"]
  StoneHill["Stone Hill"]
  Ach_284538(["🏆 Handle with Care"])
  Ach_284539(["🏆 Practice for the Third Game"])
  BeastMakersHome["Beast Makers Home"]
  Ach_82295(["🏆 Happy Easter"])
  Ach_284536(["🏆 Pocket Change"])
  MagicCraftersHome["Magic Crafters Home"]
  Ach_284537(["🏆 Thicc Wallet"])
  GnorcGnexus["Gnorc Gnexus"]
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  Ach_284545(["🏆 Simple, No Threat, AND Ugly!"])
  ArtisansHome["Artisans Home"]
  Ach_82298(["🏆 Learning from Home"])
  Ach_82300(["🏆 A Dragon's Heart Is Made of Stone"])
  DarkHollow["Dark Hollow"]
  Ach_82302(["🏆 Hollowing Out the Uglies"])
  TownSquare["Town Square"]
  Ach_82303(["🏆 This Town Ain't Big Enough for the Lot of Us..."])
  Toasty["Toasty"]
  Ach_82304(["🏆 Reaping the Sheep"])
  SunnyFlight["Sunny Flight"]
  Ach_82328(["🏆 Sunny-Side-Up"])
  Ach_82305(["🏆 Keeping the Peace"])
  DryCanyon["Dry Canyon"]
  Ach_82307(["🏆 Birds and Pits"])
  CliffTown["Cliff Town"]
  Ach_82306(["🏆 A Broad Expanse"])
  IceCavern["Ice Cavern"]
  Ach_82308(["🏆 Slippery Slopes"])
  DoctorShemp["Doctor Shemp"]
  Ach_82309(["🏆 He Should Watch His Back"])
  NightFlight["Night Flight"]
  Ach_82329(["🏆 Though Darkness, I Fly"])
  Ach_82310(["🏆 Magical Mischiveous Mages"])
  AlpineRidge["Alpine Ridge"]
  Ach_82311(["🏆 High Altitude Antics"])
  HighCaves["High Caves"]
  Ach_82312(["🏆 Caves Among the Clouds"])
  WizardPeak["Wizard Peak"]
  Ach_82313(["🏆 Peak Wizardry"])
  Blowhard["Blowhard"]
  Ach_82314(["🏆 Leave Him Wheezing"])
  CrystalFlight["Crystal Flight"]
  Ach_82330(["🏆 Among the Singing Stones"])
  Ach_82315(["🏆 A Pinch of This, a Dash of That"])
  TerraceVillage["Terrace Village"]
  Ach_82316(["🏆 An Electrifying Experience"])
  MistyBog["Misty Bog"]
  Ach_82317(["🏆 Metal Meets Mire"])
  TreeTops["Tree Tops"]
  Ach_82318(["🏆 Charging Makes the World Go Round"])
  Metalhead["Metalhead"]
  Ach_82319(["🏆 Topple the Tin Man"])
  WildFlight["Wild Flight"]
  Ach_82331(["🏆 Wild Flying Dude!"])
  Ach_82320(["🏆 Life is a Dream, Dragon"])
  DarkPassage["Dark Passage"]
  Ach_82321(["🏆 Lightbringer"])
  LoftyCastle["Lofty Castle"]
  Ach_82322(["🏆 Sir Spyro the Brave"])
  HauntedTowers["Haunted Towers"]
  Ach_82323(["🏆 Spooky Scary"])
  Jacques["Jacques"]
  Ach_82324(["🏆 Spyro the Fool"])
  Ach_82332(["🏆 Sky Sliding"])
  Magnus_Return["Magnus, second Gnorc Gnexus dragon (after the ending)"]
  Ach_82325(["🏆 Gnasty Home You Have Here"])
  GnorcCove["Gnorc Cove"]
  Ach_82326(["🏆 The Gnastiest Cove"])
  TwilightHarbor["Twilight Harbor"]
  Ach_82327(["🏆 A Harbor Full of Gnorcs"])
  GnastyGnorc["Gnasty Gnorc"]
  Ach_82333(["🏆 Gnastys Gnoing, Gnoing, Gnone!"])
  Ach_82299(["🏆 The Loot of Thirty-Four Worlds"])
  Ach_82296(["🏆 Get a Life"])
  ArtisansWorld["Artisans World"]
  Ach_637063(["🏆 A Dragon's Life"])
  PeaceKeepersWorld["Peace Keepers World"]
  Ach_637064(["🏆 A Peaceful Life"])
  MagicCraftersWorld["Magic Crafters World"]
  Ach_637065(["🏆 Magical Life Extension"])
  BeastMakersWorld["Beast Makers World"]
  Ach_637066(["🏆 Heart of an Ox, er... Dragon"])
  DreamWeaversWorld["Dream Weavers World"]
  Ach_637067(["🏆 Living the Weavers Dream"])
  GnastysWorld["Gnasty's World"]
  Ach_637068(["🏆 A Life Worth Living"])
  Ach_284540(["🏆 Suspicious Stepping Stones"])
  Ach_637070(["🏆 A Dark Day for the Herd"])
  Ach_637071(["🏆 Gotta Make 'Em Shine Somehow"])
  Ach_637072(["🏆 Head-On Collision"])
  Boss_Toasty{{"⚔ Toasty (boss fight)"}}
  Ach_82375(["🏆 Solid Spyro"])
  Ach_82301(["🏆 Faster Than Light"])
  Ach_637073(["🏆 There Is No Escaping Spyro the Dragon!"])
  Ach_637074(["🏆 Scale Hardening"])
  Ach_637075(["🏆 Cliffs Pose No Fear"])
  Ach_637076(["🏆 Causing a Flap"])
  Boss_DoctorShemp{{"⚔ Doctor Shemp (boss fight)"}}
  Ach_637077(["🏆 Medically Mandated Rest"])
  Ach_82356(["🏆 Soaring Under the Moonlight!"])
  Ach_637078(["🏆 Magical Feet"])
  Ach_637079(["🏆 Nimble as a Goat"])
  Ach_637080(["🏆 I Hate Those Bugs!"])
  Ach_637081(["🏆 Hyperspeed Roundabout"])
  Ach_82694(["🏆 I Blow Harder"])
  Ach_82372(["🏆 Zooming On Past"])
  Ach_284543(["🏆 Dragon Gumbo Jamboree"])
  Ach_637083(["🏆 Spread Your Wings, Spyro!"])
  Ach_637084(["🏆 I'm Feeling a Bit Lazy Today"])
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Ach_637085(["🏆 Construct, Self-Destruct"])
  Ach_82373(["🏆 Woah, You're Crazy Fast!"])
  Ach_637086(["🏆 Big Problems Require Small Solutions"])
  Ach_637087(["🏆 Devil Defying Stunts"])
  Ach_637088(["🏆 Lofty Perch"])
  Ach_637089(["🏆 Calm Down Fairies"])
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Ach_82729(["🏆 Wow, What a Joke..."])
  Ach_82374(["🏆 The Frozen Flutter"])
  Ach_637090(["🏆 Keeping My Inner Dragon in Check"])
  Ach_637099(["🏆 Oh My God... Literally"])
  Ach_284542(["🏆 Dragonpocalypse Now"])
  Ach_82730(["🏆 Gnasty Gnorc? He's TOAST!"])
  Ach_637091(["🏆 Lava Bath"])
  Ach_284541(["🏆 Wind Through Your... Hair?"])
  TitleScreen["Title screen"]
  Ach_637092(["🏆 Dragons Love New Experiences"])
  IcyFlight -.->|missable before| IcyFlight_Missable
  Ach_284533 -->|unlocks| PeaceKeepersHome
  Ach_284534 -->|unlocks| DreamWeaversHome
  Ach_284535 -->|unlocks| GnastysLoot
  StoneHill -->|unlocks| Ach_284538
  Ach_284539 -->|unlocks| BeastMakersHome
  Ach_82295 -->|unlocks| GnastysLoot
  Ach_284536 -->|unlocks| MagicCraftersHome
  Ach_284537 -->|unlocks| GnorcGnexus
  Boss_GnastyGnorc -->|unlocks| Ach_284545
  ArtisansHome -->|unlocks| Ach_82298
  StoneHill -->|unlocks| Ach_82300
  DarkHollow -->|unlocks| Ach_82302
  TownSquare -->|unlocks| Ach_82303
  Toasty -->|unlocks| Ach_82304
  SunnyFlight -->|unlocks| Ach_82328
  PeaceKeepersHome -->|unlocks| Ach_82305
  DryCanyon -->|unlocks| Ach_82307
  CliffTown -->|unlocks| Ach_82306
  IceCavern -->|unlocks| Ach_82308
  DoctorShemp -->|unlocks| Ach_82309
  NightFlight -->|unlocks| Ach_82329
  MagicCraftersHome -->|unlocks| Ach_82310
  AlpineRidge -->|unlocks| Ach_82311
  HighCaves -->|unlocks| Ach_82312
  WizardPeak -->|unlocks| Ach_82313
  Blowhard -->|unlocks| Ach_82314
  CrystalFlight -->|unlocks| Ach_82330
  BeastMakersHome -->|unlocks| Ach_82315
  TerraceVillage -->|unlocks| Ach_82316
  MistyBog -->|unlocks| Ach_82317
  TreeTops -->|unlocks| Ach_82318
  Metalhead -->|unlocks| Ach_82319
  WildFlight -->|unlocks| Ach_82331
  DreamWeaversHome -->|unlocks| Ach_82320
  DarkPassage -->|unlocks| Ach_82321
  LoftyCastle -->|unlocks| Ach_82322
  HauntedTowers -->|unlocks| Ach_82323
  Jacques -->|unlocks| Ach_82324
  IcyFlight -->|unlocks| Ach_82332
  Magnus_Return -->|unlocks| Ach_82325
  GnorcCove -->|unlocks| Ach_82326
  TwilightHarbor -->|unlocks| Ach_82327
  GnastyGnorc -->|unlocks| Ach_82333
  GnastysLoot -->|unlocks| Ach_82299
  ArtisansHome -->|unlocks| Ach_82296
  ArtisansWorld -->|unlocks| Ach_637063
  PeaceKeepersWorld -->|unlocks| Ach_637064
  MagicCraftersWorld -->|unlocks| Ach_637065
  BeastMakersWorld -->|unlocks| Ach_637066
  DreamWeaversWorld -->|unlocks| Ach_637067
  GnastysWorld -->|unlocks| Ach_637068
  ArtisansHome -->|unlocks| Ach_284540
  StoneHill -->|unlocks| Ach_637070
  DarkHollow -->|unlocks| Ach_637071
  TownSquare -->|unlocks| Ach_637072
  Boss_Toasty -->|unlocks| Ach_82375
  SunnyFlight -->|unlocks| Ach_82301
  PeaceKeepersHome -->|unlocks| Ach_637073
  DryCanyon -->|unlocks| Ach_637074
  CliffTown -->|unlocks| Ach_637075
  IceCavern -->|unlocks| Ach_637076
  Boss_DoctorShemp -->|unlocks| Ach_637077
  NightFlight -->|unlocks| Ach_82356
  MagicCraftersHome -->|unlocks| Ach_637078
  AlpineRidge -->|unlocks| Ach_637079
  HighCaves -->|unlocks| Ach_637080
  WizardPeak -->|unlocks| Ach_637081
  Blowhard -->|unlocks| Ach_82694
  CrystalFlight -->|unlocks| Ach_82372
  TerraceVillage -->|unlocks| Ach_284543
  MistyBog -->|unlocks| Ach_637083
  TreeTops -->|unlocks| Ach_637084
  Boss_Metalhead -->|unlocks| Ach_637085
  WildFlight -->|unlocks| Ach_82373
  DreamWeaversHome -->|unlocks| Ach_637086
  DarkPassage -->|unlocks| Ach_637087
  LoftyCastle -->|unlocks| Ach_637088
  HauntedTowers -->|unlocks| Ach_637089
  Boss_Jacques -->|unlocks| Ach_82729
  IcyFlight -->|unlocks| Ach_82374
  GnorcCove -->|unlocks| Ach_637090
  TwilightHarbor -->|unlocks| Ach_637099
  TwilightHarbor -->|unlocks| Ach_284542
  Boss_GnastyGnorc -->|unlocks| Ach_82730
  GnastysLoot -->|unlocks| Ach_637091
  DryCanyon -->|unlocks| Ach_284541
  TitleScreen -->|unlocks| Ach_637092
```

## Chapter 1: Artisans Home, Stone Hill and Dark Hollow

```mermaid
flowchart TD
  TitleScreen["Title screen"]
  ArtisansWorld["Artisans World"]
  ArtisansHome["Artisans Home"]
  StoneHill["Stone Hill"]
  DarkHollow["Dark Hollow"]
  Boss_Toasty{{"⚔ Toasty (boss fight)"}}
  Boss_DoctorShemp{{"⚔ Doctor Shemp (boss fight)"}}
  Boss_Blowhard{{"⚔ Blowhard (boss fight)"}}
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  TitleScreen -->|New game| ArtisansHome
  ArtisansHome --> StoneHill
  ArtisansHome -->|Portal in the bushy area| DarkHollow
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_Toasty,Boss_DoctorShemp,Boss_Blowhard,Boss_Metalhead,Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 2: Town Square, Toasty and Sunny Flight

```mermaid
flowchart TD
  ArtisansWorld["Artisans World"]
  TownSquare["Town Square"]
  Toasty["Toasty"]
  SunnyFlight["Sunny Flight"]
  Boss_Toasty{{"⚔ Toasty (boss fight)"}}
  Boss_DoctorShemp{{"⚔ Doctor Shemp (boss fight)"}}
  Boss_Blowhard{{"⚔ Blowhard (boss fight)"}}
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_Toasty,Boss_DoctorShemp,Boss_Blowhard,Boss_Metalhead,Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 3: Peace Keepers Home, Dry Canyon and Cliff Town

```mermaid
flowchart TD
  PeaceKeepersWorld["Peace Keepers World"]
  PeaceKeepersHome["Peace Keepers Home"]
  DryCanyon["Dry Canyon"]
  CliffTown["Cliff Town"]
  Boss_DoctorShemp{{"⚔ Doctor Shemp (boss fight)"}}
  Boss_Blowhard{{"⚔ Blowhard (boss fight)"}}
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  PeaceKeepersHome --> DryCanyon
  PeaceKeepersHome --> CliffTown
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_DoctorShemp,Boss_Blowhard,Boss_Metalhead,Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 4: Ice Cavern, Doctor Shemp and Night Flight

```mermaid
flowchart TD
  PeaceKeepersWorld["Peace Keepers World"]
  IceCavern["Ice Cavern"]
  DoctorShemp["Doctor Shemp"]
  NightFlight["Night Flight"]
  Boss_DoctorShemp{{"⚔ Doctor Shemp (boss fight)"}}
  Boss_Blowhard{{"⚔ Blowhard (boss fight)"}}
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_DoctorShemp,Boss_Blowhard,Boss_Metalhead,Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 5: Magic Crafters Home, Alpine Ridge and High Caves

```mermaid
flowchart TD
  MagicCraftersWorld["Magic Crafters World"]
  MagicCraftersHome["Magic Crafters Home"]
  AlpineRidge["Alpine Ridge"]
  HighCaves["High Caves"]
  Boss_Blowhard{{"⚔ Blowhard (boss fight)"}}
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  MagicCraftersHome --> AlpineRidge
  MagicCraftersHome --> HighCaves
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_Blowhard,Boss_Metalhead,Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 6: Wizard Peak, Blowhard and Crystal Flight

```mermaid
flowchart TD
  MagicCraftersWorld["Magic Crafters World"]
  WizardPeak["Wizard Peak"]
  Blowhard["Blowhard"]
  CrystalFlight["Crystal Flight"]
  Boss_Blowhard{{"⚔ Blowhard (boss fight)"}}
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_Blowhard,Boss_Metalhead,Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 7: Beast Makers Home, Terrace Village and Misty Bog

```mermaid
flowchart TD
  BeastMakersWorld["Beast Makers World"]
  BeastMakersHome["Beast Makers Home"]
  TerraceVillage["Terrace Village"]
  MistyBog["Misty Bog"]
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  BeastMakersHome --> TerraceVillage
  BeastMakersHome --> MistyBog
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_Metalhead,Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 8: Tree Tops, Metalhead and Wild Flight

```mermaid
flowchart TD
  BeastMakersWorld["Beast Makers World"]
  TreeTops["Tree Tops"]
  Metalhead["Metalhead"]
  WildFlight["Wild Flight"]
  Boss_Metalhead{{"⚔ Metalhead (boss fight)"}}
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_Metalhead,Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 9: Dream Weavers Home, Dark Passage and Lofty Castle

```mermaid
flowchart TD
  DreamWeaversWorld["Dream Weavers World"]
  DreamWeaversHome["Dream Weavers Home"]
  DarkPassage["Dark Passage"]
  LoftyCastle["Lofty Castle"]
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  DreamWeaversHome --> DarkPassage
  DreamWeaversHome --> LoftyCastle
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 10: Haunted Towers, Jacques and Icy Flight

```mermaid
flowchart TD
  DreamWeaversWorld["Dream Weavers World"]
  HauntedTowers["Haunted Towers"]
  Jacques["Jacques"]
  IcyFlight["Icy Flight"]
  Boss_Jacques{{"⚔ Jacques (boss fight)"}}
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_Jacques,Boss_GnastyGnorc boss;
```

## Chapter 11: Gnorc Gnexus, Gnorc Cove and Twilight Harbor

```mermaid
flowchart TD
  GnastysWorld["Gnasty's World"]
  GnorcGnexus["Gnorc Gnexus"]
  GnorcCove["Gnorc Cove"]
  TwilightHarbor["Twilight Harbor"]
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  GnorcGnexus --> GnorcCove
  GnorcCove -->|Next dragon head| TwilightHarbor
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_GnastyGnorc boss;
```

## Chapter 12: Gnasty Gnorc and the Return of Magnus

```mermaid
flowchart TD
  GnastysWorld["Gnasty's World"]
  GnastyGnorc["Gnasty Gnorc"]
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_GnastyGnorc boss;
```

## Chapter 13: Gnasty's Loot and 120%

```mermaid
flowchart TD
  GnastysWorld["Gnasty's World"]
  GnastysLoot["Gnasty's Loot"]
  Boss_GnastyGnorc{{"⚔ Gnasty Gnorc (final boss)"}}
  classDef ponr fill:#7f1d1d,stroke:#f87171,color:#fff;
  classDef boss fill:#4c1d95,stroke:#a78bfa,color:#fff;
  class Boss_GnastyGnorc boss;
```
