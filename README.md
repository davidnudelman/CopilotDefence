# CopilotDefence

Mode Overview
Mode
Waves
Dungeon
Notes
Normal
80
Yes
Entry-level. Accessible scaling. Forgiving boss HP.
Hard
80
Yes
Significantly higher mob HP. Stun effectiveness reduced 50%. Boss DPS scales sharply at W60+.
Hell
80
No
No dungeon. Special field bosses appear at W30, W60, W80. Total damage req. ~10x Hard.
God (post-Hell)
80+
No
Physical dmg reduced 80%, magic dmg reduced 80% vs. Nyan/Grunt boss types.
 
2.2 Co-op Structure
Matches are played in 2-player co-op. Each player controls one side of a split board. Both players share a single lane of enemies. Players can drag their units across to the partner's side to assist during boss waves.
• Solo mode exists but is harder; no partner board space to leverage.
• Guild Battle is a separate competitive PvP mode (teams of multiple players).
 
3. Board Layout and Map Design
3.1 Main Board
The play area is a grid-based battlefield displayed in a top-down or slight isometric 2D view. Each player has their own grid section (roughly 5 columns x variable rows). Units occupy individual grid cells.
• Enemies travel a fixed winding path from spawn point to the base/exit.
• The path passes through and around the grid zones of both players.
• Units are placed IN the grid cells, not on path tiles. Attack radius determines coverage.
• Melee units should be placed near path edges (short attack range).
• Ranged/AoE units go centrally to cover multiple path segments.
 
3.2 Dungeon Board (Normal / Hard only)
A secondary mini-arena exists on-screen, accessible via a button. It contains one boss that respawns. Players can send certain units (especially Bandits) into the Dungeon to farm gold continuously via their Loot passive ability.
• Dungeon boss gives gold each time it is defeated.
• Best completed when ~30 seconds remain in a wave to maximize gold gain.
• Does NOT appear in Hell Mode.
 
3.3 Visual Style Reference
Lucky Defense uses a bright, cartoonish 2D art style with a fantasy/RPG skin. Key visual traits:
• Chibi-style character sprites for all units (oversized heads, simple animations).
• Colorful, pastel-heavy environment tiles. Green grass paths, stone roads, light sky.
• Enemy sprites range from cute goblins/slimes in early waves to large armored bosses.
• Heavy use of particle FX for skills: electric sparks, bomb blasts, magic orbs, AOE rings.
• UI uses a gold-and-blue color scheme with rounded card UI elements.
• Rarity tiers are color-coded on card borders: Grey (Common), Green (Rare), Blue (Epic), Purple (Legendary), Orange/Red (Mythic), Rainbow/White shimmer (Immortal).
 
4. Unit (Guardian) System
4.1 Rarity Tiers
Rarity
Color Code
Summon Method
Role
Common
Grey
Gold (coin) summon
Cheap early board filler; upgrade for DPS baseline
Rare
Green
Gold summon (elevated)
Slightly stronger filler; often sold to fund epic pulls
Epic
Blue
Luck Stone roulette
Primary mid-game damage; merge 3 -> random Legendary
Legendary
Purple
Merge 3x Epic
Stun/support roles; needed to summon specific Mythics
Mythic
Orange
Recipe combination of Legendaries
Primary late-game DPS. Role-specific (DPS, tank, support)
Immortal
Rainbow shimmer
Separate unlock/progression system
Highest tier. Variable per-hit performance scaling
 
4.2 Unit Roles
Each guardian falls into one or more functional roles:
Role
Description
DPS (Physical)
Scales with DEF reduction. High attack vs. armored targets. Main damage dealers vs. most bosses.
DPS (Magic)
Ignores enemy DEF. Countered only by magic resistance bosses (Nyan-type). AoE heavy.
Stun (Electro Robot)
Interrupts enemy movement. Crucial for Hard/Hell. Place 3x Electro Robot + 6x Shock Robot per player.
Slow
Reduces enemy move speed. Multiplies stun effectiveness by extending exposure time.
Gold Farm (Bandit)
Loot passive triggers on kills, generating bonus coins. Stack 6-9 Bandits for early snowball.
Support (MP Regen)
Accelerates skill cooldowns for magic units. Example: Kitty Mage.
DEF Reduction
Debuffs enemy armor so physical DPS scales into late game. Essential for Hard/Hell.
% HP Damage (Lance)
Deals damage as a % of enemy max HP. Counter to scaling boss HP walls.
 
4.3 Notable Units by Tier
Mythic Highlights
• Lancelot: % HP damage. Starter reward. Vital in Hard mode. Max flame skill before late waves.
• Bandit: Gold farming via Loot skill. Build 6-9 for coin snowball. Send to Dungeon for continuous gold.
• Ninja: Scales explosively at Level 12 + Immortal Ato combination.
• Monopoly Man: Generates Luck Stones via Mutation ultimate. Passive DEF Down buff.
Immortal Highlights
• Haley: Strong early game. Falls off late game.
• Ace Bat Man: Consistently reliable mid-game dealer.
• Ghost Ninja: Pairs with Immortal Ato for spike damage.
• Grand Mama: Support role for sustaining board.
• Great Kitty Mage: MP regeneration support for magic teams.
 
4.4 In-Match Unit Upgrades
Players can upgrade guardian damage levels in-match using gold. There are separate upgrade tracks per rarity tier:
• Common Damage Level: Cheapest. Early game DPS boost.
• Epic Damage Level: Mid-game investment. Helps kill W10 golems.
• Mythic Damage Level: Spent via Mythic Stones. Required to keep up with late-wave scaling.
Upgrading 2x in-game completes the Blacksmith mission (net gold gain in early game).
 
4.5 Pre-Match Guardian Leveling (Metagame)
Outside of matches, players use Guardian cards (earned via gacha, events, matches) to level up their heroes permanently. This gives a starting power advantage each run. Higher-level heroes reduce dependency on in-match summon luck.
 
5. Summoning System
5.1 Coin (Gold) Summon
The primary in-match summoning loop. Players spend gold coins to summon a random Common-to-Rare guardian and place it on their board.
• Cost increases each time you summon (escalating cost curve).
• The game recommends stopping coin summons at 60-80 cost to let the Safe Box artifact passive grow the coin pool.
• Starting gold allows ~3-5 initial summons before needing kills for income.
 
5.2 Luck Stone (Roulette) Summon
Luck Stones are an in-match premium currency used for Epic roulette pulls.
• Each spin gives a random Epic guardian.
• Epic roulette is the main path to building Legendaries via 3x Epic merges.
• Luck Stones earned via: missions, golem kills, boss kills (early bonus), Lamp artifact.
 
5.3 Merge System
Three identical guardians of the same type (Epic or below) can be merged into a random guardian one tier higher.
• Common x3 -> random Rare
• Rare x3 -> random Epic
• Epic x3 -> random Legendary
• Legendary x3 -> random Mythic (IF recipe requirement is met)
 
Critical Note: Legendary-to-Mythic merges are NOT fully random. Specific Mythic guardians require specific Legendary ingredients. Example: Ninja requires 1 Devil + 1 Paladin + 1 Wolf. Players must plan which Legendaries to hold vs. merge.
 
5.4 Mythic Summoning (Recipe System)
Each Mythic guardian has a recipe: a defined set of Legendary guardian types that must be combined. Collecting the correct Legendaries and NOT accidentally merging them away is a key skill requirement.
Three identical Mythic guardians can be merged into a higher-level Mythic version (if player has unlocked that upgrade in the meta-progression system).
 
5.5 Gacha Pity System (Meta-game)
The external gacha (for meta-progression cards, summoning scrolls) uses a pity mechanic:
• Each failed Epic+ pull increases next success chance by 5%.
• 30 Summoning Scrolls = one gacha play.
• Players can earn free batch pulls if they meet the required troop pass threshold.
 
6. Wave System
6.1 Core Wave Structure
Matches run for 80 waves. Enemy count and HP scale progressively. Each wave has a set number of mobs that follow the path. Players must kill them before they reach the exit or the board is overwhelmed.
Wave Range
What Happens
W1-W5
Tutorial-pace. Basic mob types. Income focus. Build initial board.
W6 (mid-W6)
First Golem spawns. Kill before W8 for mission bonus.
W10
First Boss wave. 2 bosses. Kill within 30s for early kill bonus Luck Stone. Also Lamp artifact triggers.
W10-W20
Epic roulette phase. Build Legendary board. First Mythics targeted.
W20
Shops unlock after first time.
W30-W40
Legend-based Myths appear. Stun becomes critical. Hard mode diverges sharply here.
W50
Boss reward: choose a Legendary unit. Key strategic pivot for Hard/Hell.
W60 (Hard)
Total damage threshold: 1.5 trillion+. Mode gets dramatically harder.
W70 (Hard)
Total damage threshold: 4.5 trillion+. Nearly 3x more than W1-60 combined.
W80 (Hard)
Total damage threshold: 13 trillion. Final boss. Clear condition.
W80 (Hell)
Total damage threshold: 130 trillion (~10x Hard). Special W30/W60/W80 field bosses.
 
6.2 Mob Types and HP Scaling
Mob HP scales exponentially by wave. Physical damage becomes ineffective without DEF reduction as enemy DEF also scales per wave. Magic damage ignores DEF but faces magic resistance on specific boss types.
• Normal mobs: Standard movement speed and HP. Increase in count per wave.
• Elite blobs: Tougher mid-wave mobs. Appear around W15 in Hell at level 12+, allowing dungeon push.
• Flashback condition (Hell mode): If 99+ enemies are on the board simultaneously, triggers a mission.
 
6.3 Boss Waves
Boss spawns occur every 10 waves (W10, W20, W30... W80). Bosses are single large units with massive HP pools that walk the main path.
• Bosses cannot be stunned in later difficulties without dedicated stun build.
• Players must drag/move units to stay in boss range as it walks.
• Boss HP by wave is the primary damage-check gate per difficulty mode.
• Hell mode special bosses (W30/W60/W80) can attack the board itself, killing or debuffing units.
• Boss kill rewards: gold coins and/or Luck Stones depending on wave milestone.
 
7. Golem System
Golems are optional time-limited challenge units that spawn separately from the main wave, displayed in the upper-right corner of the screen. They are NOT enemies on the main path.
7.1 Golem Mechanics
• Golem appears as a button/prompt on the HUD. Player manually initiates the encounter.
• Golem walks a short path to the center of the board.
• Has significant HP. Requires substantial DPS to kill before it leaves the killzone.
• First Golem appears mid-wave 6. Must be killed before W8 for the Golem Hunt mission.
• Subsequent golems appear every few minutes throughout the match.
• Do NOT start a Golem encounter while a boss is active. Split DPS = failing both.
 
7.2 Golem Rewards
Reward Type
Detail
Luck Stones
Each Golem killed = 2 Luck Stones. First golem mission = 1 additional stone.
Gold Coins
Bonus gold pool for gambling/summons.
Mission Credit
Counts toward the Golem Hunt mission (kill 2 golems before W8).
Boss Enablement
NamuWiki: killing the Golem enables the next 10 boss waves chain per an internal mechanic.
 
8. Currency Systems
8.1 In-Match Currencies
Currency
Earned By
Spent On
Gold Coins
Mob kills, boss kills, Bandit Loot, Safe Box artifact passive, missions
Coin summons, in-match damage upgrades, dungeon purchases
Luck Stones
Mission completion, golem kills, boss early kill bonus, Lamp artifact
Epic roulette summons (random Epic guardian)
Mythic Stones
Boss wave rewards, missions, meta-progression
Mythic damage level upgrades in-match
 
8.2 Metagame (Permanent) Currencies
Currency
Usage
Gems
Purchase guardian copies from shop. Refresh shop inventory. Mid-value premium currency.
Diamonds
Unlock Mythic guardians. Premium shop purchases. High-value premium currency.
Summoning Scrolls
30 scrolls = 1 gacha pull for guardian cards (external progression gacha).
Artifact Keys
Open artifact chests for Safe Box, Money Gun, Lamp, and other passive modifiers.
Invitations
Tutorial quest rewards. Used for initial guardian pulls.
 
8.3 Gold Income During Waves: How It Scales
Income is kill-driven and compound. Faster clearing = faster income = more summons = stronger board = faster clearing.
• Each mob kill generates gold. The exact amount scales modestly with wave number.
• Bandit's Loot skill: triggers on kills, generates bonus gold. Stack 6-9 Bandits for maximum effect.
• Safe Box (sb) artifact: passively grows based on current coin stockpile. The higher the pile, the faster it grows. This is the primary late-game gold engine.
• Boss kills: large gold drops. Dungeon boss: repeatable gold farm.
• Missions: instant gold bonuses on completion.
 
The SB/MG Loop: Safe Box (sb) accumulates coins passively. Money Gun (mg) converts coin stockpile into an ATK multiplier for all guardians. The goal is to maximize sb first, then mg scales damage. This is the core progression loop beyond the early game.
 
9. Artifact System
Artifacts are permanent passive modifiers that apply to every match. Players unlock and level them up in the meta-progression layer. They are NOT consumables.
Artifact
Effect
Safe Box (sb)
Accumulates gold passively based on coin stockpile. Levels 1-10+ scale rate. Core economy artifact.
Money Gun (mg)
Converts coin stockpile into ATK% bonus for all guardians. Higher sb = higher mg payoff.
Lamp
Awards 1 Luck Stone at W10. Bonus stones per mission based on level (lvl 1-5: +1/mission, lvl 6-10: +2, lvl 11: +3).
Luck Stone (artifact)
Increases Luck Stone rewards from missions. More consistent early-game roulette summons.
Lance
Modifies Lance (Mythic unit) skills. Level 12 is the minimum for Hard mode attempts.
 
10. In-Match Mission System
Missions are objectives that appear and track during a match. Completing them rewards gold or Luck Stones. They are the primary structured progression gate inside each game session.
10.1 Key Early Missions
Mission
Reward
Notes
Blacksmith: Upgrade 2x
1 Luck Stone + gold (net gain)
Upgrade Common + Epic once each. Completes at net profit.
Summon All Commons
Gold
Naturally completed during early coin summons.
Golem Hunt: Kill 2 Golems before W8
1 Luck Stone
First golem spawns mid-W6. Requires early DPS investment.
Collect 10 Luck Stones
Safe Box artifact upgrade
Don't spend stones until after W10 boss kill to hit 10.
Collect 1,000 Coins
Gold / Luck Stones
Achievable by W20 with Bandit stack.
W10 Boss: Kill in under 30s
1 Luck Stone (early kill bonus)
Requires 1-3 Epic guardians with damage upgrades.
Earn 500 Coins from Safe Box
Upgrade
Complete as long as not continuously spending all gold.
Flashback (Hell only): Survive 99 enemies on board
Reward
Unique Hell mode mission. Requires surviving mob overflow.
 
11. Match Flow and Pacing
11.1 Early Game (W1-W10)
Opening phase focuses on building gold income and board presence. Speed matters because faster kills = faster gold = faster summons.
• Spend all starting gold on coin summons immediately.
• Upgrade Common damage once, Epic damage once (net gold positive via Blacksmith mission).
• Merge triples aggressively: Common -> Rare -> Epic.
• Use Luck Stones on Epic roulettes to fill board with Epics.
• Kill first Golem mid-W6 for 2 Luck Stones + mission credit.
• Kill W10 bosses fast (within 30s) for early kill bonus Luck Stone.
• Do not spend Luck Stones until after the 10 Luck Stone mission if possible.
 
11.2 Mid Game (W10-W30)
• Shift from summon spam to targeted Mythic recipe building.
• Stop coin summons when cost hits 60-80; let Safe Box passive accumulate.
• Summon 6-9 Bandits and send them to the Dungeon.
• Maintain 3x Electro Robots + 6x Shock Robots for stun coverage.
• Begin accumulating Legendaries for desired Mythic recipes.
• Upgrade Epic Damage levels if Epics are the primary damage source.
 
11.3 Late Game (W30-W80)
• Full Mythic board + stun grid is the target state.
• Move DPS Mythics forward (column 4-5) only after W30 in Hell.
• Maximize Mythic damage level upgrades via Mythic Stones.
• Stun chains critical: keep bosses locked to maximize DPS time on target.
• W50 boss reward: choose Legendary strategically based on gap in your build.
• Monitor total damage benchmarks vs. wave checkpoints.
 
12. UX and UI Design
12.1 HUD Layout
The primary HUD is compact and gesture-friendly for mobile:
• Wave counter and enemy HP bar: top center.
• Player gold counter and Luck Stone count: top left corner.
• Summon button (coin): bottom left. Accessible with thumb.
• Luck Stone roulette button: adjacent to summon button.
• Merge button: appears when 3 identical units are on board.
• Upgrade buttons (per rarity): bottom bar or floating panel.
• Golem Hunt button: top right. Appears when Golem is ready.
• Dungeon access button: side panel.
• Mission tracker: collapsible side or top panel.
• Speed control (1x/2x): corner button. 2x available as premium feature/ad reward.
 
12.2 Unit Interaction
• Tap a unit to select it. Tap again to see stats and skills.
• Drag units around the grid to reposition. Essential during boss encounters.
• Drag 3 identical units near each other to trigger merge prompt.
• Long-press a unit to see attack radius ring on the board.
 
12.3 Roulette / Gacha Presentation
• Roulette spins use a spinning wheel visual with sound FX. Result reveals with animation.
• Epic roulette: small particle burst on result. Legendary+ results have escalating celebration FX.
• Mythic summon via recipe: cutscene-lite animation with character portrait reveal.
• Failed pulls (gacha context): counter visible showing pity progress.
 
12.4 Board Builder Tools (Third-party / Overlay)
The community has built supplementary tools (Board Builder, Upgrade Calculator, Gacha Simulator) on luckydefenseguides.com. These are not in-game but represent features that players demand and that could be integrated in a clone as native features to improve experience.
 
13. Metagame Progression
13.1 Guardian Unlock and Leveling
Outside of matches, players build and upgrade their permanent guardian roster. Higher guardian levels translate directly to stronger starting boards in each match.
• Guardian cards collected from gacha, event rewards, match drops.
• Each guardian has a level cap (up to 15 in Epic tier).
• Leveling unlocks skill tiers (e.g., slow effect unlocks at level X, AoE upgrade at level Y).
• Immortal rarity guardians have a separate unlock order and are gated by progression milestones.
 
13.2 Artifact Progression
Artifacts level up via Artifact Keys earned from missions, events, and tutorial rewards. Key investment priority order for a new player:
• 1. Safe Box (sb): Primary economy. Max first.
• 2. Money Gun (mg): ATK multiplier. Max after sb.
• 3. Lamp: Luck Stone efficiency. Levels 1-5 first.
• 4. Luck Stone artifact: More consistent early-game pulls.
• 5. Lance artifact: Needed for Hard mode progression (level 12 minimum).
 
13.3 Hidden Profiles (Achievement System)
The game has profile achievements ('Hidden Profiles') tied to specific milestones:
• Bus Driver: Contribute 80%+ damage in clearing the W80 boss 10 times.
• Consumption King: Spend 10 million total gold.
• Diamond Spoon: Spend 100,000 total diamonds.
• Support: Support a partner 10 times (boss-only, no golem/dungeon credit).
• Gravity Bomb: Stun 50 enemies simultaneously.
 
14. Monetization Design
Lucky Defense monetizes through a layered soft-to-hard premium model:
14.1 Monetization Layers
Layer
Description
Ad-supported (F2P)
Watch ads to reset daily shop up to 5x. Ad for 2x speed. Completely playable F2P.
Battle/Hunt Pass
Premium hunt pass gives VVIP badge, double speed, no ads. Recommended minimum spend.
Gems/Diamonds IAP
Buy premium currencies for guardian shop refreshes, Mythic unlocks.
Energy IAP
Extra energy for extended play sessions (3x energy seen as recommended spend tier).
Gacha Scrolls IAP
Summoning scrolls for the meta guardian gacha. Primary whale spend.
Immortal Unlock
Immortal guardians are locked behind progression gates that are accelerated by spending.
 
F2P viability: The game is completable in Normal and Hard mode with zero spend. Hell and God require either heavy grind or moderate spend on pass + energy.
 
15. Clone Development Priorities
The following outlines suggested implementation priority for a Lucky Defense-inspired clone, from core loop to polish:
Phase 1: Playable Core (MVP)
• Grid-based board with fixed enemy path. 2D top-down tile art.
• Coin summon system with escalating cost. Random Common/Rare unit spawned to grid.
• 3x merge mechanic: same unit type -> random unit one rarity higher.
• 80-wave structure. Enemy HP scaling table per wave.
• Boss every 10 waves. Drag-to-reposition unit interaction.
• Kill-to-earn gold loop. Basic income per mob kill.
• Basic HUD: wave counter, gold counter, summon button, merge button.
 
Phase 2: Core Systems Depth
• Luck Stone currency + Epic roulette system.
• Mythic recipe system (specific Legendary combos unlock Mythic units).
• In-match upgrade tracks per rarity (Common/Epic/Mythic damage levels).
• Mission system with gold/Luck Stone rewards.
• Golem encounter system (optional challenge, timed, separate from main lane).
• Dungeon board (secondary arena for gold farming units).
• Bandit unit: Loot passive skill (bonus gold on kill).
 
Phase 3: Economy and Retention
• Safe Box (sb) passive coin accumulation artifact.
• Money Gun (mg) ATK multiplier based on coin stockpile.
• Artifact progression system (keys, levels, unlock order).
• Meta guardian leveling (permanent card collection and level upgrades).
• Daily shop with ad refresh loop.
• Achievement/Hidden Profile system.
 
Phase 4: Co-op and Multiplayer
• 2-player co-op matchmaking and shared lane.
• Guild Battle PvP mode.
• Cross-player unit sharing / drag mechanic.
 
Phase 5: Content and Polish
• Hard and Hell difficulty tuning.
• Immortal guardian tier + unlock system.
• Special event modes, seasonal content.
• Board Builder tool as native in-game feature.
• Full sfx/vfx polish: per-skill particle FX, boss entry animations, roulette SFX.
 
