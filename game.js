'use strict';

/* ========================================================================
 * Copilot Defence — Lucky Defense-inspired grid tower defense
 * Theme: AI/dev guardians defend a codebase against bugs and errors.
 * ====================================================================== */

const TILE = 72;
const COLS = 10;
const ROWS = 6;
const BOARD_W = TILE * COLS;
const BOARD_H = TILE * ROWS;
const MAX_WAVES = 80;
const STARTING_GOLD = 35;
const STARTING_HP = 18;
const SUMMON_COST_START = 10;
const SUMMON_COST_STEP = 7;
const SUMMON_COST_CAP = 110;
const WAVE_AUTO_DELAY = 4;
const WAVE_FIRST_DELAY = 2;

/* === Map / path definitions ===
 * Each map provides waypoints (from offscreen to offscreen). WAYPOINTS and
 * PATH_CELLS are mutable and updated by setMap(); the active map is chosen on
 * the welcome screen and committed at run start.
 */
const MAPS = {
  wind: {
    id: 'wind',
    name: 'Winding Path',
    desc: 'The original winding route.',
    waypoints: [
      { col: -1, row: 2 }, { col: 1,  row: 2 },
      { col: 1,  row: 0 }, { col: 3,  row: 0 },
      { col: 3,  row: 4 }, { col: 5,  row: 4 },
      { col: 5,  row: 1 }, { col: 7,  row: 1 },
      { col: 7,  row: 5 }, { col: 8,  row: 5 },
      { col: 8,  row: 2 }, { col: 10, row: 2 },
    ],
  },
  zigzag: {
    id: 'zigzag',
    name: 'Zigzag',
    desc: 'Sharp top-to-bottom switchbacks.',
    waypoints: [
      { col: -1, row: 0 }, { col: 2,  row: 0 },
      { col: 2,  row: 5 }, { col: 4,  row: 5 },
      { col: 4,  row: 0 }, { col: 6,  row: 0 },
      { col: 6,  row: 5 }, { col: 8,  row: 5 },
      { col: 8,  row: 2 }, { col: 10, row: 2 },
    ],
  },
  loop: {
    id: 'loop',
    name: 'Loop',
    desc: 'Long detour from bottom-left to top-right.',
    waypoints: [
      { col: -1, row: 5 }, { col: 1,  row: 5 },
      { col: 1,  row: 1 }, { col: 4,  row: 1 },
      { col: 4,  row: 4 }, { col: 6,  row: 4 },
      { col: 6,  row: 2 }, { col: 9,  row: 2 },
      { col: 9,  row: 0 }, { col: 10, row: 0 },
    ],
  },
  snake: {
    id: 'snake',
    name: 'Snake',
    desc: 'Doubles back near the spawn before sweeping right.',
    waypoints: [
      { col: -1, row: 1 }, { col: 3,  row: 1 },
      { col: 3,  row: 4 }, { col: 1,  row: 4 },
      { col: 1,  row: 5 }, { col: 6,  row: 5 },
      { col: 6,  row: 2 }, { col: 9,  row: 2 },
      { col: 9,  row: 4 }, { col: 10, row: 4 },
    ],
  },
};
const MAP_ORDER = ['wind', 'zigzag', 'loop', 'snake'];

let WAYPOINTS = MAPS.wind.waypoints;

const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Immortal'];

const RARITY_COLORS = {
  Common:    '#b6bac3',
  Rare:      '#4ed188',
  Epic:      '#4f8bf0',
  Legendary: '#b06bf0',
  Mythic:    '#f49b3a',
  Immortal:  '#ffffff',
};

const DIFFICULTIES = {
  normal: { id: 'normal', name: 'Normal', enemyHp: 1.00, bossHp: 1.00, def: 1.0, reward: 1.00, stunMult: 1.00, color: '#5fd870', desc: 'Entry-level. Forgiving scaling.' },
  hard:   { id: 'hard',   name: 'Hard',   enemyHp: 1.60, bossHp: 2.00, def: 1.3, reward: 1.25, stunMult: 0.50, color: '#f5c542', desc: 'Sharper HP scaling. Stuns half as long.' },
  hell:   { id: 'hell',   name: 'Hell',   enemyHp: 3.00, bossHp: 4.50, def: 1.7, reward: 1.60, stunMult: 0.30, color: '#e25555', desc: 'Brutal HP walls. Pre-planned builds only.' },
};
const DIFFICULTY_ORDER = ['normal', 'hard', 'hell'];

/* === Unit catalogue ===
 * Five families, each with a Common→Rare→Epic→Legendary→Mythic ladder.
 * Two Immortals branch from the bruiser/arcane Mythics through merges.
 *
 *  dmg     : base damage per hit
 *  range   : in tiles (radius)
 *  aps     : attacks per second
 *  type    : physical | magic
 *  extras  : aoe, stun, slow, burn, freezeChance, percentHP, defDown,
 *            manaMax (charges via attacks → ability), ability (key for
 *            triggerAbility), manaAura (radius in tiles — boosts ally mana
 *            gain), variable (Immortal damage spread).
 */
const FAMILIES = {
  frost:   { id: 'frost',   name: 'Frost',   color: '#9bd9ff', desc: 'Slows and freezes — locks the path down.' },
  burn:    { id: 'burn',    name: 'Burn',    color: '#ff8a3a', desc: 'AoE attacks that leave enemies burning.' },
  sniper:  { id: 'sniper',  name: 'Sniper',  color: '#a8e055', desc: 'Long range and a rapid trigger finger.' },
  bruiser: { id: 'bruiser', name: 'Bruiser', color: '#ff7e7e', desc: 'Short range, devastating single-target.' },
  arcane:  { id: 'arcane',  name: 'Arcane',  color: '#b06bf0', desc: 'Charges mana and accelerates the board.' },
};

const UNITS = {
  // ── Frost family ─ slow + freeze
  frost_c: { id: 'frost_c', family: 'frost', name: 'Ice Tosser',    rarity: 'Common',    dmg: 3,  range: 1.8, aps: 1.0, type: 'magic',    slow: { amount: 0.20, duration: 1.0 }, glyph: '❄️' },
  frost_r: { id: 'frost_r', family: 'frost', name: 'Frost Engineer',rarity: 'Rare',      dmg: 6,  range: 2.0, aps: 1.0, type: 'magic',    slow: { amount: 0.30, duration: 1.2 }, glyph: '🛠️' },
  frost_e: { id: 'frost_e', family: 'frost', name: 'Cryomancer',    rarity: 'Epic',      dmg: 13, range: 2.4, aps: 0.9, type: 'magic',    slow: { amount: 0.40, duration: 1.5 }, aoe: 0.7, glyph: '🧙' },
  frost_l: { id: 'frost_l', family: 'frost', name: 'Glacier Sage',  rarity: 'Legendary', dmg: 28, range: 2.6, aps: 0.8, type: 'magic',    slow: { amount: 0.50, duration: 2.0 }, aoe: 1.0, freezeChance: 0.18, freezeDuration: 0.8, glyph: '🧊' },
  frost_m: { id: 'frost_m', family: 'frost', name: 'Blizzard King',  rarity: 'Mythic',    dmg: 60, range: 3.0, aps: 0.9, type: 'magic',    slow: { amount: 0.55, duration: 2.5 }, aoe: 1.2, manaMax: 6,  ability: 'frostBomb', glyph: '👑' },

  // ── Burn family ─ AoE damage-over-time
  burn_c:  { id: 'burn_c',  family: 'burn',  name: 'Torch Bearer',  rarity: 'Common',    dmg: 3,  range: 1.6, aps: 1.1, type: 'magic',    burn: { dps: 1.5, duration: 1.5 }, glyph: '🔦' },
  burn_r:  { id: 'burn_r',  family: 'burn',  name: 'Hot-fixer',     rarity: 'Rare',      dmg: 5,  range: 1.8, aps: 1.1, type: 'magic',    burn: { dps: 3,   duration: 2.0 }, glyph: '🔧' },
  burn_e:  { id: 'burn_e',  family: 'burn',  name: 'Firefighter',   rarity: 'Epic',      dmg: 10, range: 2.2, aps: 1.0, type: 'magic',    aoe: 0.8, burn: { dps: 6,  duration: 2.5 }, glyph: '👨‍🚒' },
  burn_l:  { id: 'burn_l',  family: 'burn',  name: 'Wildfire',      rarity: 'Legendary', dmg: 22, range: 2.4, aps: 1.0, type: 'magic',    aoe: 1.0, burn: { dps: 13, duration: 3.0 }, glyph: '🌪️' },
  burn_m:  { id: 'burn_m',  family: 'burn',  name: 'Inferno Lord',  rarity: 'Mythic',    dmg: 48, range: 2.8, aps: 0.9, type: 'magic',    aoe: 1.2, burn: { dps: 26, duration: 3.5 }, manaMax: 10, ability: 'infernoBlast', glyph: '👹' },

  // ── Sniper family ─ high range + attack speed
  sniper_c:{ id: 'sniper_c',family: 'sniper',name: 'Bowman',        rarity: 'Common',    dmg: 4,  range: 2.6, aps: 1.4, type: 'physical', glyph: '🏹' },
  sniper_r:{ id: 'sniper_r',family: 'sniper',name: 'Marksman',      rarity: 'Rare',      dmg: 7,  range: 3.0, aps: 1.5, type: 'physical', glyph: '🎯' },
  sniper_e:{ id: 'sniper_e',family: 'sniper',name: 'Sharpshooter',  rarity: 'Epic',      dmg: 15, range: 3.4, aps: 1.6, type: 'physical', glyph: '🔫' },
  sniper_l:{ id: 'sniper_l',family: 'sniper',name: 'Eagle Eye',     rarity: 'Legendary', dmg: 32, range: 3.6, aps: 1.7, type: 'physical', glyph: '🦅' },
  sniper_m:{ id: 'sniper_m',family: 'sniper',name: 'Elite Sniper',  rarity: 'Mythic',    dmg: 58, range: 4.0, aps: 2.0, type: 'physical', manaMax: 5, ability: 'multiShot', glyph: '💂' },

  // ── Bruiser family ─ short range, heavy single-target
  bruis_c: { id: 'bruis_c', family: 'bruiser',name: 'Squire',        rarity: 'Common',    dmg: 9,   range: 1.0, aps: 0.7, type: 'physical', loot: 1, glyph: '🛡️' },
  bruis_r: { id: 'bruis_r', family: 'bruiser',name: 'Warrior',      rarity: 'Rare',      dmg: 16,  range: 1.1, aps: 0.7, type: 'physical', glyph: '⚔️' },
  bruis_e: { id: 'bruis_e', family: 'bruiser',name: 'Gladiator',    rarity: 'Epic',      dmg: 32,  range: 1.2, aps: 0.7, type: 'physical', glyph: '🤺' },
  bruis_l: { id: 'bruis_l', family: 'bruiser',name: 'Champion',     rarity: 'Legendary', dmg: 70,  range: 1.3, aps: 0.7, type: 'physical', glyph: '🏆' },
  bruis_m: { id: 'bruis_m', family: 'bruiser',name: 'Berserker',    rarity: 'Mythic',    dmg: 140, range: 1.4, aps: 0.7, type: 'physical', manaMax: 8,  ability: 'critStrike', glyph: '😡' },

  // ── Arcane family ─ mana support + late-game spike
  arc_c:   { id: 'arc_c',   family: 'arcane', name: 'Apprentice',   rarity: 'Common',    dmg: 3,   range: 2.0, aps: 1.0, type: 'magic', glyph: '🪄' },
  arc_r:   { id: 'arc_r',   family: 'arcane', name: 'Wizard',       rarity: 'Rare',      dmg: 5,   range: 2.2, aps: 1.0, type: 'magic', glyph: '🧙‍♂️' },
  arc_e:   { id: 'arc_e',   family: 'arcane', name: 'Mana Catalyst',rarity: 'Epic',      dmg: 9,   range: 2.4, aps: 1.0, type: 'magic',    manaAura: 2.2, glyph: '⚛️' },
  arc_l:   { id: 'arc_l',   family: 'arcane', name: 'Archmage',     rarity: 'Legendary', dmg: 26,  range: 2.6, aps: 1.0, type: 'magic', glyph: '🔮' },
  arc_m:   { id: 'arc_m',   family: 'arcane', name: 'Storm Archon', rarity: 'Mythic',    dmg: 45,  range: 2.8, aps: 1.0, type: 'magic',    manaMax: 12, ability: 'chainLightning', glyph: '⚡' },

  // ── Immortals (merge-only)
  haley:   { id: 'haley',   family: 'bruiser',name: 'Immortal Haley',rarity: 'Immortal',  dmg: 220, range: 1.6, aps: 0.8, type: 'physical', variable: true, manaMax: 5, ability: 'crushingBlow', glyph: '🦸' },
  ato:     { id: 'ato',     family: 'arcane', name: 'Immortal Ato', rarity: 'Immortal',  dmg: 140, range: 3.0, aps: 1.0, type: 'magic',    variable: true, aoe: 1.2, manaMax: 10, ability: 'starfall', glyph: '🦋' },
  angel:   { id: 'angel',   family: 'arcane', name: 'Archangel',    rarity: 'Immortal',  dmg: 110, range: 4.0, aps: 1.8, type: 'magic',    variable: true, aoe: 1.5, burn: { dps: 30, duration: 3.0 }, slow: { amount: 0.40, duration: 2.0 }, manaAura: 5.0, glyph: '👼' },
  vulcan:  { id: 'vulcan',  family: 'burn',   name: 'Vulcan',       rarity: 'Immortal',  dmg: 300, range: 3.0, aps: 0.6, type: 'magic',    variable: true, aoe: 2.0, burn: { dps: 80, duration: 4.0 }, manaMax: 8, ability: 'infernoBlast', glyph: '🌋' },
};

const POOLS = {
  Common:    ['frost_c', 'burn_c', 'sniper_c', 'bruis_c', 'arc_c'],
  Rare:      ['frost_r', 'burn_r', 'sniper_r', 'bruis_r', 'arc_r'],
  Epic:      ['frost_e', 'burn_e', 'sniper_e', 'bruis_e', 'arc_e'],
  Legendary: ['frost_l', 'burn_l', 'sniper_l', 'bruis_l', 'arc_l'],
  Mythic:    ['frost_m', 'burn_m', 'sniper_m', 'bruis_m', 'arc_m'],
  Immortal:  ['haley', 'ato', 'angel', 'vulcan'],
};

const ABILITY_DESCRIPTIONS = {
  frostBomb:      'Every full mana: AoE freezes all enemies in range for 2.0s.',
  infernoBlast:   'Every full mana: massive AoE explosion + heavy 4.0s burn.',
  multiShot:      'Every full mana: fires at 2 extra enemies in range.',
  critStrike:     'Every full mana: next attack deals 5× damage.',
  chainLightning: 'Every full mana: chain lightning hits up to 6 enemies.',
  crushingBlow:   'Every full mana: huge hit + 6% of target max HP.',
  starfall:       'Every full mana: starfall over all enemies in range.',
};

/* === Family signature specials ===
 * Every unit — not just Mythics — fires its family signature every N attacks.
 * The cadence tightens as rarity rises, so higher tiers proc more often; the
 * signature's power rides on unitDamage(), which already scales with rarity.
 * Mythic/Immortal keep their mana ultimate AND fire the signature on top. */
const SIGNATURE_CADENCE = { Common: 8, Rare: 7, Epic: 6, Legendary: 5, Mythic: 4, Immortal: 3 };

const SIGNATURE = {
  frost:   { name: 'Frost Nova',      glyph: '❄', color: '#9bd9ff',
             desc: r => `Nova hits nearby enemies and ${r === 'Common' || r === 'Rare' ? 'deep-slows' : 'freezes'} them.` },
  burn:    { name: 'Ember Burst',     glyph: '🔥', color: '#ff7e3a',
             desc: () => 'Splash blast that leaves a stronger, longer burn.' },
  sniper:  { name: 'Piercing Volley', glyph: '🎯', color: '#a8e055',
             desc: r => `Strong shot pierces ${r === 'Common' || r === 'Rare' ? 1 : (r === 'Epic' || r === 'Legendary' ? 2 : 3)} extra enemies.` },
  bruiser: { name: 'Crushing Slam',   glyph: '💥', color: '#ff7e7e',
             desc: () => 'Devastating single hit + bonus % max HP and a brief stun.' },
  arcane:  { name: 'Mana Surge',      glyph: '✨', color: '#b06bf0',
             desc: () => 'Pours mana into nearby charging allies and zaps the target.' },
};

/* Roulette costs/odds — premium tiers above Legendary require merges. */
const EPIC_ROULETTE_COST       = 1;
const EPIC_ROULETTE_CHANCE     = 0.60;   // 60% Epic, otherwise random Rare
const LEGENDARY_ROULETTE_COST  = 4;
const LEGENDARY_ROULETTE_CHANCE = 0.30;  // 30% Legendary, otherwise random Epic

/* Deterministic merge map — 3 of the source ID become 1 of the result ID.
 * Each family advances one tier per merge up to Legendary.
 * Mythics now require specific combinations of Legendaries (Recipes). */
const MERGE_RECIPES = {
  frost_c:  'frost_r',  frost_r:  'frost_e',  frost_e:  'frost_l',
  burn_c:   'burn_r',   burn_r:   'burn_e',   burn_e:   'burn_l',
  sniper_c: 'sniper_r', sniper_r: 'sniper_e', sniper_e: 'sniper_l',
  bruis_c:  'bruis_r',  bruis_r:  'bruis_e',  bruis_e:  'bruis_l',
  arc_c:    'arc_r',    arc_r:    'arc_e',    arc_e:    'arc_l',
};

/* Mythic Recipes — specific combinations of Legendaries needed to summon a Mythic.
 * Format: [LegendaryID_A, LegendaryID_B, LuckStoneCost] */
const MYTHIC_RECIPES = {
  frost_m:  { ingredients: ['frost_l', 'arc_l'],  stones: 6, result: 'frost_m' },
  burn_m:   { ingredients: ['burn_l', 'sniper_l'], stones: 6, result: 'burn_m' },
  sniper_m: { ingredients: ['sniper_l', 'frost_l'], stones: 6, result: 'sniper_m' },
  bruis_m:  { ingredients: ['bruis_l', 'burn_l'],  stones: 6, result: 'bruis_m' },
  arc_m:    { ingredients: ['arc_l', 'bruis_l'],   stones: 6, result: 'arc_m' },
};

/* Immortal Recipes */
const IMMORTAL_RECIPES = {
  haley:  { ingredients: ['bruis_m', 'sniper_m'], stones: 15, result: 'haley' },
  ato:    { ingredients: ['arc_m', 'frost_m'],   stones: 15, result: 'ato' },
  angel:  { ingredients: ['frost_e', 'burn_e', 'sniper_e', 'bruis_e', 'arc_e'], stones: 15, result: 'angel' },
  vulcan: { ingredients: ['burn_m', 'arc_m'],    stones: 15, result: 'vulcan' },
};

/* === Artifacts (persisted across runs via localStorage) === */
const STORAGE_KEY = 'copilot-defence-save-v1';
const ARTIFACT_MAX_LEVEL = 12;

const SAFEBOX_RATE_PER_LEVEL = 0.007;
const SAFEBOX_PAYOUT_CAP_PER_WAVE = 200;
const ARTIFACTS = {
  sb: {
    id: 'sb',
    name: 'Safe Box',
    glyph: '🏦',
    desc: 'Pays interest at the start of each wave (% of your wave-start gold, capped per wave).',
    payoutAt: (lvl, waveStartGold) =>
      lvl > 0 ? Math.min(SAFEBOX_PAYOUT_CAP_PER_WAVE, Math.floor(lvl * SAFEBOX_RATE_PER_LEVEL * Math.max(0, waveStartGold))) : 0,
    effectAt: (lvl, gold) => lvl > 0
      ? `+${Math.min(SAFEBOX_PAYOUT_CAP_PER_WAVE, Math.floor(lvl * SAFEBOX_RATE_PER_LEVEL * Math.max(0, gold)))}g / wave (${(lvl * SAFEBOX_RATE_PER_LEVEL * 100).toFixed(2)}%, max ${SAFEBOX_PAYOUT_CAP_PER_WAVE})`
      : '0g / wave',
    upgradeCost: (lvl) => 4 + 2 * lvl,
  },
  mg: {
    id: 'mg',
    name: 'Money Gun',
    glyph: '💸',
    desc: 'Global ATK multiplier for every guardian. Scales with your gold pile.',
    multAt: (lvl, gold) => 1 + (lvl * 0.035) * Math.sqrt(Math.max(0, gold) / 600),
    effectAt: (lvl, gold) => `×${ARTIFACTS.mg.multAt(lvl, gold).toFixed(2)} ATK`,
    upgradeCost: (lvl) => 5 + 2 * lvl,
  },
  at: {
    id: 'at',
    name: 'Attack Tower',
    glyph: '🗼',
    desc: 'Increases all unit damage globally.',
    dmgMultAt: (lvl) => 1 + lvl * 0.05,
    effectAt: (lvl) => `+${(lvl * 5)}% Global DMG`,
    upgradeCost: (lvl) => 10 + 5 * lvl,
  },
  oc: {
    id: 'oc',
    name: 'Overclock',
    glyph: '⚙️',
    desc: 'Increases all unit attack speed globally.',
    apsMultAt: (lvl) => 1 + lvl * 0.03,
    effectAt: (lvl) => `+${(lvl * 3)}% Global APS`,
    upgradeCost: (lvl) => 10 + 5 * lvl,
  },
  bh: {
    id: 'bh',
    name: 'Bounty Hunter',
    glyph: '🤠',
    desc: 'Start each run with extra Gold and Luck Stones.',
    goldAt: (lvl) => lvl * 10,
    stonesAt: (lvl) => Math.floor(lvl / 3),
    effectAt: (lvl) => `+${lvl * 10} Start Gold, +${Math.floor(lvl/3)} Start Stones`,
    upgradeCost: (lvl) => 10 + 5 * lvl,
  },
  cm: {
    id: 'cm',
    name: 'Coin Magnet',
    glyph: '🧲',
    desc: 'Chance to double gold from every enemy killed.',
    chanceAt: (lvl) => lvl * 0.03,
    effectAt: (lvl) => `${(lvl * 0.03 * 100).toFixed(0)}% chance to double gold`,
    upgradeCost: (lvl) => 3 + 2 * lvl,
  },
  ep: {
    id: 'ep',
    name: 'Emergency Patch',
    glyph: '🩹',
    desc: 'Once per run, restores HP when it reaches 0.',
    restoreAt: (lvl) => Math.min(10, lvl + 2),
    effectAt: (lvl) => `Restores ${Math.min(10, lvl + 2)} HP once per run`,
    upgradeCost: (lvl) => 6 + 3 * lvl,
  },
};
const ARTIFACT_ORDER = ['sb', 'mg', 'at', 'oc', 'bh', 'cm', 'ep'];

/* === Achievements (cumulative; persisted across runs) === */
const ACHIEVEMENTS = [
  { id: 'firstWave',   title: 'First Commit',     desc: 'Clear wave 1.' },
  { id: 'wave10',      title: 'Decade',           desc: 'Reach wave 10.' },
  { id: 'wave30',      title: 'Trifecta',         desc: 'Reach wave 30.' },
  { id: 'wave50',      title: 'Half Century',     desc: 'Reach wave 50.' },
  { id: 'victory',     title: 'Total Victory',    desc: 'Clear wave 80.' },
  { id: 'forge',       title: 'Forged a Mythic',  desc: 'Merge 3 Legendaries into a Mythic.' },
  { id: 'allFamilies', title: 'Full Squad',       desc: 'Have a guardian from every family on the board.' },
  { id: 'ability',     title: 'Spell Slinger',    desc: 'Trigger a Mythic ability for the first time.' },
  { id: 'golem5',      title: 'Golem Hunter',     desc: 'Defeat 5 Golems (cumulative).' },
  { id: 'dungeon10',   title: 'Dungeon Crawler',  desc: 'Clear 10 dungeon bosses (cumulative).' },
  { id: 'hoard',       title: 'Hoarder',          desc: 'Hold 2,500 gold at once.' },
  { id: 'stun100',     title: 'Stun Master',      desc: 'Stun or freeze 100 enemies (cumulative).' },
  { id: 'kill1000',    title: 'Bug Bash',         desc: 'Kill 1,000 enemies (cumulative).' },
  { id: 'sbMax',       title: 'Vault Engineer',   desc: 'Upgrade Safe Box to Lv 5.' },
  { id: 'mgMax',       title: 'Cashflow Cannon',  desc: 'Upgrade Money Gun to Lv 5.' },
  { id: 'immortal',    title: 'Beyond Mythic',    desc: 'Forge an Immortal guardian.' },
  { id: 'hardClear',   title: 'Hard Mode Clear',  desc: 'Reach wave 30 on Hard.' },
  { id: 'hellRun',     title: 'Welcome to Hell',  desc: 'Reach wave 10 on Hell.' },
  { id: 'stoneHoard',  title: 'Stone Hoarder',    desc: 'Hold 30 Luck Stones at once.' },
  { id: 'dungeon5',    title: 'Tier 5 Crawler',   desc: 'Clear Dungeon Tier 5.' },
  { id: 'untouched',   title: 'Iron Codebase',    desc: 'Clear a wave with zero escapes.' },
];

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      artifacts: game.artifacts,
      achievements: game.achievements,
      stats: game.stats,
      difficulty: game.difficulty,
      mapId: game.mapId,
      coop: { enabled: game.coop.enabled },
      gems: game.gems,
      tokens: game.tokens,
    }));
  } catch {}
}

/* === Path helpers === */
function cellCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

function computePathCells(waypoints) {
  const s = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1];
    if (a.col === b.col) {
      const lo = Math.min(a.row, b.row), hi = Math.max(a.row, b.row);
      for (let r = lo; r <= hi; r++) s.add(`${a.col},${r}`);
    } else {
      const lo = Math.min(a.col, b.col), hi = Math.max(a.col, b.col);
      for (let c = lo; c <= hi; c++) s.add(`${c},${a.row}`);
    }
  }
  return s;
}

let PATH_CELLS = computePathCells(WAYPOINTS);

function setMap(id) {
  const m = MAPS[id] || MAPS.wind;
  WAYPOINTS = m.waypoints;
  PATH_CELLS = computePathCells(WAYPOINTS);
  game.mapId = m.id;
}

function positionAt(dist) {
  let remaining = dist;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = cellCenter(WAYPOINTS[i].col, WAYPOINTS[i].row);
    const b = cellCenter(WAYPOINTS[i + 1].col, WAYPOINTS[i + 1].row);
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= seg) {
      const t = remaining / seg;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, done: false };
    }
    remaining -= seg;
  }
  const last = cellCenter(WAYPOINTS.at(-1).col, WAYPOINTS.at(-1).row);
  return { x: last.x, y: last.y, done: true };
}

/* === Game state === */
const GOLEM_COOLDOWN = 55;
const DUNGEON_BASE_HP = 500;

const game = {
  canvas: null, ctx: null,
  gold: STARTING_GOLD,
  waveStartGold: STARTING_GOLD,
  stones: 0,
  hp: STARTING_HP,
  wave: 1,
  summonCost: SUMMON_COST_START,
  units: [],
  enemies: [],
  beams: [],
  popups: [],
  spawnQueue: [],
  spawnTimer: 0,
  waveRunning: false,
  nextWaveDelay: null,
  speed: 1,
  selectedUnit: null,
  draggingUnit: null,
  dragX: 0, dragY: 0,
  upgrades: { Common: 0, Epic: 0, Mythic: 0 },
  missions: [],
  gameOver: false,
  victory: false,
  lastTime: 0,
  golem: { cooldown: GOLEM_COOLDOWN, active: false, kills: 0 },
  dungeon: { units: [], boss: { hp: DUNGEON_BASE_HP, maxHp: DUNGEON_BASE_HP, tier: 1 }, kills: 0 },
  gems: 0,
  tokens: 0,
  artifacts: { sb: 0, mg: 0 },
  achievements: {},
  stats: { kills: 0, stuns: 0, golemKills: 0, dungeonClears: 0, unitLevels: {} },
  difficulty: 'normal',
  mapId: 'wind',
  particles: [],
  rings: [],
  shake: { time: 0, intensity: 0 },
  waveEscapes: 0,
  view: 'welcome',
  runActive: false,
  coop: {
    enabled: false,
    partnerUnits: [],
  },
  epTriggered: false,
};

const ui = {};

/* === Missions === */
function makeMissions() {
  return [
    { id: 'firstSummon',    text: 'Summon your first guardian', reward: { stones: 1 } },
    { id: 'squireGold',     text: 'Have a Squire earn gold',    reward: { stones: 1 } },
    { id: 'fiveCommons',    text: 'Have 5 Commons on board',    reward: { stones: 1 } },
    { id: 'firstMerge',     text: 'Merge 3 units',              reward: { stones: 1 } },
    { id: 'firstEpic',      text: 'Obtain an Epic unit',        reward: { stones: 1 } },
    { id: 'firstLegendary', text: 'Obtain a Legendary unit',    reward: { stones: 2 } },
    { id: 'firstMythic',    text: 'Obtain a Mythic unit',       reward: { stones: 3 } },
    { id: 'firstGolem',     text: 'Defeat a Golem',             reward: { stones: 1 } },
    { id: 'firstDungeon',   text: 'Clear a Dungeon boss',       reward: { stones: 1 } },
    { id: 'beatBoss',       text: 'Defeat your first boss',     reward: { stones: 1 } },
    { id: 'reachWave10',    text: 'Reach Wave 10',              reward: { stones: 2 } },
    { id: 'reachWave30',    text: 'Reach Wave 30',              reward: { stones: 3 } },
  ].map(m => ({ ...m, done: false }));
}

function completeMission(id) {
  const m = game.missions.find(x => x.id === id);
  if (!m || m.done) return;
  m.done = true;
  if (m.reward.stones) { game.stones += m.reward.stones; log(`Mission: ${m.text} (+${m.reward.stones} stone${m.reward.stones>1?'s':''})`, 'stone'); }
  renderMissions();
}

/* === Logging === */
function log(text, cls = '') {
  const li = document.createElement('li');
  li.className = cls;
  li.textContent = text;
  ui.logList.appendChild(li);
  while (ui.logList.children.length > 40) ui.logList.removeChild(ui.logList.firstChild);
  ui.logList.parentElement.scrollTop = ui.logList.parentElement.scrollHeight;
}

/* === Wave system === */
function buildWave(n) {
  const queue = [];
  if (n % 10 === 0) {
    const minionCount = 4 + Math.floor(n / 10);
    for (let i = 0; i < minionCount; i++) queue.push({ kind: 'normal' });
    queue.push({ kind: 'boss' });
  } else {
    const count = 8 + Math.floor(n * 0.4);
    const isElite = n >= 15 && n % 5 === 0;
    for (let i = 0; i < count; i++) queue.push({ kind: isElite ? 'elite' : 'normal' });
  }
  return queue;
}

function spawnDelay(kind) {
  if (kind === 'boss')  return 2.2;
  if (kind === 'elite') return 1.1;
  return 0.7;
}

function makeEnemy(kind, wave) {
  const diff = DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
  const isNormal = game.difficulty === 'normal';
  const normalScale = isNormal ? 1.075 : 1.088;
  const eliteScale = isNormal ? 1.085 : 1.098;
  const bossScale = isNormal ? 1.10 : 1.118;
  const tuning = {
    normal: { hp: 10 * Math.pow(normalScale, wave - 1), speed: 88, size: 16, def: Math.floor(wave * 0.55), magicRes: 0,                          color: '#e25555', glyph: '🐛' },
    elite:  { hp: 40 * Math.pow(eliteScale, wave - 1), speed: 70, size: 20, def: Math.floor(wave * 0.80), magicRes: wave >= 35 ? 0.18 : 0,      color: '#7a55c4', glyph: '💧' },
    boss:   { hp: 120* Math.pow(bossScale, wave - 1), speed: 42, size: 28, def: Math.floor(wave * 1.00), magicRes: wave >= 40 ? 0.30 : (wave >= 20 ? 0.15 : 0), color: '#1a1a1a', glyph: '💀' },
  }[kind];
  const hpMult = kind === 'boss' ? diff.bossHp : diff.enemyHp;
  const hp = tuning.hp * hpMult;
  const e = {
    kind,
    maxHp: hp, hp,
    baseSpeed: tuning.speed,
    size: tuning.size,
    def: Math.floor(tuning.def * diff.def),
    magicRes: tuning.magicRes,
    color: tuning.color,
    glyph: tuning.glyph,
    pathDist: 0, x: 0, y: 0,
    stunTimer: 0,
    slowTimer: 0, slowAmount: 0,
    defDownTimer: 0, defDownAmount: 0,
    burnTimer: 0, burnDps: 0, burnSource: null, burnType: 'magic',
    freezeTimer: 0,
    dead: false, escaped: false,
    entryTimer: kind === 'boss' ? 0.9 : 0,
  };
  const p = positionAt(0);
  e.x = p.x; e.y = p.y;
  return e;
}

function startWave() {
  if (game.waveRunning || game.gameOver) return;
  game.waveStartGold = game.gold;
  const interest = ARTIFACTS.sb.payoutAt(game.artifacts.sb, game.waveStartGold);
  if (interest > 0) {
    game.gold += interest;
    log(`Safe Box interest (+${interest}g)`, 'gold');
  }
  game.spawnQueue = buildWave(game.wave);
  game.spawnTimer = 0.4;
  game.waveRunning = true;
  game.waveEscapes = 0;
  showBanner(`Wave ${game.wave}${game.wave % 10 === 0 ? ' — BOSS' : ''}`);
  log(`Wave ${game.wave} starts`);
  updateUI();
}

function updateWaveSpawning(dt) {
  game.spawnTimer -= dt;
  while (game.spawnTimer <= 0 && game.spawnQueue.length > 0) {
    const next = game.spawnQueue.shift();
    const enemy = makeEnemy(next.kind, game.wave);
    game.enemies.push(enemy);
    if (next.kind === 'boss') {
      triggerShake(8, 0.6);
      showBanner('⚠ BOSS INCOMING ⚠');
      spawnRing(enemy.x, enemy.y, 120, '#ff7e7e', 0.7, 4);
      spawnParticleBurst(enemy.x, enemy.y, '#ff7e7e', 24);
    }
    game.spawnTimer += spawnDelay(next.kind);
  }
}

function checkWaveComplete() {
  if (game.spawnQueue.length === 0 && game.enemies.length === 0) {
    game.waveRunning = false;
    log(`Wave ${game.wave} cleared`, 'gold');
    if (game.waveEscapes === 0) unlock('untouched');
    if (game.wave % 5 === 0) {
      game.stones += 1;
      log('+1 Luck Stone (5-wave bonus)', 'stone');
    }
    if (game.wave === 1)  unlock('firstWave');
    if (game.wave === 10) { completeMission('reachWave10'); unlock('wave10'); }
    if (game.wave === 30) { completeMission('reachWave30'); unlock('wave30'); }
    if (game.wave === 50) unlock('wave50');
    if (game.wave === 10 && game.difficulty === 'hell') unlock('hellRun');
    if (game.wave === 30 && game.difficulty === 'hard') unlock('hardClear');
    if (game.wave >= MAX_WAVES) { endGame(true); return; }
    game.wave++;
    game.nextWaveDelay = WAVE_AUTO_DELAY;
    saveProgress();
    updateUI();
  }
}

/* === Enemies === */
function updateEnemies(dt) {
  for (const e of game.enemies) {
    if (e.dead || e.escaped) continue;
    if (e.stunTimer > 0) e.stunTimer = Math.max(0, e.stunTimer - dt);
    if (e.freezeTimer > 0) e.freezeTimer = Math.max(0, e.freezeTimer - dt);
    if (e.slowTimer > 0) { e.slowTimer = Math.max(0, e.slowTimer - dt); if (e.slowTimer === 0) e.slowAmount = 0; }
    if (e.defDownTimer > 0) { e.defDownTimer = Math.max(0, e.defDownTimer - dt); if (e.defDownTimer === 0) e.defDownAmount = 0; }
    if (e.burnTimer > 0) {
      e.burnTimer = Math.max(0, e.burnTimer - dt);
      const dmg = e.burnDps * dt;
      e.hp -= dmg;
      if (e.hp <= 0 && !e.dead) {
        e.dead = true;
        spawnParticleBurst(e.x, e.y, '#ff8a3a', 10);
        onEnemyKilled(e, e.burnSource);
      }
      if (e.burnTimer === 0) { e.burnDps = 0; e.burnSource = null; }
    }

    if (e.entryTimer > 0) { e.entryTimer = Math.max(0, e.entryTimer - dt); continue; }

    let speed = e.baseSpeed;
    if (e.stunTimer > 0 || e.freezeTimer > 0) speed = 0;
    else if (e.slowAmount > 0) speed *= (1 - e.slowAmount);

    e.pathDist += speed * dt;
    const pos = positionAt(e.pathDist);
    e.x = pos.x; e.y = pos.y;
    if (pos.done) {
      e.escaped = true;
      game.waveEscapes++;
      const dmg = e.kind === 'boss' ? 5 : e.kind === 'golem' ? 3 : e.kind === 'elite' ? 2 : 1;
      game.hp -= dmg;
      triggerShake(4 + dmg, 0.25);
      log(`Escape! ${e.glyph} reached the base (-${dmg} HP)`, 'danger');
      if (e.kind === 'golem') {
        game.golem.active = false;
        game.golem.cooldown = GOLEM_COOLDOWN;
      }
      if (game.hp <= 0) {
        const epLvl = game.artifacts.ep || 0;
        if (epLvl > 0 && !game.epTriggered) {
          game.epTriggered = true;
          game.hp = ARTIFACTS.ep.restoreAt(epLvl);
          log(`Emergency Patch Triggered! Restored ${game.hp} HP`, 'legendary');
          spawnRing(e.x, e.y, 100, '#ff6e6e', 0.8, 5);
        } else {
          game.hp = 0; endGame(false);
        }
      }
    }
  }
  game.enemies = game.enemies.filter(e => !e.dead && !e.escaped);
}

function damageEnemy(enemy, dmg, type, killer) {
  let actual = dmg;
  if (type === 'physical') {
    const effDef = enemy.def * (1 - (enemy.defDownAmount || 0));
    actual = Math.max(1, dmg - effDef);
  } else if (type === 'magic') {
    actual = dmg * (1 - enemy.magicRes);
  }
  enemy.hp -= actual;
  spawnPopup(enemy.x, enemy.y - enemy.size, Math.round(actual).toString(), type === 'magic' ? '#9bd9ff' : '#ffe5a3');
  if (enemy.hp <= 0 && !enemy.dead) {
    enemy.dead = true;
    const burstColor = enemy.kind === 'boss' ? '#ff7e7e' : enemy.kind === 'golem' ? '#d2a76a' : enemy.color;
    const burstCount = enemy.kind === 'boss' || enemy.kind === 'golem' ? 26 : enemy.kind === 'elite' ? 14 : 8;
    spawnParticleBurst(enemy.x, enemy.y, burstColor, burstCount);
    if (enemy.kind === 'boss')  triggerShake(8, 0.4);
    if (enemy.kind === 'golem') triggerShake(6, 0.3);
    onEnemyKilled(enemy, killer);
  }
}

function onEnemyKilled(enemy, killer) {
  const rewardMult = (DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal).reward;
  const cmLvl = game.artifacts.cm || 0;
  const coinMult = (cmLvl > 0 && Math.random() < ARTIFACTS.cm.chanceAt(cmLvl)) ? 2 : 1;
  if (coinMult > 1) spawnPopup(enemy.x, enemy.y, '×2 GOLD!', '#ffd166');

  if (enemy.kind === 'normal') game.gold += (1 + Math.floor(game.wave * 0.15)) * rewardMult * coinMult;
  else if (enemy.kind === 'elite') game.gold += (5 + Math.floor(game.wave * 0.3)) * rewardMult * coinMult;
  else if (enemy.kind === 'boss') {
    const reward = Math.round((20 + game.wave * 1.2) * rewardMult);
    game.gold += reward;
    game.stones += 1;
    game.gems = (game.gems || 0) + 5;
    log(`Boss defeated (+${reward}g, +1 stone, +5 gems)`, 'gold');
    completeMission('beatBoss');
  } else if (enemy.kind === 'golem') {
    const reward = Math.round((35 + game.wave * 1.8) * rewardMult);
    game.gold += reward;
    game.stones += 1;
    game.golem.active = false;
    game.golem.kills += 1;
    game.golem.cooldown = GOLEM_COOLDOWN;
    log(`Golem defeated (+${reward}g, +1 stone)`, 'gold');
    completeMission('firstGolem');
    game.stats.golemKills = (game.stats.golemKills || 0) + 1;
    if (game.stats.golemKills >= 5) unlock('golem5');
    saveProgress();
    updateUI();
  }
  noteKill();
}

/* === Units === */
function unitDamage(unit) {
  const d = UNITS[unit.id];
  let dmg = d.dmg;
  if (d.rarity === 'Common' || d.rarity === 'Rare') dmg *= 1 + 0.14 * game.upgrades.Common;
  else if (d.rarity === 'Epic')                     dmg *= 1 + 0.14 * game.upgrades.Epic;
  else                                              dmg *= 1 + 0.16 * game.upgrades.Mythic;

  const famLvl = game.stats.unitLevels[d.family] || 1;
  dmg *= (1 + (famLvl - 1) * 0.04);
  dmg *= (ARTIFACTS.at.dmgMultAt(game.artifacts.at || 0));

  dmg *= ARTIFACTS.mg.multAt(game.artifacts.mg, game.gold);
  if (d.variable) dmg *= 0.5 + Math.random();
  return dmg;
}

function manaGainFor(u, c) {
  // Each attack grants +1 mana; allies inside a Catalyst's aura gain +1
  // extra (capped at +2 from auras to keep stacking sane).
  let gain = 1;
  let bonus = 0;
  for (const ally of game.units) {
    if (ally === u) continue;
    const ad = UNITS[ally.id];
    if (!ad.manaAura) continue;
    const ac = cellCenter(ally.col, ally.row);
    if (Math.hypot(c.x - ac.x, c.y - ac.y) <= ad.manaAura * TILE) {
      bonus++;
      if (bonus >= 2) break;
    }
  }
  return gain + bonus;
}

function applyBurn(e, dps, duration, source, type) {
  if (dps >= (e.burnDps || 0)) {
    e.burnDps = dps;
    e.burnSource = source;
    e.burnType = type || 'magic';
  }
  e.burnTimer = Math.max(e.burnTimer || 0, duration);
}

function applyFreeze(e, duration) {
  if (e.freezeTimer <= 0) noteStun();
  e.freezeTimer = Math.max(e.freezeTimer || 0, duration);
  spawnSlowFlakes(e.x, e.y - e.size);
}

function updateUnits(dt) {
  const allUnits = [...game.units, ...(game.coop.enabled ? game.coop.partnerUnits : [])];
  for (const u of allUnits) {
    u.flash = Math.max(0, (u.flash || 0) - dt);
    u.cooldown = (u.cooldown || 0) - dt;
    if (u.cooldown > 0) continue;
    const d = UNITS[u.id];
    const c = cellCenter(u.col, u.row);
    const rangePx = d.range * TILE;
    let target = null, best = Infinity;
    for (const e of game.enemies) {
      if (e.dead || e.escaped) continue;
      const dist = Math.hypot(e.x - c.x, e.y - c.y);
      if (dist <= rangePx && dist < best) { best = dist; target = e; }
    }
    if (!target) continue;

    let dmg = unitDamage(u);
    if (u.stackCount > 1) dmg *= u.stackCount;
    if (d.percentHP) dmg += target.maxHp * d.percentHP * (u.stackCount || 1);
    damageEnemy(target, dmg, d.type, u);

    if (d.aoe) {
      const aoeR = d.aoe * TILE;
      spawnRing(target.x, target.y, aoeR, d.type === 'magic' ? '#9bd9ff' : '#ffd166', 0.35, 2);
      for (const e of game.enemies) {
        if (e === target || e.dead || e.escaped) continue;
        if (Math.hypot(e.x - target.x, e.y - target.y) <= aoeR) {
          damageEnemy(e, dmg * 0.55, d.type, u);
          if (d.burn) applyBurn(e, d.burn.dps, d.burn.duration, u, d.type);
        }
      }
    }
    if (d.burn && !target.dead) {
      applyBurn(target, d.burn.dps, d.burn.duration, u, d.type);
    }
    if (d.stun && Math.random() < d.stun.chance) {
      const stunMult = (DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal).stunMult;
      if (target.stunTimer <= 0) noteStun();
      target.stunTimer = Math.max(target.stunTimer, d.stun.duration * stunMult);
      spawnStunSparks(target.x, target.y - target.size);
    }
    if (d.slow) {
      const fresh = target.slowTimer <= 0;
      target.slowAmount = Math.max(target.slowAmount, d.slow.amount);
      target.slowTimer  = Math.max(target.slowTimer,  d.slow.duration);
      if (fresh) spawnSlowFlakes(target.x, target.y - target.size);
    }
    if (d.freezeChance && Math.random() < d.freezeChance && !target.dead) {
      const stunMult = (DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal).stunMult;
      applyFreeze(target, (d.freezeDuration || 0.6) * stunMult);
    }
    if (d.defDown) {
      const fresh = target.defDownTimer <= 0;
      target.defDownAmount = Math.max(target.defDownAmount, d.defDown.amount);
      target.defDownTimer  = Math.max(target.defDownTimer,  d.defDown.duration);
      if (fresh) spawnRing(target.x, target.y, target.size + 12, '#ff9090', 0.3, 2);
    }
    game.beams.push({
      x1: c.x, y1: c.y, x2: target.x, y2: target.y,
      life: 0.2, color: d.type === 'magic' ? '#9bd9ff' : '#ffd166',
      width: d.rarity === 'Mythic' ? 4 : 2,
    });

    // Mana charge & ability trigger.
    if (d.loot && !target.dead) {
      const amt = d.loot;
      game.gold += amt;
      spawnPopup(target.x, target.y - 10, `+${amt}g`, '#f5c542');
      spawnCoin(target.x, target.y);
      completeMission('squireGold');
    }

    if (d.manaMax) {
      u.mana = (u.mana || 0) + manaGainFor(u, c);
      if (u.mana >= d.manaMax) {
        u.mana = 0;
        triggerAbility(u, target, c);
      }
    }

    // Family signature — charges every N attacks (N shrinks with rarity).
    u.atkCount = (u.atkCount || 0) + 1;
    if (u.atkCount >= (SIGNATURE_CADENCE[d.rarity] || 8)) {
      u.atkCount = 0;
      triggerSignature(u, target, c);
    }

    const famLvl = game.stats.unitLevels[d.family] || 1;
    const apsBonus = (1 + (famLvl - 1) * 0.02) * ARTIFACTS.oc.apsMultAt(game.artifacts.oc || 0);
    u.cooldown = 1 / (d.aps * apsBonus);
    u.flash = 0.1;
  }
}

function updateAI(dt) {
  if (!game.coop.enabled || game.gameOver) return;

  // AI simple logic: summon if enough gold, merge if possible.
  // AI has its own "simulated" gold based on game wave and a timer.
  game.coop.aiGold = (game.coop.aiGold || 0) + (10 + game.wave) * dt * 0.5;
  game.coop.summonTimer = (game.coop.summonTimer || 0) - dt;

  if (game.coop.aiGold >= game.summonCost && game.coop.summonTimer <= 0) {
    const choices = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 5; c < COLS; c++) { // Right side for AI
        if (PATH_CELLS.has(`${c},${r}`)) continue;
        if (game.units.some(u => u.col === c && u.row === r)) continue;
        if (game.coop.partnerUnits.some(u => u.col === c && u.row === r)) continue;
        choices.push([c, r]);
      }
    }
    if (choices.length > 0) {
      const cell = choices[Math.floor(Math.random() * choices.length)];
      game.coop.aiGold -= game.summonCost;
      game.coop.summonTimer = 2.0;
      const rarity = Math.random() < 0.8 ? 'Common' : 'Rare';
      const id = POOLS[rarity][Math.floor(Math.random() * POOLS[rarity].length)];
      game.coop.partnerUnits.push({ id, col: cell[0], row: cell[1], cooldown: 0, flash: 0, mana: 0, atkCount: 0, stackCount: 1 });
    }
  }

  // AI simple merge logic
  game.coop.mergeTimer = (game.coop.mergeTimer || 0) - dt;
  if (game.coop.mergeTimer <= 0) {
    game.coop.mergeTimer = 5.0;
    const unitGroups = {};
    for (const u of game.coop.partnerUnits) {
      unitGroups[u.id] = (unitGroups[u.id] || 0) + (u.stackCount || 1);
    }
    for (const id in unitGroups) {
      if (unitGroups[id] >= 3 && MERGE_RECIPES[id]) {
        const same = game.coop.partnerUnits.filter(x => x.id === id);
        const toRemove = same.slice(0, 3);
        const keepCell = { col: toRemove[0].col, row: toRemove[0].row };
        for (const x of toRemove) {
          const idx = game.coop.partnerUnits.indexOf(x);
          game.coop.partnerUnits.splice(idx, 1);
        }
        game.coop.partnerUnits.push({ id: MERGE_RECIPES[id], col: keepCell.col, row: keepCell.row, cooldown: 0, flash: 0, mana: 0, atkCount: 0 });
        break;
      }
    }
  }
}

/* === Mythic / Immortal abilities === */
function triggerAbility(u, target, c) {
  const d = UNITS[u.id];
  switch (d.ability) {
    case 'frostBomb': {
      const r = (d.range + 0.6) * TILE;
      spawnRing(c.x, c.y, r, '#9bd9ff', 0.75, 4);
      spawnParticleBurst(c.x, c.y, '#9bd9ff', 18);
      for (const e of game.enemies) {
        if (e.dead || e.escaped) continue;
        if (Math.hypot(e.x - c.x, e.y - c.y) <= r) {
          applyFreeze(e, 2.0 * (DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal).stunMult);
          damageEnemy(e, unitDamage(u) * 0.6, 'magic', u);
        }
      }
      log(`❄ ${d.name} unleashes Frost Bomb!`, 'mythic');
      break;
    }
    case 'infernoBlast': {
      const cx = target ? target.x : c.x, cy = target ? target.y : c.y;
      const r = (d.aoe + 1.3) * TILE;
      spawnRing(cx, cy, r, '#ff7e3a', 0.8, 5);
      spawnParticleBurst(cx, cy, '#ff7e3a', 26);
      triggerShake(5, 0.25);
      for (const e of game.enemies) {
        if (e.dead || e.escaped) continue;
        if (Math.hypot(e.x - cx, e.y - cy) <= r) {
          damageEnemy(e, unitDamage(u) * 1.8, 'magic', u);
          applyBurn(e, (d.burn ? d.burn.dps : 20) * 2.2, 4.0, u, 'magic');
        }
      }
      log(`☄ ${d.name} ignites the path!`, 'mythic');
      break;
    }
    case 'multiShot': {
      const r = d.range * TILE;
      const pool = game.enemies.filter(e => !e.dead && !e.escaped && e !== target &&
        Math.hypot(e.x - c.x, e.y - c.y) <= r);
      for (let i = 0; i < 2 && pool.length; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const e = pool.splice(idx, 1)[0];
        damageEnemy(e, unitDamage(u), 'physical', u);
        game.beams.push({ x1: c.x, y1: c.y, x2: e.x, y2: e.y, life: 0.18, color: '#a8e055' });
      }
      break;
    }
    case 'critStrike': {
      if (target && !target.dead) {
        // Already dealt 1× this attack; deliver 4× more for a 5× total.
        damageEnemy(target, unitDamage(u) * 4, 'physical', u);
        spawnRing(target.x, target.y, target.size + 20, '#ff5050', 0.5, 4);
        spawnParticleBurst(target.x, target.y, '#ff5050', 18);
        log(`💥 ${d.name} unleashes Crushing Crit!`, 'mythic');
      }
      break;
    }
    case 'chainLightning': {
      const r = d.range * TILE * 1.4;
      const pool = game.enemies.filter(e => !e.dead && !e.escaped &&
        Math.hypot(e.x - c.x, e.y - c.y) <= r);
      let prev = { x: c.x, y: c.y };
      for (let i = 0; i < 6 && pool.length; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const e = pool.splice(idx, 1)[0];
        damageEnemy(e, unitDamage(u) * 1.4, 'magic', u);
        game.beams.push({ x1: prev.x, y1: prev.y, x2: e.x, y2: e.y, life: 0.28, color: '#b06bf0' });
        spawnParticleBurst(e.x, e.y, '#b06bf0', 6);
        prev = { x: e.x, y: e.y };
      }
      log(`⚡ ${d.name} chains lightning!`, 'mythic');
      break;
    }
    case 'crushingBlow': {
      if (target && !target.dead) {
        damageEnemy(target, unitDamage(u) * 4 + target.maxHp * 0.06, 'physical', u);
        triggerShake(7, 0.3);
        spawnParticleBurst(target.x, target.y, '#ffd166', 18);
        log(`🦸 ${d.name} delivers a Crushing Blow!`, 'mythic');
      }
      break;
    }
    case 'starfall': {
      const r = d.range * TILE * 1.5;
      const enemies = game.enemies.filter(e => !e.dead && !e.escaped &&
        Math.hypot(e.x - c.x, e.y - c.y) <= r);
      for (const e of enemies) {
        damageEnemy(e, unitDamage(u) * 1.8, 'magic', u);
        spawnParticleBurst(e.x, e.y, '#ffffff', 8);
      }
      spawnRing(c.x, c.y, r, '#ffffff', 0.7, 3);
      log(`🦋 ${d.name} calls down Starfall!`, 'mythic');
      break;
    }
  }
  unlock('ability');
}

/* === Family signatures (every unit, charged by attack count) === */
function triggerSignature(u, target, c) {
  const d = UNITS[u.id];
  const sig = SIGNATURE[d.family];
  if (!sig) return;
  const stunMult = (DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal).stunMult;
  const rarityCls = d.rarity.toLowerCase();
  switch (d.family) {
    case 'frost': {
      // Nova around the caster: deep-slow at low tiers, true freeze at Epic+.
      const r = d.range * 0.7 * TILE;
      const freeze = d.rarity !== 'Common' && d.rarity !== 'Rare';
      const freezeDur = d.rarity === 'Epic' ? 0.6 : d.rarity === 'Legendary' ? 1.0 : 1.4;
      spawnRing(c.x, c.y, r, sig.color, 0.6, 4);
      spawnParticleBurst(c.x, c.y, sig.color, 14);
      for (const e of game.enemies) {
        if (e.dead || e.escaped) continue;
        if (Math.hypot(e.x - c.x, e.y - c.y) > r) continue;
        damageEnemy(e, unitDamage(u) * 0.8, 'magic', u);
        if (e.dead) continue;
        if (freeze) {
          applyFreeze(e, freezeDur * stunMult);
        } else {
          const fresh = e.slowTimer <= 0;
          e.slowAmount = Math.max(e.slowAmount, 0.70);
          e.slowTimer  = Math.max(e.slowTimer, 1.2);
          if (fresh) spawnSlowFlakes(e.x, e.y - e.size);
        }
      }
      log(`❄ ${d.name} unleashes Frost Nova!`, rarityCls);
      break;
    }
    case 'burn': {
      // Splash at the target leaving a stronger, longer burn.
      const cx = target ? target.x : c.x, cy = target ? target.y : c.y;
      const r = 0.9 * TILE;
      const dps = (d.burn ? d.burn.dps : Math.max(2, unitDamage(u) * 0.15)) * 2;
      const dur = (d.burn ? d.burn.duration : 2.0) + 2.5;
      spawnRing(cx, cy, r, sig.color, 0.55, 4);
      spawnParticleBurst(cx, cy, sig.color, 16);
      for (const e of game.enemies) {
        if (e.dead || e.escaped) continue;
        if (Math.hypot(e.x - cx, e.y - cy) > r) continue;
        damageEnemy(e, unitDamage(u) * 1.1, 'magic', u);
        if (!e.dead) applyBurn(e, dps, dur, u, 'magic');
      }
      log(`🔥 ${d.name} erupts in an Ember Burst!`, rarityCls);
      break;
    }
    case 'sniper': {
      // Strong shot piercing K extra enemies in range.
      const k = d.rarity === 'Common' || d.rarity === 'Rare' ? 1
              : d.rarity === 'Epic' || d.rarity === 'Legendary' ? 2 : 3;
      const r = d.range * TILE;
      const pool = game.enemies.filter(e => !e.dead && !e.escaped && e !== target &&
        Math.hypot(e.x - c.x, e.y - c.y) <= r);
      for (let i = 0; i < k && pool.length; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const e = pool.splice(idx, 1)[0];
        damageEnemy(e, unitDamage(u) * 1.3, 'physical', u);
        game.beams.push({ x1: c.x, y1: c.y, x2: e.x, y2: e.y, life: 0.18, color: sig.color });
        spawnParticleBurst(e.x, e.y, sig.color, 5);
      }
      log(`🎯 ${d.name} fires a Piercing Volley!`, rarityCls);
      break;
    }
    case 'bruiser': {
      // Single devastating hit + bonus % max HP and a brief stun.
      if (target && !target.dead) {
        damageEnemy(target, unitDamage(u) * 3.5 + target.maxHp * 0.04, 'physical', u);
        if (!target.dead) {
          if (target.stunTimer <= 0) noteStun();
          target.stunTimer = Math.max(target.stunTimer, 0.5 * stunMult);
          spawnStunSparks(target.x, target.y - target.size);
        }
        triggerShake(4, 0.2);
        spawnParticleBurst(target.x, target.y, '#ffd166', 16);
        log(`💥 ${d.name} lands a Crushing Slam!`, rarityCls);
      }
      break;
    }
    case 'arcane': {
      // Pour mana into nearby charging allies and zap the target.
      const r = 2.4 * TILE;
      let buffed = 0;
      for (const ally of game.units) {
        if (ally === u) continue;
        const ad = UNITS[ally.id];
        if (!ad.manaMax) continue;
        const ac = cellCenter(ally.col, ally.row);
        if (Math.hypot(c.x - ac.x, c.y - ac.y) > r) continue;
        ally.mana = Math.min(ad.manaMax, (ally.mana || 0) + 2);
        game.beams.push({ x1: c.x, y1: c.y, x2: ac.x, y2: ac.y, life: 0.22, color: sig.color });
        spawnParticleBurst(ac.x, ac.y, sig.color, 6);
        buffed++;
      }
      spawnRing(c.x, c.y, r, sig.color, 0.6, 3);
      if (target && !target.dead) damageEnemy(target, unitDamage(u) * 1.2, 'magic', u);
      log(`✨ ${d.name} channels a Mana Surge${buffed ? ` (+${buffed})` : ''}!`, rarityCls);
      break;
    }
  }
  unlock('ability');
}

function findEmptyCell(id) {
  const emptyChoices = [];
  const stackChoices = [];
  const d = id ? UNITS[id] : null;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (PATH_CELLS.has(`${c},${r}`)) continue;

      const occupant = game.units.find(u => u.col === c && u.row === r);
      if (!occupant) {
        emptyChoices.push([c, r]);
      } else if (d && d.rarity === 'Common' && occupant.id === id && (occupant.stackCount || 1) < 3) {
        stackChoices.push([c, r]);
      }
    }
  }

  // Prioritize stacking Level 1 units if possible
  if (stackChoices.length > 0) {
    return stackChoices[Math.floor(Math.random() * stackChoices.length)];
  }
  if (emptyChoices.length > 0) {
    return emptyChoices[Math.floor(Math.random() * emptyChoices.length)];
  }
  return null;
}

function spawnUnit(id, col, row) {
  const d = UNITS[id];
  if (d.rarity === 'Common') {
    const existing = game.units.find(x => x.col === col && x.row === row && x.id === id);
    if (existing && (existing.stackCount || 1) < 3) {
      existing.stackCount = (existing.stackCount || 1) + 1;
      log(`Stacked ${d.name} (x${existing.stackCount})`, 'common');
      return existing;
    }
  }

  const u = { id, col, row, cooldown: 0, flash: 0, mana: 0, atkCount: 0, stackCount: 1 };
  game.units.push(u);
  log(`Summoned ${d.name}`, d.rarity.toLowerCase());
  if (d.rarity === 'Epic')      completeMission('firstEpic');
  if (d.rarity === 'Legendary') completeMission('firstLegendary');
  if (d.rarity === 'Mythic')    completeMission('firstMythic');
  if (d.rarity === 'Immortal')  unlock('immortal');
  const commons = game.units.filter(x => UNITS[x.id].rarity === 'Common').length;
  if (commons >= 5) completeMission('fiveCommons');
  // Family achievement: a guardian from every family currently on board.
  const fams = new Set(game.units.map(x => UNITS[x.id].family));
  if (fams.size >= Object.keys(FAMILIES).length) unlock('allFamilies');
  return u;
}

function summon() {
  if (game.gold < game.summonCost) return;

  const rarity = Math.random() < 0.78 ? 'Common' : 'Rare';
  const id = POOLS[rarity][Math.floor(Math.random() * POOLS[rarity].length)];

  const cell = findEmptyCell(id);
  if (!cell) { log('Board is full', 'danger'); return; }

  game.gold -= game.summonCost;
  game.summonCost = Math.min(SUMMON_COST_CAP, game.summonCost + SUMMON_COST_STEP);
  spawnUnit(id, cell[0], cell[1]);
  completeMission('firstSummon');
  updateUI();
}

function rouletteEpic() {
  if (game.stones < EPIC_ROULETTE_COST) return;
  const cell = findEmptyCell();
  if (!cell) { log('Board is full', 'danger'); return; }
  game.stones -= EPIC_ROULETTE_COST;
  if (Math.random() < EPIC_ROULETTE_CHANCE) {
    const id = POOLS.Epic[Math.floor(Math.random() * POOLS.Epic.length)];
    spawnUnit(id, cell[0], cell[1]);
  } else {
    const id = POOLS.Rare[Math.floor(Math.random() * POOLS.Rare.length)];
    spawnUnit(id, cell[0], cell[1]);
    log('Roulette missed — landed on a Rare', 'danger');
  }
  updateUI();
}

function rouletteLegendary() {
  if (game.stones < LEGENDARY_ROULETTE_COST) return;
  const cell = findEmptyCell();
  if (!cell) { log('Board is full', 'danger'); return; }
  game.stones -= LEGENDARY_ROULETTE_COST;
  if (Math.random() < LEGENDARY_ROULETTE_CHANCE) {
    const id = POOLS.Legendary[Math.floor(Math.random() * POOLS.Legendary.length)];
    spawnUnit(id, cell[0], cell[1]);
    triggerShake(4, 0.25);
    const c = cellCenter(cell[0], cell[1]);
    spawnParticleBurst(c.x, c.y, RARITY_COLORS.Legendary, 18);
  } else {
    const id = POOLS.Epic[Math.floor(Math.random() * POOLS.Epic.length)];
    spawnUnit(id, cell[0], cell[1]);
    log('Roulette missed — landed on an Epic', 'danger');
  }
  updateUI();
}

function mergeSelected() {
  const u = game.selectedUnit;
  if (!u || !isReadyToMerge(u)) return;
  const d = UNITS[u.id];
  const recipeId = MERGE_RECIPES[u.id];

  if (recipeId) {
    // Standard 3-of-a-kind merge
    const allOfSameType = game.units.filter(x => x.id === u.id);

    // Collect exactly 3 to remove
    let countToRemove = 3;
    const toRemove = [];
    const keepCell = { col: u.col, row: u.row };

    // Sort to prioritize removing the selected unit or smaller stacks?
    // Let's just iterate and take what we need.
    for (const x of allOfSameType) {
      if (countToRemove <= 0) break;
      if (x.stackCount <= countToRemove) {
        countToRemove -= x.stackCount;
        toRemove.push({ unit: x, amount: x.stackCount });
      } else {
        x.stackCount -= countToRemove;
        countToRemove = 0;
        // Not adding to toRemove because it's not fully removed
      }
    }

    for (const item of toRemove) {
      const idx = game.units.indexOf(item.unit);
      if (idx >= 0) game.units.splice(idx, 1);
    }

    const newUnit = spawnUnit(recipeId, keepCell.col, keepCell.row);
    game.selectedUnit = newUnit;
    completeMission('firstMerge');
    log(`Merge → ${UNITS[recipeId].name}!`, UNITS[recipeId].rarity.toLowerCase());
    updateUI();
  } else {
    // Check for Mythic or Immortal recipes
    const combinedRecipes = { ...MYTHIC_RECIPES, ...IMMORTAL_RECIPES };
    let foundRecipe = null;
    for (const rid in combinedRecipes) {
      const r = combinedRecipes[rid];
      if (r.ingredients.includes(u.id)) {
        // Potential recipe found. Check if all ingredients are on board.
        const currentUnits = [...game.units];
        const matchIdxs = [];
        let possible = true;
        for (const ingId of r.ingredients) {
          const idx = currentUnits.findIndex(x => x.id === ingId);
          if (idx >= 0) {
            matchIdxs.push(game.units.indexOf(currentUnits[idx]));
            currentUnits.splice(idx, 1);
          } else {
            possible = false;
            break;
          }
        }
        if (possible && game.stones >= r.stones) {
          foundRecipe = r;
          foundRecipe.matchIdxs = matchIdxs;
          break;
        }
      }
    }

    if (foundRecipe) {
      game.stones -= foundRecipe.stones;
      const keepCell = { col: game.units[foundRecipe.matchIdxs[0]].col, row: game.units[foundRecipe.matchIdxs[0]].row };

      // Sort indexes descending to remove safely
      foundRecipe.matchIdxs.sort((a, b) => b - a);
      for (const idx of foundRecipe.matchIdxs) {
        game.units.splice(idx, 1);
      }

      const newUnit = spawnUnit(foundRecipe.result, keepCell.col, keepCell.row);
      const newRarity = UNITS[foundRecipe.result].rarity;
      const c = cellCenter(keepCell.col, keepCell.row);

      if (newRarity === 'Mythic') {
        unlock('forge');
        spawnRing(c.x, c.y, 48, RARITY_COLORS.Mythic, 0.55, 4);
        spawnParticleBurst(c.x, c.y, RARITY_COLORS.Mythic, 18);
      } else if (newRarity === 'Immortal') {
        spawnRing(c.x, c.y, 64, '#ffffff', 0.7, 5);
        spawnParticleBurst(c.x, c.y, '#ffffff', 26);
        triggerShake(6, 0.35);
      }

      game.selectedUnit = newUnit;
      log(`Recipe Complete: ${UNITS[foundRecipe.result].name}! (-${foundRecipe.stones} stones)`, newRarity.toLowerCase());
      updateUI();
    } else {
      log(`${d.name} cannot be merged or lacks ingredients/stones for a recipe`, 'danger');
    }
  }
}

function sellSelected() {
  const u = game.selectedUnit;
  if (!u) return;
  const d = UNITS[u.id];
  let refund = { Common: 4, Rare: 9, Epic: 35, Legendary: 100, Mythic: 250, Immortal: 600 }[d.rarity];
  if (u.stackCount > 1) refund *= u.stackCount;
  game.gold += refund;
  const onBoard = game.units.indexOf(u);
  if (onBoard >= 0) game.units.splice(onBoard, 1);
  const inDungeon = game.dungeon.units.indexOf(u);
  if (inDungeon >= 0) game.dungeon.units.splice(inDungeon, 1);
  game.selectedUnit = null;
  log(`Sold ${d.name} (+${refund}g)`, 'gold');
  renderDungeon();
  updateUI();
}

/* === Golem === */

function spawnGolem() {
  if (game.golem.active || game.gameOver) return;
  const wave = game.wave;
  const hp = 110 * Math.pow(1.08, wave - 1);
  const p = positionAt(0);
  game.enemies.push({
    kind: 'golem',
    maxHp: hp, hp,
    baseSpeed: 48,
    size: 24,
    def: Math.floor(wave * 0.55),
    magicRes: 0,
    color: '#6c5a3e',
    glyph: '🗿',
    pathDist: 0, x: p.x, y: p.y,
    stunTimer: 0, slowTimer: 0, slowAmount: 0,
    defDownTimer: 0, defDownAmount: 0,
    dead: false, escaped: false,
    entryTimer: 0.6,
  });
  game.golem.active = true;
  triggerShake(7, 0.35);
  spawnRing(p.x, p.y, 80, '#d2a76a', 0.6, 3);
  spawnParticleBurst(p.x, p.y, '#d2a76a', 18);
  log('A Golem lumbers onto the path!', 'epic');
  updateUI();
}

function updateGolem(dt) {
  if (game.golem.active) return;
  game.golem.cooldown -= dt;
  if (game.golem.cooldown <= 0) {
    spawnGolem();
  }
}

/* === Dungeon === */
function dungeonDps(unit) {
  const d = UNITS[unit.id];
  // Sniper line is the dedicated farmer (steady ranged damage).
  const familyMult = d.family === 'sniper' ? 0.28 : 0.18;
  return unitDamage(unit) * d.aps * familyMult;
}

function dungeonRecruitable(unit) {
  if (!unit) return false;
  const r = UNITS[unit.id].rarity;
  return r !== 'Common';
}

function sendToDungeon() {
  const u = game.selectedUnit;
  if (!u || !dungeonRecruitable(u)) return;
  const idx = game.units.indexOf(u);
  if (idx < 0) return;
  game.units.splice(idx, 1);
  game.dungeon.units.push(u);
  log(`${UNITS[u.id].name} descends to the Dungeon`);
  game.selectedUnit = null;
  renderDungeon();
  updateUI();
}

function recallFromDungeon(unit) {
  const idx = game.dungeon.units.indexOf(unit);
  if (idx < 0) return;
  const cell = findEmptyCell();
  if (!cell) { log('No room on the board for the returning unit', 'danger'); return; }
  game.dungeon.units.splice(idx, 1);
  unit.col = cell[0];
  unit.row = cell[1];
  unit.cooldown = 0;
  game.units.push(unit);
  log(`${UNITS[unit.id].name} returns from the Dungeon`);
  renderDungeon();
  updateUI();
}

function updateDungeon(dt) {
  if (game.dungeon.units.length === 0) return;
  let dps = 0;
  for (const u of game.dungeon.units) {
    dps += dungeonDps(u);
  }
  game.dungeon.boss.hp -= dps * dt;
  if (game.dungeon.boss.hp <= 0) {
    const tier = game.dungeon.boss.tier;
    game.dungeon.kills += 1;
    log(`Dungeon boss T${tier} falls`, 'gold');
    completeMission('firstDungeon');
    game.dungeon.boss.tier = tier + 1;
    const newHp = DUNGEON_BASE_HP * Math.pow(1.65, tier);
    game.dungeon.boss.hp = newHp;
    game.dungeon.boss.maxHp = newHp;
    game.stats.dungeonClears = (game.stats.dungeonClears || 0) + 1;
    if (game.stats.dungeonClears >= 10) unlock('dungeon10');
    if (game.dungeon.boss.tier >= 5) unlock('dungeon5');
    saveProgress();
  }
  renderDungeonStatus();
}

/* === Upgrades === */
function upgradeCostFor(tier) {
  return ({
    Common: 35 + 22 * game.upgrades.Common,
    Epic:   110 + 60 * game.upgrades.Epic,
    Mythic: 300 + 180 * game.upgrades.Mythic,
  })[tier];
}

function upgrade(tier) {
  const cost = upgradeCostFor(tier);
  if (game.gold < cost) return;
  game.gold -= cost;
  game.upgrades[tier]++;
  log(`${tier} damage upgraded → Lv ${game.upgrades[tier]}`, 'gold');
  updateUI();
}

/* === Artifacts === */
function upgradeArtifact(id) {
  const def = ARTIFACTS[id];
  if (!def) return;
  const lvl = game.artifacts[id] || 0;
  if (lvl >= ARTIFACT_MAX_LEVEL) return;
  const cost = def.upgradeCost(lvl);
  if ((game.gems || 0) < cost) return;
  game.gems -= cost;
  game.artifacts[id] = lvl + 1;
  if (id === 'sb' && game.artifacts.sb >= 5) unlock('sbMax');
  if (id === 'mg' && game.artifacts.mg >= 5) unlock('mgMax');
  saveProgress();
  if (game.view === 'welcome') refreshWelcome();
  else renderArtifacts();
  updateUI();
}

/* === Achievements === */
function unlock(id) {
  if (game.achievements[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  game.achievements[id] = true;
  log(`Achievement: ${a.title}`, 'legendary');
  saveProgress();
  renderAchievements();
}

function noteKill() {
  game.stats.kills = (game.stats.kills || 0) + 1;
  if (game.stats.kills >= 1000) unlock('kill1000');
}

function noteStun() {
  game.stats.stuns = (game.stats.stuns || 0) + 1;
  if (game.stats.stuns >= 100) unlock('stun100');
}

function checkHoard() {
  if (game.gold >= 2500) unlock('hoard');
}

/* === Effects === */
function updateEffects(dt) {
  for (const b of game.beams) b.life -= dt;
  game.beams = game.beams.filter(b => b.life > 0);
  for (const p of game.popups) { p.life -= dt; p.y -= 22 * dt; }
  game.popups = game.popups.filter(p => p.life > 0);
  for (const p of game.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 240 * dt;
  }
  game.particles = game.particles.filter(p => p.life > 0);
  for (const r of game.rings) {
    r.life -= dt;
    r.radius = r.maxRadius * (1 - r.life / r.maxLife);
  }
  game.rings = game.rings.filter(r => r.life > 0);
  if (game.shake.time > 0) game.shake.time = Math.max(0, game.shake.time - dt);
}

function spawnPopup(x, y, text, color) {
  game.popups.push({ x, y, text, color, life: 0.65 });
}

function spawnParticleBurst(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 45 + Math.random() * 110;
    const life = 0.45 + Math.random() * 0.35;
    game.particles.push({
      x, y, color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      life, maxLife: life,
      size: 1.5 + Math.random() * 2,
    });
  }
}

function spawnStunSparks(x, y) {
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
    const speed = 90 + Math.random() * 70;
    const life = 0.28 + Math.random() * 0.12;
    game.particles.push({
      x, y, color: '#ffe066',
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life, maxLife: life,
      size: 1.5 + Math.random() * 1.5,
    });
  }
}

function spawnSlowFlakes(x, y) {
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
    const speed = 25 + Math.random() * 40;
    const life = 0.55 + Math.random() * 0.3;
    game.particles.push({
      x, y, color: '#9bd9ff',
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life, maxLife: life,
      size: 2 + Math.random() * 1.5,
    });
  }
}

function spawnRing(x, y, maxRadius, color, life = 0.45, width = 3) {
  game.rings.push({ x, y, radius: 0, maxRadius, color, life, maxLife: life, width });
}

function spawnCoin(x, y) {
  game.particles.push({
    x, y, color: '#ffd166', glyph: '🪙',
    vx: (Math.random() - 0.5) * 30,
    vy: -80,
    life: 0.8, maxLife: 0.8,
    size: 14,
  });
}

function triggerShake(intensity, time) {
  if (game.shake.intensity * (game.shake.time || 0) < intensity * time) {
    game.shake.intensity = intensity;
    game.shake.time = time;
  }
}

/* === Rendering === */
function drawGrid(ctx) {
  ctx.fillStyle = '#2f4a3a';
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);

  if (game.coop.enabled) {
    // Draw divider for coop
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(BOARD_W / 2, 0);
    ctx.lineTo(BOARD_W / 2, BOARD_H);
    ctx.stroke();
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      }
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * TILE + 0.5, 0);
    ctx.lineTo(c * TILE + 0.5, BOARD_H);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * TILE + 0.5);
    ctx.lineTo(BOARD_W, r * TILE + 0.5);
    ctx.stroke();
  }
}

function drawPath(ctx) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = TILE * 0.6;
  ctx.strokeStyle = '#7d6a48';
  ctx.beginPath();
  for (let i = 0; i < WAYPOINTS.length; i++) {
    const p = cellCenter(WAYPOINTS[i].col, WAYPOINTS[i].row);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.lineWidth = TILE * 0.5;
  ctx.strokeStyle = '#d9c79a';
  ctx.beginPath();
  for (let i = 0; i < WAYPOINTS.length; i++) {
    const p = cellCenter(WAYPOINTS[i].col, WAYPOINTS[i].row);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // Spawn and exit arrows
  const start = cellCenter(WAYPOINTS[0].col, WAYPOINTS[0].row);
  const end   = cellCenter(WAYPOINTS.at(-1).col, WAYPOINTS.at(-1).row);
  ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
  ctx.beginPath();
  ctx.moveTo(start.x + 24, start.y - 10);
  ctx.lineTo(start.x + 24, start.y + 10);
  ctx.lineTo(start.x + 40, start.y);
  ctx.fill();
  ctx.fillStyle = 'rgba(100, 220, 120, 0.6)';
  ctx.beginPath();
  ctx.arc(end.x - 30, end.y, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawRangeIndicator(ctx, u) {
  const d = UNITS[u.id];
  const c = (u === game.draggingUnit)
    ? { x: game.dragX, y: game.dragY }
    : cellCenter(u.col, u.row);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillStyle   = 'rgba(255, 209, 102, 0.07)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(c.x, c.y, d.range * TILE, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif';

function drawCharacter(ctx, unitId, x, y, size, t, flash, stackCount) {
  const d = UNITS[unitId];
  const fam = FAMILIES[d.family];
  const rarity = d.rarity;

  ctx.save();
  ctx.translate(x, y);

  const scaleY = 1 + Math.sin(t * 8) * 0.05;
  const scaleX = 1 - Math.sin(t * 8) * 0.05;
  ctx.scale(scaleX, scaleY);

  const bodyColor = fam.color;
  const skinColor = '#ffdbac';
  const eyeColor  = '#1c2436';
  const eyeSize   = size / 12;

  if (d.family === 'frost') {
    // --- Wizard (Humanoid with Robes and Pointed Hat) ---
    // Robe (torso replacement)
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.35, size * 0.35);
    ctx.lineTo(0, -size * 0.2);
    ctx.lineTo(size * 0.35, size * 0.35);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath(); ctx.arc(0, -size * 0.35, size * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Pointed Hat
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, -size * 0.45);
    ctx.lineTo(0, -size * 0.85);
    ctx.lineTo(size * 0.4, -size * 0.45);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Eyes
    ctx.fillStyle = eyeColor;
    ctx.beginPath(); ctx.arc(-size * 0.08, -size * 0.35, eyeSize, 0, Math.PI * 2); ctx.arc(size * 0.08, -size * 0.35, eyeSize, 0, Math.PI * 2); ctx.fill();
  } else if (d.family === 'burn') {
    // --- Robot (Boxy bodies and antennas) ---
    ctx.fillStyle = '#777';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    // Boxy body
    ctx.beginPath(); ctx.rect(-size * 0.35, -size * 0.2, size * 0.7, size * 0.5); ctx.fill(); ctx.stroke();
    // Boxy head
    ctx.beginPath(); ctx.rect(-size * 0.25, -size * 0.55, size * 0.5, size * 0.3); ctx.fill(); ctx.stroke();
    // Antenna
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -size * 0.55); ctx.lineTo(0, -size * 0.75); ctx.stroke();
    ctx.fillStyle = bodyColor; ctx.beginPath(); ctx.arc(0, -size * 0.75, 4, 0, Math.PI * 2); ctx.fill();
    // Glowing Visor
    ctx.fillStyle = '#0ff';
    ctx.fillRect(-size * 0.18, -size * 0.48, size * 0.36, size * 0.08);
  } else if (d.family === 'sniper') {
    // --- Archer (Humanoid with Hood and Cape) ---
    ctx.fillStyle = bodyColor;
    // Cape
    ctx.beginPath(); ctx.moveTo(-size * 0.4, -size * 0.2); ctx.lineTo(-size * 0.5, size * 0.4); ctx.lineTo(size * 0.5, size * 0.4); ctx.lineTo(size * 0.4, -size * 0.2); ctx.fill();
    // Torso
    ctx.fillStyle = '#444'; ctx.beginPath(); ctx.rect(-size * 0.25, -size * 0.2, size * 0.5, size * 0.5); ctx.fill();
    // Head
    ctx.fillStyle = skinColor; ctx.beginPath(); ctx.arc(0, -size * 0.4, size * 0.25, 0, Math.PI * 2); ctx.fill();
    // Hood
    ctx.fillStyle = bodyColor;
    ctx.beginPath(); ctx.arc(0, -size * 0.42, size * 0.28, Math.PI, 0, true);
    ctx.lineTo(size * 0.28, -size * 0.2); ctx.lineTo(-size * 0.28, -size * 0.2); ctx.closePath(); ctx.fill();
    // Eyes
    ctx.fillStyle = eyeColor; ctx.beginPath(); ctx.arc(-size * 0.08, -size * 0.4, eyeSize, 0, Math.PI * 2); ctx.arc(size * 0.08, -size * 0.4, eyeSize, 0, Math.PI * 2); ctx.fill();
  } else if (d.family === 'bruiser') {
    // --- Animal (Bulky shapes, ears) ---
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    // Bulky body
    ctx.beginPath(); ctx.ellipse(0, 0, size * 0.45, size * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Bulky head
    ctx.beginPath(); ctx.arc(0, -size * 0.35, size * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Ears
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, -size * 0.55); ctx.lineTo(-size * 0.15, -size * 0.75); ctx.lineTo(-size * 0.05, -size * 0.55);
    ctx.moveTo(size * 0.25, -size * 0.55); ctx.lineTo(size * 0.15, -size * 0.75); ctx.lineTo(size * 0.05, -size * 0.55);
    ctx.fill(); ctx.stroke();
    // Eyes
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-size * 0.1, -size * 0.35, eyeSize * 1.5, 0, Math.PI * 2); ctx.arc(size * 0.1, -size * 0.35, eyeSize * 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (d.family === 'arcane') {
    // --- Bird (Avian features, wings) ---
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    // Body (egg shape)
    ctx.beginPath(); ctx.ellipse(0, 0, size * 0.35, size * 0.45, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Wings
    ctx.beginPath(); ctx.ellipse(-size * 0.4, -size * 0.05, size * 0.2, size * 0.3, Math.PI / 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(size * 0.4, -size * 0.05, size * 0.2, size * 0.3, -Math.PI / 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Head
    ctx.beginPath(); ctx.arc(0, -size * 0.4, size * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Beak
    ctx.fillStyle = '#ff8a3a';
    ctx.beginPath(); ctx.moveTo(0, -size * 0.35); ctx.lineTo(size * 0.2, -size * 0.3); ctx.lineTo(0, -size * 0.25); ctx.closePath(); ctx.fill();
  } else {
    // --- Base Humanoid ---
    // Arms (drawn behind torso)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = 'round';
    // Left arm
    ctx.beginPath(); ctx.moveTo(-size * 0.25, -size * 0.1); ctx.lineTo(-size * 0.45, size * 0.15); ctx.stroke();
    // Right arm
    ctx.beginPath(); ctx.moveTo(size * 0.25, -size * 0.1); ctx.lineTo(size * 0.45, size * 0.15); ctx.stroke();

    // Torso
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-size * 0.3, -size * 0.2, size * 0.6, size * 0.55, size * 0.15);
    } else {
      ctx.rect(-size * 0.3, -size * 0.2, size * 0.6, size * 0.55);
    }
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, -size * 0.45, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hair/Hat (family-colored base)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, -size * 0.45, size * 0.28, Math.PI, 0);
    ctx.fill();

    // Eyes
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.45, eyeSize, 0, Math.PI * 2);
    ctx.arc(size * 0.1, -size * 0.45, eyeSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Family-specific Equipment
  if (d.family === 'frost') {
    if (d.id === 'frost_c' || d.id === 'frost_r') { // Ice tosser/Engineer
      ctx.fillStyle = '#add8e6';
      ctx.fillRect(size * 0.35, -size * 0.1, size * 0.25, size * 0.25); // Ice block in hand
    } else if (d.id === 'frost_e' || d.id === 'frost_l') { // Cryomancer/Glacier Sage
      ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(size * 0.4, size * 0.2); ctx.lineTo(size * 0.4, -size * 0.5); ctx.stroke(); // Staff
      ctx.fillStyle = '#add8e6';
      ctx.beginPath(); ctx.arc(size * 0.4, -size * 0.5, size * 0.12, 0, Math.PI * 2); ctx.fill(); // Crystal
    } else if (d.id === 'frost_m') { // Blizzard King
      ctx.fillStyle = '#ff0';
      ctx.beginPath(); // Crown
      ctx.moveTo(-size * 0.2, -size * 0.7); ctx.lineTo(-size * 0.1, -size * 0.6);
      ctx.lineTo(0, -size * 0.75); ctx.lineTo(size * 0.1, -size * 0.6);
      ctx.lineTo(size * 0.2, -size * 0.7); ctx.lineTo(size * 0.2, -size * 0.5);
      ctx.lineTo(-size * 0.2, -size * 0.5); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Swirling snow particles
      for (let i = 0; i < 3; i++) {
        const angle = t * 10 + i * Math.PI * 0.66;
        const sx = Math.cos(angle) * size * 0.5;
        const sy = Math.sin(angle) * size * 0.2 - size * 0.4;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (d.family === 'burn') {
    if (d.id === 'burn_c' || d.id === 'burn_r') { // Torch Bearer/Hot-fixer
      ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(size * 0.4, 0); ctx.lineTo(size * 0.4, -size * 0.3); ctx.stroke(); // Torch stick
      ctx.fillStyle = '#f00';
      ctx.beginPath(); ctx.arc(size * 0.4, -size * 0.35, size * 0.1, 0, Math.PI * 2); ctx.fill(); // Flame
    } else if (d.id === 'burn_e' || d.id === 'burn_l') { // Firefighter/Wildfire
      ctx.fillStyle = '#ff0'; // Yellow helmet
      ctx.beginPath(); ctx.arc(0, -size * 0.6, size * 0.3, Math.PI, 0); ctx.fill(); ctx.stroke();
    } else if (d.id === 'burn_m') { // Inferno Lord
      ctx.fillStyle = '#555';
      ctx.fillRect(-size * 0.4, -size * 0.1, size * 0.3, size * 0.4); // Backpack tank
      ctx.fillStyle = '#333';
      ctx.fillRect(size * 0.3, -size * 0.1, size * 0.5, size * 0.15); // Nozzle
      if (t % 0.4 < 0.2) {
        ctx.fillStyle = '#ff7e3a';
        ctx.beginPath(); ctx.arc(size * 0.8, -size * 0.02, size * 0.1, 0, Math.PI * 2); ctx.fill();
      }
    } else if (d.id === 'vulcan') { // Vulcan
      // Magma core body
      ctx.fillStyle = '#222';
      ctx.fillRect(-size * 0.5, -size * 0.2, size, size * 0.6); // Blocky armor
      // Glowing magma cracks
      ctx.strokeStyle = '#ff4500';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-size * 0.3, 0); ctx.lineTo(-size * 0.1, size * 0.2); ctx.lineTo(size * 0.2, -size * 0.1); ctx.lineTo(size * 0.4, size * 0.1);
      ctx.stroke();
      if (t % 0.6 < 0.3) {
        ctx.fillStyle = '#ff8a3a';
        ctx.beginPath(); ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2); ctx.fill(); // Core pulse
      }
    }
  } else if (d.family === 'sniper') {
    if (d.id === 'sniper_c' || d.id === 'sniper_r') { // Bowman/Marksman
      ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(size * 0.3, 0, size * 0.4, -Math.PI / 2, Math.PI / 2); ctx.stroke(); // Bow
    } else if (d.id === 'sniper_e' || d.id === 'sniper_l') { // Sharpshooter/Eagle Eye
      ctx.fillStyle = '#333';
      ctx.fillRect(size * 0.2, -size * 0.1, size * 0.6, size * 0.18); // Rifle
    } else if (d.id === 'sniper_m') { // Elite Sniper
      ctx.fillStyle = '#333';
      ctx.fillRect(size * 0.2, -size * 0.1, size * 0.7, size * 0.2); // Advanced Rifle
      ctx.fillStyle = '#444';
      ctx.beginPath(); ctx.arc(0, -size * 0.6, size * 0.3, Math.PI, 0); ctx.fill(); // Tactical Helmet
    }
  } else if (d.family === 'bruiser') {
    if (d.id === 'bruis_c' || d.id === 'bruis_r') { // Squire/Warrior
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-size * 0.5, -size * 0.1, size * 0.25, size * 0.4); // Shield
    } else if (d.id === 'bruis_e' || d.id === 'bruis_l') { // Gladiator/Champion
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(size * 0.4, 0); ctx.lineTo(size * 0.4, -size * 0.4); ctx.stroke(); // Weapon
    } else if (d.id === 'bruis_m' || d.id === 'haley') { // Berserker/Immortal Haley
      ctx.fillStyle = bodyColor;
      ctx.beginPath(); ctx.arc(-size * 0.5, 0, size * 0.3, 0, Math.PI * 2); // Muscle L
      ctx.arc(size * 0.5, 0, size * 0.3, 0, Math.PI * 2); // Muscle R
      ctx.fill(); ctx.stroke();
    }
  } else if (d.family === 'arcane') {
    if (d.id === 'arc_c' || d.id === 'arc_r') { // Apprentice/Wizard
      ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(size * 0.4, 0); ctx.lineTo(size * 0.5, -size * 0.3); ctx.stroke(); // Wand
    } else if (d.id === 'arc_m' || d.id === 'ato') { // Storm Archon/Immortal Ato
      ctx.fillStyle = bodyColor;
      ctx.beginPath(); // Tall Hat
      ctx.moveTo(-size * 0.3, -size * 0.5); ctx.lineTo(0, -size * 0.9); ctx.lineTo(size * 0.3, -size * 0.5); ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Robe extensions
      ctx.fillRect(-size * 0.35, size * 0.1, size * 0.1, size * 0.3);
      ctx.fillRect(size * 0.25, size * 0.1, size * 0.1, size * 0.3);
    } else if (d.id === 'angel') { // Archangel
      // Wings
      const wingFlap = Math.sin(t * 10) * 0.2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-size * 0.4, -size * 0.2, size * 0.5, size * 0.2, -Math.PI / 4 + wingFlap, 0, Math.PI * 2);
      ctx.ellipse(size * 0.4, -size * 0.2, size * 0.5, size * 0.2, Math.PI / 4 - wingFlap, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Halo
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.8, size * 0.3, size * 0.1, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (flash > 0) {
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = (flash / 0.1) * 0.4;
    ctx.fill();
  }

  // Draw stack count for Level 1 units
  if (d.rarity === 'Common' && (stackCount || 1) > 1) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${size/3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x' + stackCount, size/3, size/3);
  }

  ctx.restore();
}

function drawUnitAt(ctx, u, x, y, ghost = false) {
  const d = UNITS[u.id];
  const color = RARITY_COLORS[d.rarity];
  const fam = FAMILIES[d.family] || { color: '#888' };
  const t = performance.now() / 1000;

  ctx.save();
  if (ghost) ctx.globalAlpha = 0.78;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 22, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base platform
  ctx.fillStyle = '#1c2436';
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();

  // Rarity ring
  ctx.strokeStyle = color;
  ctx.lineWidth = (d.rarity === 'Mythic' || d.rarity === 'Immortal') ? 4 : 3;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.stroke();

  if (d.rarity === 'Legendary') {
    // Pulsing glow
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.shadowBlur = 10 + pulse * 10;
    ctx.shadowColor = color;
    ctx.strokeStyle = `rgba(176, 107, 240, ${0.4 + pulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 30, t, t + Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (d.rarity === 'Mythic') {
    ctx.strokeStyle = 'rgba(244, 155, 58, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(x, y, 30, t, t + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotating orbs
    for (let i = 0; i < 3; i++) {
      const angle = t * 3 + (i / 3) * Math.PI * 2;
      const ox = x + Math.cos(angle) * 32;
      const oy = y + Math.sin(angle) * 32;
      ctx.fillStyle = '#f49b3a';
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();
      // small glow for orbs
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#f49b3a';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  } else if (d.rarity === 'Immortal') {
    // Rainbow glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsl(${(t * 100) % 360} 100% 50%)`;

    for (let i = 0; i < 6; i++) {
      const a0 = t * 2 + i * Math.PI / 3;
      const a1 = a0 + Math.PI / 5;
      ctx.strokeStyle = `hsl(${(t * 120 + i * 60) % 360} 90% 65%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 32, a0, a1);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // Draw the actual Chibi character
  const readyToLevel = isReadyToMerge(u);

  if (readyToLevel) {
    ctx.save();
    ctx.translate(x, y - 30);
    const starT = t * 5;
    ctx.scale(1 + Math.sin(starT) * 0.1, 1 + Math.sin(starT) * 0.1);
    ctx.fillStyle = '#ff0';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
      const angle2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.lineTo(Math.cos(angle2) * 4, Math.sin(angle2) * 4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const rarityScale = {
    Common: 0.7,
    Rare: 0.8,
    Epic: 0.9,
    Legendary: 1.0,
    Mythic: 1.15,
    Immortal: 1.3
  }[d.rarity] || 1.0;

  drawCharacter(ctx, u.id, x, y, 40 * rarityScale, t + (u.col * 0.1 + u.row * 0.1), u.flash, u.stackCount);
  // mana ring (arc) for units with an ability — full circle = ready.
  if (d.manaMax) {
    const frac = Math.min(1, (u.mana || 0) / d.manaMax);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = frac >= 1 ? '#ffffff' : '#6bd1ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 19, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  }
  // signature charge ring (outer arc) — every unit fills this every N attacks.
  {
    const sig = SIGNATURE[d.family];
    const cadence = SIGNATURE_CADENCE[d.rarity] || 8;
    if (sig) {
      const sfrac = Math.min(1, (u.atkCount || 0) / cadence);
      ctx.strokeStyle = sfrac >= 1 ? '#ffffff' : `${sig.color}66`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 23, -Math.PI / 2, -Math.PI / 2 + sfrac * Math.PI * 2);
      ctx.stroke();
    }
  }
  if (d.manaAura) {
    // Catalyst aura indicator — pulsing ring at the aura radius.
    const t = performance.now() / 700;
    const pulse = 0.5 + 0.5 * Math.sin(t);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 + 0.18 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, d.manaAura * TILE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // selection ring
  if (!ghost && u === game.selectedUnit) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.stroke();

    // Small merge button next to the unit if ready to level
    if (readyToLevel) {
      ctx.setLineDash([]);
      const bx = x + 35, by = y - 25, br = 14;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#20140a'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#20140a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⬆️', bx, by);
      u.mergeBtnRect = { x: bx - br, y: by - br, w: br * 2, h: br * 2 };
    } else {
      u.mergeBtnRect = null;
    }
  }
  ctx.restore();
}

function drawUnits(ctx) {
  const allUnits = [...game.units, ...(game.coop.enabled ? game.coop.partnerUnits : [])];
  for (const u of allUnits) {
    if (u === game.draggingUnit) continue;
    const c = cellCenter(u.col, u.row);
    drawUnitAt(ctx, u, c.x, c.y);
  }
  if (game.draggingUnit) {
    drawUnitAt(ctx, game.draggingUnit, game.dragX, game.dragY, true);
  }
}

function drawEnemies(ctx) {
  const t = performance.now() / 1000;
  for (const e of game.enemies) {
    if (e.dead || e.escaped) continue;
    const entryFrac = e.entryTimer > 0 ? (e.entryTimer / 0.9) : 0;
    const scale = 1 + entryFrac * 0.7;
    const sz = e.size * scale;

    ctx.save();
    ctx.translate(e.x, e.y);

    // Wobble animation
    const wobble = Math.sin(t * 10 + e.pathDist * 0.1) * 0.1;
    ctx.rotate(wobble);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, sz - 2, sz * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(0, 0, sz, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(-sz/3, -sz/3, sz/3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${Math.round(sz * 1.2)}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.glyph, 0, 1);

    ctx.restore();
    // HP bar
    const w = sz * 2.2;
    const hp = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = '#000';
    ctx.fillRect(e.x - w / 2 - 1, e.y - sz - 10, w + 2, 5);
    ctx.fillStyle = hp > 0.55 ? '#5fd870' : hp > 0.25 ? '#f5c542' : '#e15555';
    ctx.fillRect(e.x - w / 2, e.y - sz - 9, w * hp, 3);
    // statuses
    let slot = -1;
    if (e.stunTimer > 0) drawStatusIcon(ctx, e, '⚡', '#ffe066', slot++);
    if (e.freezeTimer > 0) drawStatusIcon(ctx, e, '🧊', '#9bd9ff', slot++);
    if (e.slowAmount > 0 && e.freezeTimer <= 0) drawStatusIcon(ctx, e, '❄', '#9bd9ff', slot++);
    if (e.burnTimer > 0) drawStatusIcon(ctx, e, '🔥', '#ff8a3a', slot++);
    if (e.defDownAmount > 0) drawStatusIcon(ctx, e, '🛡', '#ff9090', slot++);
  }
}

function drawStatusIcon(ctx, e, icon, color, slot) {
  ctx.font = `12px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(icon, e.x - 14 + slot * 14, e.y - e.size - 14);
}

function drawBeams(ctx) {
  for (const b of game.beams) {
    const alpha = Math.max(0, Math.min(1, b.life / 0.2));
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = b.width || 2;

    // Add some glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;

    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

function drawRings(ctx) {
  for (const r of game.rings) {
    const alpha = Math.max(0, r.life / r.maxLife);
    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.width;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawParticles(ctx) {
  for (const p of game.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    if (p.glyph) {
      ctx.font = `${p.size}px ${EMOJI_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.glyph, p.x, p.y);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawPopups(ctx) {
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px system-ui, sans-serif';
  for (const p of game.popups) {
    const alpha = Math.max(0, Math.min(1, p.life / 0.65));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.fillText(p.text, p.x + 1, p.y + 1);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
}

function drawHoverCell(ctx) {
  if (!game.draggingUnit) return;
  const col = Math.floor(game.dragX / TILE);
  const row = Math.floor(game.dragY / TILE);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  const onPath = PATH_CELLS.has(`${col},${row}`);
  const occupant = !onPath && game.units.find(x => x !== game.draggingUnit && x.col === col && x.row === row);
  let fill, stroke;
  if (onPath)        { fill = 'rgba(220, 80, 80, 0.18)';  stroke = 'rgba(220, 80, 80, 0.8)'; }
  else if (occupant) { fill = 'rgba(120, 180, 240, 0.22)'; stroke = 'rgba(120, 180, 240, 0.9)'; }
  else               { fill = 'rgba(120, 220, 120, 0.18)'; stroke = 'rgba(120, 220, 120, 0.8)'; }
  ctx.fillStyle = fill;
  ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(col * TILE + 1, row * TILE + 1, TILE - 2, TILE - 2);
}

function draw() {
  const ctx = game.ctx;
  ctx.clearRect(0, 0, BOARD_W, BOARD_H);
  let ox = 0, oy = 0;
  if (game.shake.time > 0) {
    const f = Math.min(1, game.shake.time / 0.3);
    ox = (Math.random() - 0.5) * game.shake.intensity * f;
    oy = (Math.random() - 0.5) * game.shake.intensity * f;
  }
  ctx.save();
  if (ox || oy) ctx.translate(ox, oy);
  drawGrid(ctx);
  drawPath(ctx);
  drawHoverCell(ctx);
  if (game.selectedUnit) drawRangeIndicator(ctx, game.selectedUnit);
  drawUnits(ctx);
  drawEnemies(ctx);
  drawBeams(ctx);
  drawRings(ctx);
  drawParticles(ctx);
  drawPopups(ctx);
  ctx.restore();
}

/* === Game loop === */
function gameLoop(timestamp) {
  const raw = (timestamp - game.lastTime) / 1000;
  const dt = Math.min(0.05, raw) * game.speed;
  game.lastTime = timestamp;

  if (game.view === 'game' && !game.gameOver) {
    if (game.waveRunning) updateWaveSpawning(dt);
    updateEnemies(dt);
    updateUnits(dt);
    updateAI(dt);
    if (game.waveRunning) checkWaveComplete();
    if (!game.waveRunning && game.nextWaveDelay !== null) {
      game.nextWaveDelay -= dt;
      if (game.nextWaveDelay <= 0) {
        game.nextWaveDelay = null;
        startWave();
      }
    }
    updateGolem(dt);
    updateDungeon(dt);
    if (game.gold >= 2500) checkHoard();
    if (game.stones >= 30) unlock('stoneHoard');
    updateEffects(dt);
    // Refresh UI numbers (gold ticks from kills); cheap enough each frame.
    ui.gold.textContent = Math.floor(game.gold);
    ui.stones.textContent = game.stones;
    ui.hp.textContent = game.hp;
  }
  if (game.view === 'game') draw();
  requestAnimationFrame(gameLoop);
}

/* === Input (mouse + touch) === */
function eventClient(ev) {
  if (ev.touches && ev.touches.length) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
  if (ev.changedTouches && ev.changedTouches.length) return { x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY };
  return { x: ev.clientX, y: ev.clientY };
}

function canvasCoords(ev) {
  const p = eventClient(ev);
  const r = game.canvas.getBoundingClientRect();
  const sx = game.canvas.width  / r.width;
  const sy = game.canvas.height / r.height;
  return { x: (p.x - r.left) * sx, y: (p.y - r.top) * sy };
}

function findUnitAt(x, y, radius = 32) {
  let best = null, bestDist = Infinity;
  for (const u of game.units) {
    const c = cellCenter(u.col, u.row);
    const d = Math.hypot(x - c.x, y - c.y);
    if (d <= radius && d < bestDist) { bestDist = d; best = u; }
  }
  return best;
}

function isReadyToMerge(u) {
  if (!u) return false;
  const d = UNITS[u.id];

  // 1. Standard 3-of-a-kind merge
  if (MERGE_RECIPES[u.id]) {
    const allOfSameType = game.units.filter(x => x.id === u.id);
    const totalCount = allOfSameType.reduce((s, x) => s + (x.stackCount || 1), 0);
    if (totalCount >= 3) return true;
  }

  // 2. Mythic / Immortal recipes
  const combinedRecipes = { ...MYTHIC_RECIPES, ...IMMORTAL_RECIPES };
  for (const rid in combinedRecipes) {
    const r = combinedRecipes[rid];
    if (r.ingredients.includes(u.id)) {
      const currentUnits = [...game.units];
      let possible = true;
      for (const ingId of r.ingredients) {
        const idx = currentUnits.findIndex(x => x.id === ingId);
        if (idx >= 0) {
          currentUnits.splice(idx, 1);
        } else {
          possible = false;
          break;
        }
      }
      if (possible && game.stones >= r.stones) return true;
    }
  }

  return false;
}

function onMouseDown(ev) {
  const p = canvasCoords(ev);

  // Check if click is on a selected unit's merge button
  if (game.selectedUnit && game.selectedUnit.mergeBtnRect) {
    const r = game.selectedUnit.mergeBtnRect;
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
      mergeSelected();
      return;
    }
  }

  const u = findUnitAt(p.x, p.y);
  if (u) {
    game.selectedUnit = u;
    game.draggingUnit = u;
    game.dragX = p.x; game.dragY = p.y;
  } else {
    game.selectedUnit = null;
    game.draggingUnit = null;
  }
  updateUI();
}

function onMouseMove(ev) {
  if (!game.draggingUnit) return;
  const p = canvasCoords(ev);
  game.dragX = p.x; game.dragY = p.y;
}

function onMouseUp(ev) {
  if (!game.draggingUnit) return;
  const u = game.draggingUnit;
  const p = canvasCoords(ev);
  const col = Math.floor(p.x / TILE);
  const row = Math.floor(p.y / TILE);
  const inside = col >= 0 && col < COLS && row >= 0 && row < ROWS;
  const onPath = inside && PATH_CELLS.has(`${col},${row}`);
  if (inside && !onPath) {
    const other = game.units.find(x => x !== u && x.col === col && x.row === row);
    if (other) {
      const d = UNITS[u.id];
      if (d.rarity === 'Common' && other.id === u.id && (other.stackCount || 1) < 3) {
        // Merge stack
        const total = (u.stackCount || 1) + (other.stackCount || 1);
        if (total <= 3) {
          other.stackCount = total;
          game.units.splice(game.units.indexOf(u), 1);
          log(`Merged stack ${d.name} (x${other.stackCount})`, 'common');
        } else {
          // Keep what fits in other, remainder in u?
          // For simplicity, just swap if it doesn't fit perfectly or would exceed 3.
          const oldCol = u.col, oldRow = u.row;
          u.col = col;       u.row = row;
          other.col = oldCol; other.row = oldRow;
        }
      } else {
        // Swap positions with the occupant.
        const oldCol = u.col, oldRow = u.row;
        u.col = col;       u.row = row;
        other.col = oldCol; other.row = oldRow;
      }
    } else {
      u.col = col;
      u.row = row;
    }
  }
  game.draggingUnit = null;
  updateUI();
}

/* === UI === */
function toggleSpeed() {
  game.speed = game.speed === 1 ? 2 : game.speed === 2 ? 3 : 1;
  ui.speedBtn.textContent = `${game.speed}×`;
}

function setupUI() {
  ui.canvas       = document.getElementById('board');
  game.canvas     = ui.canvas;
  game.ctx        = ui.canvas.getContext('2d');
  ui.wave         = document.getElementById('wave-display');
  ui.gold         = document.getElementById('gold-display');
  ui.stones       = document.getElementById('stones-display');
  ui.hp           = document.getElementById('hp-display');
  ui.summonCost   = document.getElementById('summon-cost');
  ui.summonBtn    = document.getElementById('summon-btn');
  ui.rouletteBtn  = document.getElementById('roulette-btn');
  ui.upgCommon    = document.getElementById('upg-common');
  ui.upgEpic      = document.getElementById('upg-epic');
  ui.upgMythic    = document.getElementById('upg-mythic');
  ui.upgCommonCost= document.getElementById('upg-common-cost');
  ui.upgEpicCost  = document.getElementById('upg-epic-cost');
  ui.upgMythicCost= document.getElementById('upg-mythic-cost');
  ui.speedBtn     = document.getElementById('speed-btn');
  ui.unitInfo     = document.getElementById('unit-info-body');
  ui.unitActions  = document.getElementById('unit-actions');
  ui.sellBtn      = document.getElementById('sell-btn');
  ui.mergeBtn     = document.getElementById('merge-btn');
  ui.missionList  = document.getElementById('mission-list');
  ui.missionsToggle = document.getElementById('missions-toggle');
  ui.missionsPopup  = document.getElementById('missions-popup');
  ui.missionsClose  = document.getElementById('missions-close');
  ui.missionsCount  = document.getElementById('missions-count');
  ui.recipesToggle  = document.getElementById('recipes-toggle');
  ui.recipesPopup   = document.getElementById('recipes-popup');
  ui.recipesClose   = document.getElementById('recipes-close');
  ui.recipesBody    = document.getElementById('recipes-body');
  ui.dungeonToggle  = document.getElementById('dungeon-toggle');
  ui.dungeonPopup   = document.getElementById('dungeon-popup');
  ui.dungeonClose   = document.getElementById('dungeon-close');
  ui.dungeonBody    = document.getElementById('dungeon-body');
  ui.dungeonChip    = document.getElementById('dungeon-count');
  ui.artifactsToggle = document.getElementById('artifacts-toggle');
  ui.artifactsPopup  = document.getElementById('artifacts-popup');
  ui.artifactsClose  = document.getElementById('artifacts-close');
  ui.artifactsBody   = document.getElementById('artifacts-body');
  ui.dungeonBtn     = document.getElementById('dungeon-btn');
  ui.menuBtn        = document.getElementById('menu-btn');
  ui.endMenu        = document.getElementById('end-menu');
  ui.inspectorSheet = document.getElementById('inspector-sheet');
  ui.inspectorClose = document.getElementById('inspector-close');
  ui.sheetBackdrop  = document.getElementById('sheet-backdrop');
  ui.logList      = document.getElementById('log-list');
  ui.gameOver     = document.getElementById('game-over');
  ui.endTitle     = document.getElementById('end-title');
  ui.endText      = document.getElementById('end-text');
  ui.restart      = document.getElementById('restart');
  ui.waveBanner   = document.getElementById('wave-banner');

  ui.legendaryBtn       = document.getElementById('legendary-btn');
  ui.legendaryCost      = document.getElementById('legendary-cost');
  ui.rouletteCost       = document.getElementById('roulette-cost');

  // Animation for buttons
  const buttons = [ui.summonBtn, ui.rouletteBtn, ui.legendaryBtn, ui.upgCommon, ui.upgEpic, ui.upgMythic];
  buttons.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
    btn.addEventListener('mouseup', () => btn.style.transform = '');
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
  });

  ui.summonBtn.addEventListener('click', summon);
  ui.rouletteBtn.addEventListener('click', rouletteEpic);
  ui.legendaryBtn.addEventListener('click', rouletteLegendary);
  ui.upgCommon.addEventListener('click', () => upgrade('Common'));
  ui.upgEpic.addEventListener('click',   () => upgrade('Epic'));
  ui.upgMythic.addEventListener('click', () => upgrade('Mythic'));
  ui.speedBtn.addEventListener('click', toggleSpeed);
  ui.sellBtn.addEventListener('click', sellSelected);
  ui.mergeBtn.addEventListener('click', mergeSelected);
  ui.dungeonBtn.addEventListener('click', (e) => { e.stopPropagation(); sendToDungeon(); });
  ui.restart.addEventListener('click', restart);

  const POPUP_KEYS = ['missions', 'dungeon', 'artifacts'];
  for (const key of POPUP_KEYS) {
    ui[`${key}Toggle`].addEventListener('click', () => togglePopup(key));
    ui[`${key}Close`].addEventListener('click', () => setPopup(key, false));
  }
  ui.menuBtn.addEventListener('click', backToMenu);
  ui.endMenu.addEventListener('click', backToMenu);
  ui.inspectorClose.addEventListener('click', () => {
    game.selectedUnit = null;
    renderUnitInfo();
  });
  ui.sheetBackdrop.addEventListener('click', () => {
    closeAllPopups();
    if (game.selectedUnit) { game.selectedUnit = null; renderUnitInfo(); }
  });

  ui.canvas.addEventListener('mousedown', onMouseDown);
  ui.canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  ui.canvas.addEventListener('touchstart', onMouseDown, { passive: true });
  ui.canvas.addEventListener('touchmove', (e) => { if (game.draggingUnit) e.preventDefault(); onMouseMove(e); }, { passive: false });
  window.addEventListener('touchend',    onMouseUp);

  ui.coopToggle = document.getElementById('coop-mode-toggle');
  ui.coopToggle.addEventListener('change', (e) => {
    game.coop.enabled = e.target.checked;
    saveProgress();
  });
  window.addEventListener('touchcancel', onMouseUp);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 's' || e.key === 'S') summon();
    else if (e.key === 'r' || e.key === 'R') rouletteEpic();
    else if (e.key === 'l' || e.key === 'L') rouletteLegendary();
    else if (e.key === 'm' || e.key === 'M') mergeSelected();
    else if (e.key === 'x' || e.key === 'X') sellSelected();
    else if (e.key === '1' || e.key === '2' || e.key === '3') {
      game.speed = parseInt(e.key, 10);
      ui.speedBtn.textContent = `${game.speed}×`;
    }
  });
}

function updateUI() {
  ui.wave.textContent = game.wave;
  ui.gold.textContent = Math.floor(game.gold);
  ui.stones.textContent = game.stones;
  ui.hp.textContent = game.hp;
  ui.summonCost.textContent = game.summonCost;
  ui.upgCommonCost.textContent = upgradeCostFor('Common');
  ui.upgEpicCost.textContent   = upgradeCostFor('Epic');
  ui.upgMythicCost.textContent = upgradeCostFor('Mythic');
  ui.summonBtn.disabled   = game.gold < game.summonCost || game.gameOver;
  if (ui.rouletteCost) ui.rouletteCost.textContent = EPIC_ROULETTE_COST;
  ui.rouletteBtn.disabled = game.stones < EPIC_ROULETTE_COST || game.gameOver;
  if (ui.legendaryBtn) {
    ui.legendaryCost.textContent = LEGENDARY_ROULETTE_COST;
    ui.legendaryBtn.disabled = game.gameOver || game.stones < LEGENDARY_ROULETTE_COST;
  }
  ui.upgCommon.disabled   = game.gold < upgradeCostFor('Common') || game.gameOver;
  ui.upgEpic.disabled     = game.gold < upgradeCostFor('Epic')   || game.gameOver;
  ui.upgMythic.disabled   = game.gold < upgradeCostFor('Mythic') || game.gameOver;
  if (ui.artifactsPopup && ui.artifactsPopup.classList.contains('open')) renderArtifacts();
  renderUnitInfo();
}

function renderUnitInfo() {
  const u = game.selectedUnit;
  if (!u) {
    ui.unitInfo.innerHTML = '';
    ui.unitActions.hidden = true;
    if (ui.inspectorSheet) {
      ui.inspectorSheet.classList.remove('open');
      updateBackdrop();
    }
    return;
  }
  if (ui.inspectorSheet && !ui.inspectorSheet.classList.contains('open')) {
    // Opening the inspector closes any other open sheet.
    for (const k of ['missions', 'dungeon', 'artifacts']) {
      ui[`${k}Popup`].classList.remove('open');
      ui[`${k}Toggle`]?.classList.remove('active');
      ui[`${k}Toggle`]?.setAttribute('aria-expanded', 'false');
    }
    ui.inspectorSheet.classList.add('open');
    updateBackdrop();
  }
  const d = UNITS[u.id];
  const dmg = unitDamage(u);
  const dps = dmg * d.aps;
  const fam = FAMILIES[d.family];
  const abilityText = ABILITY_DESCRIPTIONS[d.ability] || '';
  const sig = SIGNATURE[d.family];
  const sigCadence = SIGNATURE_CADENCE[d.rarity] || 8;
  const sigText = sig ? `${sig.name} — ${sig.desc(d.rarity)} (every ${sigCadence} attacks)` : '';
  // Show recipe if available
  let recipeHtml = '';
  const combinedRecipes = { ...MYTHIC_RECIPES, ...IMMORTAL_RECIPES };
  for (const rid in combinedRecipes) {
    const r = combinedRecipes[rid];
    if (r.ingredients.includes(u.id)) {
      const ings = r.ingredients.map(ingId => {
        const ing = UNITS[ingId];
        const has = game.units.some(x => x.id === ingId);
        return `<span style="color: ${has ? '#fff' : '#888'}; text-decoration: ${has ? 'none' : 'line-through'}">${ing.glyph} ${ing.name}</span>`;
      }).join(' + ');
      recipeHtml = `<div class="recipe-hint"><b>Recipe for ${UNITS[r.result].name}:</b><br>${ings} + ${r.stones}🔷</div>`;
      break;
    }
  }

  ui.unitInfo.innerHTML = `
    <div class="unit-card">
      <div class="glyph" style="border-color: ${RARITY_COLORS[d.rarity]}">${d.glyph}</div>
      <div class="meta">
        <div class="name">${d.name}</div>
        <div class="rarity" style="color: ${RARITY_COLORS[d.rarity]}">${d.rarity}${fam ? ` · <span style="color:${fam.color}">${fam.name}</span>` : ''}</div>
      </div>
    </div>
    <table>
      <tr><td class="k">Damage</td><td class="v">${dmg.toFixed(1)} ${d.type}</td></tr>
      <tr><td class="k">Attacks/s</td><td class="v">${d.aps.toFixed(1)}</td></tr>
      <tr><td class="k">DPS</td><td class="v">${dps.toFixed(1)}</td></tr>
      <tr><td class="k">Range</td><td class="v">${d.range.toFixed(1)} tiles</td></tr>
      ${d.aoe          ? `<tr><td class="k">AoE radius</td><td class="v">${d.aoe.toFixed(1)} tiles</td></tr>` : ''}
      ${d.stun         ? `<tr><td class="k">Stun</td><td class="v">${(d.stun.chance*100).toFixed(0)}% / ${d.stun.duration}s</td></tr>` : ''}
      ${d.slow         ? `<tr><td class="k">Slow</td><td class="v">${(d.slow.amount*100).toFixed(0)}% / ${d.slow.duration}s</td></tr>` : ''}
      ${d.freezeChance ? `<tr><td class="k">Freeze</td><td class="v">${(d.freezeChance*100).toFixed(0)}% / ${d.freezeDuration}s</td></tr>` : ''}
      ${d.burn         ? `<tr><td class="k">Burn DoT</td><td class="v">${d.burn.dps} dps / ${d.burn.duration}s</td></tr>` : ''}
      ${d.percentHP    ? `<tr><td class="k">% max HP</td><td class="v">+${(d.percentHP*100).toFixed(1)}%</td></tr>` : ''}
      ${d.defDown      ? `<tr><td class="k">DEF down</td><td class="v">-${(d.defDown.amount*100).toFixed(0)}% / ${d.defDown.duration}s</td></tr>` : ''}
      ${d.manaAura     ? `<tr><td class="k">Mana aura</td><td class="v">+1 mana / ally attack within ${d.manaAura} tiles</td></tr>` : ''}
      ${d.manaMax      ? `<tr><td class="k">Mana</td><td class="v">${u.mana || 0} / ${d.manaMax}</td></tr>` : ''}
      ${sigText        ? `<tr><td class="k">Special</td><td class="v">${sigText}</td></tr>` : ''}
      ${abilityText    ? `<tr><td class="k">Ability</td><td class="v">${abilityText}</td></tr>` : ''}
    </table>
    ${recipeHtml}
  `;
  ui.unitActions.hidden = false;
  ui.mergeBtn.hidden = !isReadyToMerge(u);
  ui.dungeonBtn.hidden = !dungeonRecruitable(u);
}

function renderMissions() {
  ui.missionList.innerHTML = game.missions.map(m => {
    const reward = m.reward.stones ? `+${m.reward.stones}🔷` : '';
    return `<li class="${m.done ? 'done' : ''}"><span>${m.text}</span><span class="reward">${reward}</span></li>`;
  }).join('');
  const open = game.missions.filter(m => !m.done).length;
  ui.missionsCount.textContent = open;
  ui.missionsCount.classList.toggle('empty', open === 0);
}

function isSheetOpen(el) { return !!el && el.classList.contains('open'); }

function updateBackdrop() {
  // Inspector sheet is intentionally excluded so the map remains tappable
  // while a unit is selected — the user can pick another unit or tap an
  // empty tile to deselect without first dismissing the sheet.
  const open = ['missionsPopup', 'dungeonPopup', 'artifactsPopup']
    .some(k => isSheetOpen(ui[k]));
  ui.sheetBackdrop.classList.toggle('open', open);
}

function setPopup(key, open) {
  const popup = ui[`${key}Popup`];
  const toggle = ui[`${key}Toggle`];
  if (!popup) return;
  if (open) {
    // Open this sheet exclusively. Inspector is driven by selection,
    // so opening any other sheet should clear the current selection.
    for (const k of ['missions', 'dungeon', 'artifacts']) {
      if (k !== key) ui[`${k}Popup`].classList.remove('open');
    }
    if (game.selectedUnit) {
      game.selectedUnit = null;
      renderUnitInfo();
    }
    if (key === 'artifacts') renderArtifacts();
    if (key === 'dungeon')   renderDungeon();
  }
  popup.classList.toggle('open', open);
  if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (toggle) toggle.classList.toggle('active', open);
  updateBackdrop();
}

function togglePopup(key) {
  setPopup(key, !isSheetOpen(ui[`${key}Popup`]));
}

function closeAllPopups() {
  for (const k of ['missions', 'dungeon', 'artifacts']) setPopup(k, false);
}

function renderFamilies() {
  const list = document.getElementById('welcome-families');
  if (!list) return;
  list.innerHTML = Object.values(FAMILIES).map(f => {
    const ladder = Object.values(UNITS)
      .filter(u => u.family === f.id && u.rarity !== 'Immortal')
      .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    const chips = ladder.map(u =>
      `<span class="fam-chip" style="border-color:${RARITY_COLORS[u.rarity]}" title="${u.name} (${u.rarity})">${u.glyph}</span>`
    ).join('');
    return `<li class="family-row">
      <div class="family-head">
        <span class="fam-name" style="color:${f.color}">${f.name}</span>
        <span class="fam-desc">${f.desc}</span>
      </div>
      <div class="family-ladder">${chips}</div>
    </li>`;
  }).join('');
}

function renderDungeon() {
  const boss = game.dungeon.boss;
  const totalDps = game.dungeon.units.reduce((s, u) => s + dungeonDps(u), 0);
  const unitsHtml = game.dungeon.units.length === 0
    ? `<p class="hint">No guardians assigned. Open the inspector for an eligible unit (Rare or higher) and tap <b>Send to Dungeon</b>.</p>`
    : `<ul class="dungeon-units">${game.dungeon.units.map((u, i) => {
        const d = UNITS[u.id];
        return `<li>
          <span class="glyph" style="border-color:${RARITY_COLORS[d.rarity]}">${d.glyph}</span>
          <span class="name">${d.name}</span>
          <span class="dps">${dungeonDps(u).toFixed(1)} dps</span>
          <button data-recall="${i}" class="recall-btn" type="button">Recall</button>
        </li>`;
      }).join('')}</ul>`;
  ui.dungeonBody.innerHTML = `
    <div class="dungeon-boss">
      <div class="boss-row">
        <span class="boss-glyph">🐉</span>
        <div class="boss-meta">
          <div class="boss-name">Bug Hydra · Tier ${boss.tier}</div>
          <div class="boss-hp-row"><span id="dungeon-hp-text">${Math.max(0, Math.ceil(boss.hp))} / ${Math.ceil(boss.maxHp)}</span></div>
        </div>
      </div>
      <div class="boss-hp-bar"><div id="dungeon-hp-fill" style="width:${Math.max(0, boss.hp / boss.maxHp) * 100}%"></div></div>
      <div class="dungeon-stats">
        <span>${totalDps.toFixed(1)} total DPS</span>
        <span>Cleared: ${game.dungeon.kills}</span>
      </div>
    </div>
    ${unitsHtml}
  `;
  ui.dungeonBody.querySelectorAll('[data-recall]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.recall, 10);
      const u = game.dungeon.units[i];
      if (u) recallFromDungeon(u);
    });
  });
  const open = game.dungeon.units.length;
  ui.dungeonChip.textContent = open;
  ui.dungeonChip.classList.toggle('empty', open === 0);
}

function renderDungeonStatus() {
  if (!ui.dungeonPopup.classList.contains('open')) return;
  const boss = game.dungeon.boss;
  const txt = document.getElementById('dungeon-hp-text');
  const fill = document.getElementById('dungeon-hp-fill');
  if (txt) txt.textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${Math.ceil(boss.maxHp)}`;
  if (fill) fill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
}

function renderArtifacts(targetId = 'artifacts-body') {
  const rows = ARTIFACT_ORDER.map(id => {
    const a = ARTIFACTS[id];
    const lvl = game.artifacts[id] || 0;
    const cost = a.upgradeCost(lvl);
    const maxed = lvl >= ARTIFACT_MAX_LEVEL;
    const effectNow  = lvl  > 0 ? a.effectAt(lvl, game.gold) : '—';
    const effectNext = maxed ? '' : a.effectAt(lvl + 1, game.gold);
    const canBuy = !maxed && (game.gems || 0) >= cost;
    const currencyIcon = '💎';
    return `<li class="artifact-row">
      <span class="glyph" style="border-color:${RARITY_COLORS.Legendary}">${a.glyph}</span>
      <div class="meta">
        <div class="name">${a.name} <span class="lvl">Lv ${lvl}${maxed ? ' · MAX' : ''}</span></div>
        <div class="desc">${a.desc}</div>
        <div class="effect">Now: <b>${effectNow}</b>${effectNext ? `   <span class="dim">→ ${effectNext}</span>` : ''}</div>
      </div>
      ${maxed
        ? '<button class="artifact-buy" disabled>Maxed</button>'
        : `<button class="artifact-buy" data-artifact="${id}" ${canBuy ? '' : 'disabled'}>+1 <span class="cost">${cost}${currencyIcon}</span></button>`}
    </li>`;
  }).join('');
  const container = document.getElementById(targetId);
  if (!container) return;
  container.innerHTML = `<ul class="artifact-list">${rows}</ul>
    <p class="hint">Artifacts persist across runs. Spend Gems to level them up.</p>`;
  container.querySelectorAll('[data-artifact]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); upgradeArtifact(btn.dataset.artifact); });
  });
}

function renderDifficulty() {
  const container = document.getElementById('welcome-difficulty');
  if (!container) return;
  const current = game.difficulty;
  container.innerHTML = DIFFICULTY_ORDER.map(id => {
    const d = DIFFICULTIES[id];
    const active = id === current;
    return `<button class="difficulty-card ${active ? 'active' : ''}" type="button" data-difficulty="${id}" style="--diff-color:${d.color}" ${active ? 'aria-pressed="true"' : ''}>
      <div class="diff-name">${d.name}${active ? ' · selected' : ''}</div>
      <div class="diff-desc">${d.desc}</div>
      <div class="diff-stats">HP ×${d.enemyHp.toFixed(1)} · Boss ×${d.bossHp.toFixed(1)} · Reward ×${d.reward.toFixed(2)} · Stun ×${d.stunMult.toFixed(1)}</div>
    </button>`;
  }).join('');
  container.querySelectorAll('[data-difficulty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.difficulty;
      if (id === game.difficulty) return;
      game.difficulty = id;
      saveProgress();
      renderDifficulty();
    });
  });
}

function renderMaps() {
  const container = document.getElementById('welcome-map');
  if (!container) return;
  const resuming = game.runActive && !game.gameOver;
  container.innerHTML = MAP_ORDER.map(id => {
    const m = MAPS[id];
    const active = id === game.mapId;
    const pathSet = computePathCells(m.waypoints);
    let cells = '';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        cells += `<span class="mp-cell ${pathSet.has(`${c},${r}`) ? 'path' : ''}"></span>`;
      }
    }
    return `<button class="map-card ${active ? 'active' : ''}" type="button" data-map="${id}" ${active ? 'aria-pressed="true"' : ''}>
      <div class="map-preview">${cells}</div>
      <div class="map-name">${m.name}${active ? ' · selected' : ''}</div>
      <div class="map-desc">${m.desc}</div>
    </button>`;
  }).join('') + (resuming ? '<p class="hint">Map change applies on your next new run; the resumed run keeps its current path.</p>' : '');
  container.querySelectorAll('[data-map]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.map;
      if (id === game.mapId) return;
      game.mapId = id;
      saveProgress();
      renderMaps();
    });
  });
}

function renderAchievements() {
  const container = document.getElementById('welcome-achievements');
  if (!container) return;
  const got = Object.keys(game.achievements).filter(k => game.achievements[k]).length;
  const total = ACHIEVEMENTS.length;
  const rows = ACHIEVEMENTS.map(a => {
    const done = !!game.achievements[a.id];
    return `<li class="${done ? 'done' : ''}">
      <span class="ach-mark">${done ? '✓' : '·'}</span>
      <div class="ach-meta">
        <div class="ach-title">${a.title}</div>
        <div class="ach-desc">${a.desc}</div>
      </div>
    </li>`;
  }).join('');
  container.innerHTML = `<ul class="ach-list">${rows}</ul>`;
  const ach = document.getElementById('welcome-ach');
  const sum = document.getElementById('welcome-ach-summary');
  if (ach) ach.textContent = `${got}/${total}`;
  if (sum) sum.textContent = `(${got}/${total})`;
}

function showBanner(text) {
  ui.waveBanner.textContent = text;
  ui.waveBanner.hidden = false;
  // force reflow then add show class so transition triggers
  void ui.waveBanner.offsetWidth;
  ui.waveBanner.classList.add('show');
  setTimeout(() => ui.waveBanner.classList.remove('show'), 1200);
  setTimeout(() => { ui.waveBanner.hidden = true; }, 1450);
}

function endGame(victory) {
  game.gameOver = true;
  game.runActive = false;
  game.victory = victory;
  closeAllPopups();
  if (game.selectedUnit) { game.selectedUnit = null; renderUnitInfo(); }
  ui.gameOver.hidden = false;
  ui.endTitle.textContent = victory ? 'Victory!' : 'Defeat';

  const earnedTokens = Math.floor(game.wave / 2);
  const earnedGems = Math.floor(game.wave / 4);
  game.tokens = (game.tokens || 0) + earnedTokens;
  game.gems = (game.gems || 0) + earnedGems;

  ui.endText.innerHTML = `
    ${victory ? `The codebase is secured. Wave ${game.wave} cleared.` : `The codebase is overrun on wave ${game.wave}.`}
    <div style="margin-top: 12px; font-weight: 700; color: #fff;">
      Rewards: <span style="color: #6bd1ff">${earnedGems} Gems</span>, <span style="color: #ffd166">${earnedTokens} Tokens</span>
    </div>
  `;

  if (victory) unlock('victory');
  saveProgress();
  updateUI();
}

function restart() {
  const bhLvl = game.artifacts.bh || 0;
  game.gold = STARTING_GOLD + bhLvl * 10;
  game.waveStartGold = game.gold;
  game.stones = Math.floor(bhLvl / 3);
  game.hp = STARTING_HP;
  game.wave = 1;
  game.summonCost = SUMMON_COST_START;
  game.units = [];
  game.enemies = [];
  game.beams = [];
  game.popups = [];
  game.spawnQueue = [];
  game.spawnTimer = 0;
  game.waveRunning = false;
  game.nextWaveDelay = WAVE_FIRST_DELAY;
  game.selectedUnit = null;
  game.draggingUnit = null;
  game.upgrades = { Common: 0, Epic: 0, Mythic: 0 };
  game.gameOver = false;
  game.victory = false;
  game.missions = makeMissions();
  game.coop.partnerUnits = [];
  game.coop.aiGold = 50;
  game.coop.summonTimer = 0;
  game.coop.mergeTimer = 0;
  game.golem = { cooldown: GOLEM_COOLDOWN, active: false, kills: 0 };
  game.dungeon = { units: [], boss: { hp: DUNGEON_BASE_HP, maxHp: DUNGEON_BASE_HP, tier: 1 }, kills: 0 };
  game.particles = [];
  game.rings = [];
  game.shake = { time: 0, intensity: 0 };
  game.waveEscapes = 0;
  game.runActive = true;
  game.epTriggered = false;
  // Commit the map chosen on the welcome screen for this run.
  setMap(game.mapId);
  // Artifacts, achievements, difficulty and cumulative stats persist across runs.
  ui.gameOver.hidden = true;
  ui.logList.innerHTML = '';
  const diff = DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
  log(`A new ${diff.name} run begins. Build your guardians wisely!`);
  if (game.artifacts.sb > 0 || game.artifacts.mg > 0) {
    log(`Artifacts active — Safe Box Lv ${game.artifacts.sb}, Money Gun Lv ${game.artifacts.mg}`, 'epic');
  }
  renderMissions();
  renderFamilies();
  renderDungeon();
  renderArtifacts();
  renderAchievements();
  updateUI();
}

/* === Bootstrap === */
/* === View system === */
function showView(name) {
  game.view = name;
  document.getElementById('welcome-screen').hidden = name !== 'welcome';
  document.getElementById('game-screen').hidden    = name !== 'game';
  if (name === 'welcome') refreshWelcome();
}

function upgradeUnitFamily(id) {
  const lvl = game.stats.unitLevels[id] || 1;
  if (lvl >= 15) return;
  const cost = lvl; // 1 token per current level
  if ((game.tokens || 0) < cost) return;
  game.tokens -= cost;
  game.stats.unitLevels[id] = lvl + 1;
  saveProgress();
  refreshWelcome();
  updateUI();
}

function renderGuardians() {
  const container = document.getElementById('welcome-guardians');
  if (!container) return;
  const rows = Object.values(FAMILIES).map(f => {
    const lvl = game.stats.unitLevels[f.id] || 1;
    const maxed = lvl >= 15;
    const cost = lvl;
    const canBuy = !maxed && (game.tokens || 0) >= cost;
    return `<li class="artifact-row">
      <span class="glyph" style="border-color:${f.color}">${SIGNATURE[f.id].glyph}</span>
      <div class="meta">
        <div class="name">${f.name} <span class="lvl">Lv ${lvl}${maxed ? ' · MAX' : ''}</span></div>
        <div class="desc">${f.desc}</div>
        <div class="effect">Bonus: <b>+${(lvl - 1) * 4}% DMG, +${(lvl - 1) * 2}% APS</b></div>
      </div>
      ${maxed
      ? '<button class="artifact-buy" disabled>Maxed</button>'
      : `<button class="artifact-buy" data-family="${f.id}" ${canBuy ? '' : 'disabled'}>+1 <span class="cost">${cost}🪙</span></button>`}
    </li>`;
  }).join('');
  container.innerHTML = `<ul class="artifact-list">${rows}</ul>
    <p class="hint">Level up your guardian families permanently using Tokens.</p>`;
  container.querySelectorAll('[data-family]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); upgradeUnitFamily(btn.dataset.family); });
  });
}

function refreshWelcome() {
  renderDifficulty();
  renderMaps();
  renderFamilies();
  renderGuardians();
  renderAchievements();
  renderArtifacts('welcome-artifacts');
  const gemDisp = document.getElementById('welcome-gems');
  const tokDisp = document.getElementById('welcome-tokens');
  if (gemDisp) gemDisp.textContent = game.gems || 0;
  if (tokDisp) tokDisp.textContent = game.tokens || 0;
  if (ui.coopToggle) ui.coopToggle.checked = game.coop.enabled;
  const resumeBtn = document.getElementById('resume-run');
  const startBtn  = document.getElementById('start-run');
  const canResume = game.runActive && !game.gameOver;
  if (resumeBtn) resumeBtn.hidden = !canResume;
  if (startBtn)  startBtn.textContent = canResume ? 'Start New Run' : 'Start Run';
}

function startRunFromWelcome() {
  restart();
  game.runActive = true;
  showView('game');
}

function resumeRun() { showView('game'); }

function backToMenu() {
  closeAllPopups();
  if (game.selectedUnit) { game.selectedUnit = null; renderUnitInfo(); }
  if (game.gameOver) game.runActive = false;
  showView('welcome');
}

function resetAllProgress() {
  if (!confirm('Wipe all saved artifacts, achievements and stats?')) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  game.artifacts = { sb: 0, mg: 0 };
  game.achievements = {};
  game.stats = { kills: 0, stuns: 0, golemKills: 0, dungeonClears: 0 };
  game.difficulty = 'normal';
  refreshWelcome();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

function init() {
  setupUI();
  const saved = loadSave();
  if (saved) {
    if (saved.artifacts)    game.artifacts    = Object.assign(game.artifacts, saved.artifacts);
    if (saved.achievements) game.achievements = saved.achievements;
    if (saved.stats)        game.stats        = Object.assign(game.stats, saved.stats);
    if (!game.stats.unitLevels) game.stats.unitLevels = {};
    if (saved.difficulty && DIFFICULTIES[saved.difficulty]) game.difficulty = saved.difficulty;
    if (saved.mapId && MAPS[saved.mapId]) game.mapId = saved.mapId;
    if (saved.coop)         game.coop.enabled = !!saved.coop.enabled;
    if (saved.gems !== undefined) game.gems = saved.gems;
    if (saved.tokens !== undefined) game.tokens = saved.tokens;
  }
  setMap(game.mapId);
  game.missions = makeMissions();
  renderMissions();
  renderDungeon();
  renderArtifacts();
  updateUI();
  log('Welcome to Copilot Defence!');
  if (game.artifacts.sb > 0 || game.artifacts.mg > 0) {
    log(`Artifacts active — Safe Box Lv ${game.artifacts.sb}, Money Gun Lv ${game.artifacts.mg}`, 'epic');
  }
  // Welcome screen wiring.
  document.getElementById('start-run').addEventListener('click', startRunFromWelcome);
  document.getElementById('resume-run').addEventListener('click', resumeRun);
  document.getElementById('welcome-reset').addEventListener('click', resetAllProgress);
  showView('welcome');
  registerServiceWorker();
  game.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

init();
