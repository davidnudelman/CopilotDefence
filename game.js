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
const STARTING_GOLD = 60;
const STARTING_HP = 20;
const SUMMON_COST_START = 8;
const SUMMON_COST_STEP = 2;
const SUMMON_COST_CAP = 80;

/* === Path (winding road from left to right) === */
const WAYPOINTS = [
  { col: -1, row: 2 },
  { col: 1,  row: 2 },
  { col: 1,  row: 0 },
  { col: 3,  row: 0 },
  { col: 3,  row: 4 },
  { col: 5,  row: 4 },
  { col: 5,  row: 1 },
  { col: 7,  row: 1 },
  { col: 7,  row: 5 },
  { col: 8,  row: 5 },
  { col: 8,  row: 2 },
  { col: 10, row: 2 },
];

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
 * dmg     : base damage per hit
 * range   : in tiles (radius)
 * aps     : attacks per second
 * type    : physical | magic
 * extras  : aoe, stun, slow, percentHP, defDown
 */
const UNITS = {
  intern:    { id: 'intern',    name: 'Intern',           rarity: 'Common',    glyph: '🧒', dmg: 4,  range: 1.6, aps: 1.0, type: 'physical' },
  junior:    { id: 'junior',    name: 'Junior Dev',       rarity: 'Common',    glyph: '👩‍💻', dmg: 3,  range: 2.0, aps: 1.3, type: 'physical' },
  mid:       { id: 'mid',       name: 'Mid Engineer',     rarity: 'Rare',      glyph: '👨‍💻', dmg: 9,  range: 2.0, aps: 1.3, type: 'physical' },
  qa:        { id: 'qa',        name: 'QA Tester',        rarity: 'Rare',      glyph: '🔍', dmg: 5,  range: 2.5, aps: 0.9, type: 'physical', slow: { amount: 0.4, duration: 1.4 } },
  senior:    { id: 'senior',    name: 'Senior Dev',       rarity: 'Epic',      glyph: '🧙', dmg: 26, range: 2.6, aps: 1.1, type: 'physical' },
  architect: { id: 'architect', name: 'Architect',        rarity: 'Epic',      glyph: '👷', dmg: 20, range: 3.0, aps: 0.9, type: 'magic',    aoe: 0.9 },
  techlead:  { id: 'techlead',  name: 'Tech Lead',        rarity: 'Legendary', glyph: '👨‍🏫', dmg: 42, range: 2.6, aps: 1.0, type: 'physical', stun: { chance: 0.35, duration: 0.8 } },
  aipair:    { id: 'aipair',    name: 'AI Pair',          rarity: 'Legendary', glyph: '🦾', dmg: 60, range: 2.6, aps: 1.2, type: 'magic' },
  linter:    { id: 'linter',    name: 'Linter',           rarity: 'Legendary', glyph: '📐', dmg: 18, range: 2.6, aps: 1.1, type: 'physical', defDown: { amount: 0.25, duration: 2.5 } },
  bandit:    { id: 'bandit',    name: 'Bandit',           rarity: 'Legendary', glyph: '🥷', dmg: 24, range: 2.4, aps: 1.3, type: 'physical', loot: 3, dungeonDps: 12 },
  tenx:      { id: 'tenx',      name: '10× Engineer',     rarity: 'Mythic',    glyph: '🦸', dmg: 130, range: 3.0, aps: 1.6, type: 'physical' },
  refactor:  { id: 'refactor',  name: 'Refactor Master',  rarity: 'Mythic',    glyph: '🧹', dmg: 80,  range: 2.6, aps: 0.9, type: 'magic',    percentHP: 0.045 },
  copilot:   { id: 'copilot',   name: 'Copilot Pro',      rarity: 'Mythic',    glyph: '🚀', dmg: 110, range: 3.4, aps: 1.0, type: 'magic',    aoe: 1.0 },
  banditlord:{ id: 'banditlord',name: 'Bandit Lord',      rarity: 'Mythic',    glyph: '💰', dmg: 95,  range: 2.8, aps: 1.4, type: 'physical', loot: 10, dungeonDps: 38 },
  haley:     { id: 'haley',     name: 'Haley',            rarity: 'Immortal',  glyph: '🪄', dmg: 200, range: 3.0, aps: 1.5, type: 'physical', variable: true,           dungeonDps: 80 },
  ato:       { id: 'ato',       name: 'Immortal Ato',     rarity: 'Immortal',  glyph: '🦋', dmg: 170, range: 3.4, aps: 1.2, type: 'magic',    variable: true, aoe: 1.2, dungeonDps: 70 },
};

const POOLS = {
  Common:    ['intern', 'junior'],
  Rare:      ['mid', 'qa'],
  Epic:      ['senior', 'architect'],
  Legendary: ['techlead', 'aipair', 'linter', 'bandit'],
  Mythic:    ['tenx', 'refactor', 'copilot', 'banditlord'],
  Immortal:  ['haley', 'ato'],
};

const IMMORTAL_ROULETTE_COST = 8;

/* Deterministic Legendary → Mythic recipes (3 of same Legendary). */
const MYTHIC_RECIPES = {
  techlead: 'tenx',
  aipair:   'copilot',
  linter:   'refactor',
  bandit:   'banditlord',
};

/* === Artifacts (persisted across runs via localStorage) === */
const STORAGE_KEY = 'copilot-defence-save-v1';
const ARTIFACT_MAX_LEVEL = 12;

const ARTIFACTS = {
  sb: {
    id: 'sb',
    name: 'Safe Box',
    glyph: '🏦',
    desc: 'Generates passive gold each second. Scales with your current stockpile.',
    rateAt: (lvl, gold) => lvl > 0 ? lvl * (1 + Math.sqrt(Math.max(0, gold) / 500)) : 0,
    effectAt: (lvl, gold) => `+${ARTIFACTS.sb.rateAt(lvl, gold).toFixed(1)} g/s`,
    upgradeCost: (lvl) => 2 + lvl,
  },
  mg: {
    id: 'mg',
    name: 'Money Gun',
    glyph: '💸',
    desc: 'Global ATK multiplier for every guardian. Scales with your gold pile.',
    multAt: (lvl, gold) => 1 + (lvl * 0.05) * Math.sqrt(Math.max(0, gold) / 200),
    effectAt: (lvl, gold) => `×${ARTIFACTS.mg.multAt(lvl, gold).toFixed(2)} ATK`,
    upgradeCost: (lvl) => 3 + lvl,
  },
};
const ARTIFACT_ORDER = ['sb', 'mg'];

/* === Achievements (cumulative; persisted across runs) === */
const ACHIEVEMENTS = [
  { id: 'firstWave',   title: 'First Commit',     desc: 'Clear wave 1.' },
  { id: 'wave10',      title: 'Decade',           desc: 'Reach wave 10.' },
  { id: 'wave30',      title: 'Trifecta',         desc: 'Reach wave 30.' },
  { id: 'wave50',      title: 'Half Century',     desc: 'Reach wave 50.' },
  { id: 'victory',     title: 'Total Victory',    desc: 'Clear wave 80.' },
  { id: 'forge',       title: 'Recipe Forged',    desc: 'Forge a Mythic from a recipe.' },
  { id: 'banditLord',  title: "Bandit's Honor",   desc: 'Acquire a Bandit Lord.' },
  { id: 'golem5',      title: 'Golem Hunter',     desc: 'Defeat 5 Golems (cumulative).' },
  { id: 'dungeon10',   title: 'Dungeon Crawler',  desc: 'Clear 10 dungeon bosses (cumulative).' },
  { id: 'hoard',       title: 'Hoarder',          desc: 'Hold 5,000 gold at once.' },
  { id: 'stun100',     title: 'Stun Master',      desc: 'Stun 100 enemies (cumulative).' },
  { id: 'kill1000',    title: 'Bug Bash',         desc: 'Kill 1,000 enemies (cumulative).' },
  { id: 'sbMax',       title: 'Vault Engineer',   desc: 'Upgrade Safe Box to Lv 5.' },
  { id: 'mgMax',       title: 'Cashflow Cannon',  desc: 'Upgrade Money Gun to Lv 5.' },
  { id: 'immortal',    title: 'Beyond Mythic',    desc: 'Summon an Immortal guardian.' },
  { id: 'hardClear',   title: 'Hard Mode Clear',  desc: 'Reach wave 30 on Hard.' },
  { id: 'hellRun',     title: 'Welcome to Hell',  desc: 'Reach wave 10 on Hell.' },
  { id: 'stoneHoard',  title: 'Stone Hoarder',    desc: 'Hold 30 Luck Stones at once.' },
  { id: 'dungeon5',    title: 'Tier 5 Crawler',   desc: 'Clear Dungeon Tier 5.' },
  { id: 'recipeAll',   title: 'Recipe Collector', desc: 'Forge every Mythic recipe at least once.' },
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
    }));
  } catch {}
}

/* === Path helpers === */
function cellCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

const PATH_CELLS = (() => {
  const s = new Set();
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i], b = WAYPOINTS[i + 1];
    if (a.col === b.col) {
      const lo = Math.min(a.row, b.row), hi = Math.max(a.row, b.row);
      for (let r = lo; r <= hi; r++) s.add(`${a.col},${r}`);
    } else {
      const lo = Math.min(a.col, b.col), hi = Math.max(a.col, b.col);
      for (let c = lo; c <= hi; c++) s.add(`${c},${a.row}`);
    }
  }
  return s;
})();

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
const GOLEM_COOLDOWN = 45;
const GOLEM_TIMEOUT  = 25;
const DUNGEON_BASE_HP = 320;

const game = {
  canvas: null, ctx: null,
  gold: STARTING_GOLD,
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
  speed: 1,
  selectedUnit: null,
  draggingUnit: null,
  dragX: 0, dragY: 0,
  upgrades: { Common: 0, Epic: 0, Mythic: 0 },
  missions: [],
  gameOver: false,
  victory: false,
  lastTime: 0,
  golem: { cooldown: GOLEM_COOLDOWN, ready: false, active: false, timer: 0, kills: 0 },
  dungeon: { units: [], boss: { hp: DUNGEON_BASE_HP, maxHp: DUNGEON_BASE_HP, tier: 1 }, kills: 0 },
  artifacts: { sb: 0, mg: 0 },
  achievements: {},
  stats: { kills: 0, stuns: 0, golemKills: 0, dungeonClears: 0, recipesUsed: {} },
  difficulty: 'normal',
  particles: [],
  rings: [],
  shake: { time: 0, intensity: 0 },
  waveEscapes: 0,
  view: 'welcome',
  runActive: false,
};

const ui = {};

/* === Missions === */
function makeMissions() {
  return [
    { id: 'firstSummon',    text: 'Summon your first guardian', reward: { gold: 10 } },
    { id: 'fiveCommons',    text: 'Have 5 Commons on board',    reward: { gold: 25 } },
    { id: 'firstMerge',     text: 'Merge 3 units',              reward: { stones: 1 } },
    { id: 'firstEpic',      text: 'Obtain an Epic unit',        reward: { stones: 1 } },
    { id: 'firstLegendary', text: 'Obtain a Legendary unit',    reward: { stones: 2 } },
    { id: 'firstMythic',    text: 'Obtain a Mythic unit',       reward: { gold: 200, stones: 3 } },
    { id: 'firstGolem',     text: 'Defeat a Golem',             reward: { gold: 50, stones: 1 } },
    { id: 'firstDungeon',   text: 'Clear a Dungeon boss',       reward: { gold: 40, stones: 1 } },
    { id: 'beatBoss',       text: 'Defeat your first boss',     reward: { stones: 1 } },
    { id: 'reachWave10',    text: 'Reach Wave 10',              reward: { gold: 60, stones: 2 } },
    { id: 'reachWave30',    text: 'Reach Wave 30',              reward: { gold: 250, stones: 3 } },
  ].map(m => ({ ...m, done: false }));
}

function completeMission(id) {
  const m = game.missions.find(x => x.id === id);
  if (!m || m.done) return;
  m.done = true;
  if (m.reward.gold)   { game.gold   += m.reward.gold;   log(`Mission: ${m.text} (+${m.reward.gold}g)`, 'gold'); }
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
  const tuning = {
    normal: { hp: 7  * Math.pow(1.062, wave - 1), speed: 82, size: 16, def: Math.floor(wave * 0.35), magicRes: 0, color: '#e25555', glyph: '🐛' },
    elite:  { hp: 26 * Math.pow(1.072, wave - 1), speed: 66, size: 20, def: Math.floor(wave * 0.55), magicRes: 0, color: '#7a55c4', glyph: '💧' },
    boss:   { hp: 75 * Math.pow(1.092, wave - 1), speed: 38, size: 28, def: Math.floor(wave * 0.65), magicRes: wave >= 50 ? 0.3 : 0, color: '#1a1a1a', glyph: '💀' },
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
    dead: false, escaped: false,
    entryTimer: kind === 'boss' ? 0.9 : 0,
  };
  const p = positionAt(0);
  e.x = p.x; e.y = p.y;
  return e;
}

function startWave() {
  if (game.waveRunning || game.gameOver) return;
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
    const bonus = 6 + Math.floor(game.wave * 1.2);
    game.gold += bonus;
    log(`Wave ${game.wave} cleared (+${bonus}g)`, 'gold');
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
    saveProgress();
    updateUI();
  }
}

/* === Enemies === */
function updateEnemies(dt) {
  for (const e of game.enemies) {
    if (e.dead || e.escaped) continue;
    if (e.stunTimer > 0) e.stunTimer = Math.max(0, e.stunTimer - dt);
    if (e.slowTimer > 0) { e.slowTimer = Math.max(0, e.slowTimer - dt); if (e.slowTimer === 0) e.slowAmount = 0; }
    if (e.defDownTimer > 0) { e.defDownTimer = Math.max(0, e.defDownTimer - dt); if (e.defDownTimer === 0) e.defDownAmount = 0; }

    if (e.stationary) continue;
    if (e.entryTimer > 0) { e.entryTimer = Math.max(0, e.entryTimer - dt); continue; }

    let speed = e.baseSpeed;
    if (e.stunTimer > 0) speed = 0;
    else if (e.slowAmount > 0) speed *= (1 - e.slowAmount);

    e.pathDist += speed * dt;
    const pos = positionAt(e.pathDist);
    e.x = pos.x; e.y = pos.y;
    if (pos.done) {
      e.escaped = true;
      game.waveEscapes++;
      const dmg = e.kind === 'boss' ? 5 : e.kind === 'elite' ? 2 : 1;
      game.hp -= dmg;
      triggerShake(4 + dmg, 0.25);
      log(`Escape! ${e.glyph} reached the base (-${dmg} HP)`, 'danger');
      if (game.hp <= 0) { game.hp = 0; endGame(false); }
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
  if (enemy.kind === 'normal') game.gold += (2 + Math.floor(game.wave * 0.25)) * rewardMult;
  else if (enemy.kind === 'elite') game.gold += (9 + Math.floor(game.wave * 0.5)) * rewardMult;
  else if (enemy.kind === 'boss') {
    const reward = Math.round((30 + game.wave * 2) * rewardMult);
    game.gold += reward;
    game.stones += 2;
    log(`Boss defeated (+${reward}g, +2 stones)`, 'gold');
    completeMission('beatBoss');
  } else if (enemy.kind === 'golem') {
    const reward = Math.round((60 + game.wave * 3) * rewardMult);
    game.gold += reward;
    game.stones += 2;
    game.golem.active = false;
    game.golem.kills += 1;
    game.golem.cooldown = GOLEM_COOLDOWN;
    log(`Golem defeated (+${reward}g, +2 stones)`, 'gold');
    completeMission('firstGolem');
    game.stats.golemKills = (game.stats.golemKills || 0) + 1;
    if (game.stats.golemKills >= 5) unlock('golem5');
    saveProgress();
    updateUI();
  }
  if (killer) {
    const k = UNITS[killer.id];
    if (k && k.loot && enemy.kind !== 'golem') {
      game.gold += k.loot;
      spawnPopup(enemy.x, enemy.y - enemy.size - 14, `+${k.loot}g`, '#ffd166');
      spawnLootCoins(enemy.x, enemy.y, Math.min(6, 2 + Math.floor(k.loot / 3)));
    }
  }
  noteKill();
}

/* === Units === */
function unitDamage(unit) {
  const d = UNITS[unit.id];
  let dmg = d.dmg;
  if (d.rarity === 'Common' || d.rarity === 'Rare') dmg *= 1 + 0.20 * game.upgrades.Common;
  else if (d.rarity === 'Epic')                     dmg *= 1 + 0.20 * game.upgrades.Epic;
  else                                              dmg *= 1 + 0.25 * game.upgrades.Mythic;
  dmg *= ARTIFACTS.mg.multAt(game.artifacts.mg, game.gold);
  if (d.variable) dmg *= 0.5 + Math.random();
  return dmg;
}

function updateUnits(dt) {
  for (const u of game.units) {
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
    if (d.percentHP) dmg += target.maxHp * d.percentHP;
    damageEnemy(target, dmg, d.type, u);

    if (d.aoe) {
      const aoeR = d.aoe * TILE;
      spawnRing(target.x, target.y, aoeR, d.type === 'magic' ? '#9bd9ff' : '#ffd166', 0.35, 2);
      for (const e of game.enemies) {
        if (e === target || e.dead || e.escaped) continue;
        if (Math.hypot(e.x - target.x, e.y - target.y) <= aoeR) {
          damageEnemy(e, dmg * 0.55, d.type, u);
        }
      }
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
    if (d.defDown) {
      const fresh = target.defDownTimer <= 0;
      target.defDownAmount = Math.max(target.defDownAmount, d.defDown.amount);
      target.defDownTimer  = Math.max(target.defDownTimer,  d.defDown.duration);
      if (fresh) spawnRing(target.x, target.y, target.size + 12, '#ff9090', 0.3, 2);
    }
    game.beams.push({
      x1: c.x, y1: c.y, x2: target.x, y2: target.y,
      life: 0.14, color: d.type === 'magic' ? '#9bd9ff' : '#ffd166',
    });
    u.cooldown = 1 / d.aps;
    u.flash = 0.1;
  }
}

function findEmptyCell() {
  const choices = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (PATH_CELLS.has(`${c},${r}`)) continue;
      if (game.units.some(u => u.col === c && u.row === r)) continue;
      choices.push([c, r]);
    }
  }
  if (!choices.length) return null;
  return choices[Math.floor(Math.random() * choices.length)];
}

function spawnUnit(id, col, row) {
  const u = { id, col, row, cooldown: 0, flash: 0 };
  game.units.push(u);
  const d = UNITS[id];
  log(`Summoned ${d.name}`, d.rarity.toLowerCase());
  if (d.rarity === 'Epic')      completeMission('firstEpic');
  if (d.rarity === 'Legendary') completeMission('firstLegendary');
  if (d.rarity === 'Mythic')    completeMission('firstMythic');
  if (d.rarity === 'Immortal')  unlock('immortal');
  if (id === 'banditlord')      unlock('banditLord');
  const commons = game.units.filter(x => UNITS[x.id].rarity === 'Common').length;
  if (commons >= 5) completeMission('fiveCommons');
  return u;
}

function summon() {
  if (game.gold < game.summonCost) return;
  const cell = findEmptyCell();
  if (!cell) { log('Board is full', 'danger'); return; }
  game.gold -= game.summonCost;
  game.summonCost = Math.min(SUMMON_COST_CAP, game.summonCost + SUMMON_COST_STEP);
  const rarity = Math.random() < 0.72 ? 'Common' : 'Rare';
  const id = POOLS[rarity][Math.floor(Math.random() * POOLS[rarity].length)];
  spawnUnit(id, cell[0], cell[1]);
  completeMission('firstSummon');
  updateUI();
}

function roulette() {
  if (game.stones < 1) return;
  const cell = findEmptyCell();
  if (!cell) { log('Board is full', 'danger'); return; }
  game.stones -= 1;
  const id = POOLS.Epic[Math.floor(Math.random() * POOLS.Epic.length)];
  spawnUnit(id, cell[0], cell[1]);
  updateUI();
}

function immortalUnlocked() {
  return game.units.some(u => UNITS[u.id].rarity === 'Mythic') ||
         game.dungeon.units.some(u => UNITS[u.id].rarity === 'Mythic') ||
         !!game.achievements.immortal;
}

function immortalRoulette() {
  if (!immortalUnlocked()) { log('Acquire a Mythic to unlock the Immortal Pull', 'danger'); return; }
  if (game.stones < IMMORTAL_ROULETTE_COST) return;
  const cell = findEmptyCell();
  if (!cell) { log('Board is full', 'danger'); return; }
  game.stones -= IMMORTAL_ROULETTE_COST;
  const id = POOLS.Immortal[Math.floor(Math.random() * POOLS.Immortal.length)];
  spawnUnit(id, cell[0], cell[1]);
  triggerShake(6, 0.35);
  spawnParticleBurst(cellCenter(cell[0], cell[1]).x, cellCenter(cell[0], cell[1]).y, '#ffffff', 22);
  updateUI();
}

function mergeSelected() {
  const u = game.selectedUnit;
  if (!u) return;
  const d = UNITS[u.id];
  const tierIdx = RARITY_ORDER.indexOf(d.rarity);
  if (tierIdx >= RARITY_ORDER.length - 1) { log('Mythics cannot be merged', 'danger'); return; }
  const same = game.units.filter(x => x.id === u.id);
  if (same.length < 3) return;
  const toRemove = same.slice(0, 3);
  const keepCell = { col: toRemove[0].col, row: toRemove[0].row };
  for (const x of toRemove) {
    const idx = game.units.indexOf(x);
    if (idx >= 0) game.units.splice(idx, 1);
  }
  const nextRarity = RARITY_ORDER[tierIdx + 1];
  const usedRecipe = d.rarity === 'Legendary' && MYTHIC_RECIPES[u.id];
  const newId = usedRecipe
    ? MYTHIC_RECIPES[u.id]
    : POOLS[nextRarity][Math.floor(Math.random() * POOLS[nextRarity].length)];
  const newUnit = spawnUnit(newId, keepCell.col, keepCell.row);
  if (usedRecipe) {
    unlock('forge');
    if (!game.stats.recipesUsed) game.stats.recipesUsed = {};
    game.stats.recipesUsed[newId] = true;
    const haveAll = Object.values(MYTHIC_RECIPES).every(id => game.stats.recipesUsed[id]);
    if (haveAll) unlock('recipeAll');
    spawnRing(cellCenter(keepCell.col, keepCell.row).x, cellCenter(keepCell.col, keepCell.row).y, 48, RARITY_COLORS.Mythic, 0.55, 4);
    spawnParticleBurst(cellCenter(keepCell.col, keepCell.row).x, cellCenter(keepCell.col, keepCell.row).y, RARITY_COLORS.Mythic, 18);
  }
  game.selectedUnit = newUnit;
  completeMission('firstMerge');
  log(`Merge → ${UNITS[newId].name}!`, nextRarity.toLowerCase());
  updateUI();
}

function sellSelected() {
  const u = game.selectedUnit;
  if (!u) return;
  const d = UNITS[u.id];
  const refund = { Common: 4, Rare: 9, Epic: 35, Legendary: 100, Mythic: 250 }[d.rarity];
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
const GOLEM_CELL = { col: 9, row: 4 };

function startGolem() {
  if (!game.golem.ready || game.golem.active || game.gameOver) return;
  triggerShake(7, 0.35);
  const wave = game.wave;
  const hp = 110 * Math.pow(1.08, wave - 1);
  const c = cellCenter(GOLEM_CELL.col, GOLEM_CELL.row);
  game.enemies.push({
    kind: 'golem',
    stationary: true,
    maxHp: hp, hp,
    baseSpeed: 0,
    size: 24,
    def: Math.floor(wave * 0.55),
    magicRes: 0,
    color: '#6c5a3e',
    glyph: '🗿',
    pathDist: 0, x: c.x, y: c.y,
    stunTimer: 0, slowTimer: 0, slowAmount: 0,
    defDownTimer: 0, defDownAmount: 0,
    dead: false, escaped: false,
    expireTimer: GOLEM_TIMEOUT,
  });
  game.golem.ready = false;
  game.golem.active = true;
  game.golem.timer = GOLEM_TIMEOUT;
  log('A Golem appears! Engage before it vanishes.', 'epic');
  updateUI();
}

function updateGolem(dt) {
  if (game.golem.active) {
    game.golem.timer -= dt;
    const g = game.enemies.find(e => e.kind === 'golem');
    if (g) g.expireTimer = game.golem.timer;
    if (game.golem.timer <= 0) {
      if (g) g.escaped = true;
      game.golem.active = false;
      game.golem.cooldown = GOLEM_COOLDOWN;
      log('Golem retreated into the noise.', 'danger');
      updateUI();
    }
    return;
  }
  if (!game.golem.ready) {
    game.golem.cooldown -= dt;
    if (game.golem.cooldown <= 0) {
      game.golem.ready = true;
      log('A Golem stirs in the logs…', 'stone');
      updateUI();
    }
  }
}

function attackStationary(dt) {
  for (const u of game.units) {
    if (u.cooldown > 0) continue;
    const d = UNITS[u.id];
    const c = cellCenter(u.col, u.row);
    const rangePx = d.range * TILE;
    let target = null, best = Infinity;
    for (const e of game.enemies) {
      if (!e.stationary || e.dead || e.escaped) continue;
      const dist = Math.hypot(e.x - c.x, e.y - c.y);
      if (dist <= rangePx && dist < best) { best = dist; target = e; }
    }
    if (!target) continue;
    let dmg = unitDamage(u);
    if (d.percentHP) dmg += target.maxHp * d.percentHP;
    damageEnemy(target, dmg, d.type, u);
    game.beams.push({
      x1: c.x, y1: c.y, x2: target.x, y2: target.y,
      life: 0.14, color: d.type === 'magic' ? '#9bd9ff' : '#ffd166',
    });
    u.cooldown = 1 / d.aps;
    u.flash = 0.1;
  }
}

/* === Dungeon === */
function dungeonDps(unit) {
  const d = UNITS[unit.id];
  return d.dungeonDps != null ? d.dungeonDps : unitDamage(unit) * d.aps * 0.35;
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
  let lootPerSec = 0;
  for (const u of game.dungeon.units) {
    dps += dungeonDps(u);
    const d = UNITS[u.id];
    if (d.loot) lootPerSec += d.loot * 0.6;
  }
  game.dungeon.boss.hp -= dps * dt;
  if (lootPerSec > 0) game.gold += lootPerSec * dt;
  if (game.dungeon.boss.hp <= 0) {
    const tier = game.dungeon.boss.tier;
    const reward = 40 + 18 * tier;
    game.gold += reward;
    game.dungeon.kills += 1;
    log(`Dungeon boss T${tier} falls (+${reward}g)`, 'gold');
    completeMission('firstDungeon');
    game.dungeon.boss.tier = tier + 1;
    const newHp = DUNGEON_BASE_HP * Math.pow(1.45, tier);
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
    Common: 20 + 12 * game.upgrades.Common,
    Epic:   60 + 30 * game.upgrades.Epic,
    Mythic: 150 + 80 * game.upgrades.Mythic,
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
function updateArtifactPassives(dt) {
  const rate = ARTIFACTS.sb.rateAt(game.artifacts.sb, game.gold);
  if (rate > 0) game.gold += rate * dt;
}

function upgradeArtifact(id) {
  const def = ARTIFACTS[id];
  if (!def) return;
  const lvl = game.artifacts[id];
  if (lvl >= ARTIFACT_MAX_LEVEL) return;
  const cost = def.upgradeCost(lvl);
  if (game.stones < cost) return;
  game.stones -= cost;
  game.artifacts[id] = lvl + 1;
  log(`${def.name} → Lv ${lvl + 1}`, 'stone');
  if (id === 'sb' && game.artifacts.sb >= 5) unlock('sbMax');
  if (id === 'mg' && game.artifacts.mg >= 5) unlock('mgMax');
  saveProgress();
  renderArtifacts();
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
  if (game.gold >= 5000) unlock('hoard');
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

function spawnLootCoins(x, y, count = 4) {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 2);
    const speed = 70 + Math.random() * 60;
    const life = 0.65 + Math.random() * 0.2;
    game.particles.push({
      x, y, color: '#ffd166',
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 110,
      life, maxLife: life,
      size: 3.5 + Math.random() * 1.5,
    });
  }
}

function spawnRing(x, y, maxRadius, color, life = 0.45, width = 3) {
  game.rings.push({ x, y, radius: 0, maxRadius, color, life, maxLife: life, width });
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

function drawUnitAt(ctx, u, x, y, ghost = false) {
  const d = UNITS[u.id];
  const color = RARITY_COLORS[d.rarity];
  ctx.save();
  if (ghost) ctx.globalAlpha = 0.78;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 22, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.fillStyle = '#1c2436';
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  // glow flash
  if ((u.flash || 0) > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(u.flash / 0.1) * 0.18})`;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  // ring
  ctx.strokeStyle = color;
  ctx.lineWidth = (d.rarity === 'Mythic' || d.rarity === 'Immortal') ? 4 : 3;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.stroke();
  if (d.rarity === 'Mythic') {
    ctx.strokeStyle = 'rgba(244, 155, 58, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.stroke();
  } else if (d.rarity === 'Immortal') {
    // Rainbow shimmer ring — three offset arcs animated by time.
    const t = performance.now() / 600;
    for (let i = 0; i < 6; i++) {
      const a0 = t + i * Math.PI / 3;
      const a1 = a0 + Math.PI / 5;
      ctx.strokeStyle = `hsl(${(t * 60 + i * 60) % 360} 90% 65%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 30, a0, a1);
      ctx.stroke();
    }
  }
  // glyph
  ctx.font = `24px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(d.glyph, x, y + 1);
  // selection ring
  if (!ghost && u === game.selectedUnit) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawUnits(ctx) {
  for (const u of game.units) {
    if (u === game.draggingUnit) continue;
    const c = cellCenter(u.col, u.row);
    drawUnitAt(ctx, u, c.x, c.y);
  }
  if (game.draggingUnit) {
    drawUnitAt(ctx, game.draggingUnit, game.dragX, game.dragY, true);
  }
}

function drawEnemies(ctx) {
  for (const e of game.enemies) {
    if (e.dead || e.escaped) continue;
    const entryFrac = e.entryTimer > 0 ? (e.entryTimer / 0.9) : 0;
    const scale = 1 + entryFrac * 0.7;
    const sz = e.size * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + sz - 2, sz * 0.85, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, sz, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${Math.round(sz * 1.2)}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.glyph, e.x, e.y + 1);
    // HP bar
    const w = sz * 2.2;
    const hp = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = '#000';
    ctx.fillRect(e.x - w / 2 - 1, e.y - sz - 10, w + 2, 5);
    ctx.fillStyle = hp > 0.55 ? '#5fd870' : hp > 0.25 ? '#f5c542' : '#e15555';
    ctx.fillRect(e.x - w / 2, e.y - sz - 9, w * hp, 3);
    // statuses
    if (e.stunTimer > 0) drawStatusIcon(ctx, e, '⚡', '#ffe066', -1);
    if (e.slowAmount > 0) drawStatusIcon(ctx, e, '❄', '#9bd9ff', 0);
    if (e.defDownAmount > 0) drawStatusIcon(ctx, e, '🛡', '#ff9090', 1);
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
    const alpha = Math.max(0, Math.min(1, b.life / 0.14));
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
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
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
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
  const valid = !PATH_CELLS.has(`${col},${row}`) &&
    !game.units.some(x => x !== game.draggingUnit && x.col === col && x.row === row);
  ctx.fillStyle = valid ? 'rgba(120, 220, 120, 0.18)' : 'rgba(220, 80, 80, 0.18)';
  ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
  ctx.strokeStyle = valid ? 'rgba(120, 220, 120, 0.8)' : 'rgba(220, 80, 80, 0.8)';
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
    if (game.waveRunning) {
      updateWaveSpawning(dt);
      updateEnemies(dt);
      updateUnits(dt);
      checkWaveComplete();
    } else if (game.golem.active) {
      updateEnemies(dt);
      attackStationary(dt);
    }
    updateGolem(dt);
    updateDungeon(dt);
    updateArtifactPassives(dt);
    if (game.gold >= 5000) checkHoard();
    if (game.stones >= 30) unlock('stoneHoard');
    updateEffects(dt);
    // Refresh UI numbers (gold ticks from kills); cheap enough each frame.
    ui.gold.textContent = Math.floor(game.gold);
    ui.stones.textContent = game.stones;
    ui.hp.textContent = game.hp;
    if (game.golem.active && ui.golemTimer) {
      ui.golemTimer.textContent = `${Math.max(0, Math.ceil(game.golem.timer))}s`;
    }
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

function onMouseDown(ev) {
  const p = canvasCoords(ev);
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
  const occupied = inside && game.units.some(x => x !== u && x.col === col && x.row === row);
  if (inside && !onPath && !occupied) {
    u.col = col;
    u.row = row;
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
  ui.waveBtn      = document.getElementById('wave-btn');
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
  ui.golemBtn       = document.getElementById('golem-btn');
  ui.golemTimer     = document.getElementById('golem-timer');
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

  ui.immortalBtn        = document.getElementById('immortal-btn');
  ui.immortalCost       = document.getElementById('immortal-cost');

  ui.summonBtn.addEventListener('click', summon);
  ui.rouletteBtn.addEventListener('click', roulette);
  ui.immortalBtn.addEventListener('click', immortalRoulette);
  ui.upgCommon.addEventListener('click', () => upgrade('Common'));
  ui.upgEpic.addEventListener('click',   () => upgrade('Epic'));
  ui.upgMythic.addEventListener('click', () => upgrade('Mythic'));
  ui.speedBtn.addEventListener('click', toggleSpeed);
  ui.waveBtn.addEventListener('click', startWave);
  ui.sellBtn.addEventListener('click', sellSelected);
  ui.mergeBtn.addEventListener('click', mergeSelected);
  ui.dungeonBtn.addEventListener('click', (e) => { e.stopPropagation(); sendToDungeon(); });
  ui.restart.addEventListener('click', restart);

  const POPUP_KEYS = ['missions', 'dungeon', 'artifacts'];
  for (const key of POPUP_KEYS) {
    ui[`${key}Toggle`].addEventListener('click', () => togglePopup(key));
    ui[`${key}Close`].addEventListener('click', () => setPopup(key, false));
  }
  ui.golemBtn.addEventListener('click', startGolem);
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
  window.addEventListener('touchcancel', onMouseUp);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 's' || e.key === 'S') summon();
    else if (e.key === 'r' || e.key === 'R') roulette();
    else if (e.key === ' ') { e.preventDefault(); startWave(); }
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
  ui.rouletteBtn.disabled = game.stones < 1             || game.gameOver;
  if (ui.immortalBtn) {
    ui.immortalCost.textContent = IMMORTAL_ROULETTE_COST;
    const unlocked = immortalUnlocked();
    ui.immortalBtn.disabled = game.gameOver || game.stones < IMMORTAL_ROULETTE_COST || !unlocked;
    ui.immortalBtn.classList.toggle('locked', !unlocked);
    ui.immortalBtn.title = unlocked ? '' : 'Acquire a Mythic guardian to unlock';
  }
  ui.upgCommon.disabled   = game.gold < upgradeCostFor('Common') || game.gameOver;
  ui.upgEpic.disabled     = game.gold < upgradeCostFor('Epic')   || game.gameOver;
  ui.upgMythic.disabled   = game.gold < upgradeCostFor('Mythic') || game.gameOver;
  ui.waveBtn.disabled     = game.waveRunning || game.gameOver;
  ui.waveBtn.textContent  = game.waveRunning ? 'In Progress…' : `Start Wave ${game.wave}`;
  ui.waveBtn.classList.toggle('running', game.waveRunning);
  // Golem button visibility: only visible when a golem is ready or active.
  if ((game.golem.ready || game.golem.active) && !game.gameOver) {
    ui.golemBtn.hidden = false;
    if (game.golem.active) {
      ui.golemBtn.classList.add('active');
      ui.golemBtn.disabled = true;
      ui.golemTimer.textContent = `${Math.max(0, Math.ceil(game.golem.timer))}s`;
    } else {
      ui.golemBtn.classList.remove('active');
      ui.golemBtn.disabled = game.gameOver;
      ui.golemTimer.textContent = 'ready';
    }
  } else {
    ui.golemBtn.hidden = true;
  }
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
  ui.unitInfo.innerHTML = `
    <div class="unit-card">
      <div class="glyph" style="border-color: ${RARITY_COLORS[d.rarity]}">${d.glyph}</div>
      <div class="meta">
        <div class="name">${d.name}</div>
        <div class="rarity" style="color: ${RARITY_COLORS[d.rarity]}">${d.rarity}</div>
      </div>
    </div>
    <table>
      <tr><td class="k">Damage</td><td class="v">${dmg.toFixed(1)} ${d.type}</td></tr>
      <tr><td class="k">Attacks/s</td><td class="v">${d.aps.toFixed(1)}</td></tr>
      <tr><td class="k">DPS</td><td class="v">${dps.toFixed(1)}</td></tr>
      <tr><td class="k">Range</td><td class="v">${d.range.toFixed(1)} tiles</td></tr>
      ${d.aoe       ? `<tr><td class="k">AoE radius</td><td class="v">${d.aoe.toFixed(1)} tiles</td></tr>` : ''}
      ${d.stun      ? `<tr><td class="k">Stun</td><td class="v">${(d.stun.chance*100).toFixed(0)}% / ${d.stun.duration}s</td></tr>` : ''}
      ${d.slow      ? `<tr><td class="k">Slow</td><td class="v">${(d.slow.amount*100).toFixed(0)}% / ${d.slow.duration}s</td></tr>` : ''}
      ${d.percentHP ? `<tr><td class="k">% max HP</td><td class="v">+${(d.percentHP*100).toFixed(1)}%</td></tr>` : ''}
      ${d.defDown   ? `<tr><td class="k">DEF down</td><td class="v">-${(d.defDown.amount*100).toFixed(0)}% / ${d.defDown.duration}s</td></tr>` : ''}
    </table>
  `;
  ui.unitActions.hidden = false;
  const sameCount = game.units.filter(x => x.id === u.id).length;
  ui.mergeBtn.hidden = !(sameCount >= 3 && d.rarity !== 'Mythic');
  ui.dungeonBtn.hidden = !dungeonRecruitable(u);
}

function renderMissions() {
  ui.missionList.innerHTML = game.missions.map(m => {
    const reward = [
      m.reward.gold ? `+${m.reward.gold}g` : null,
      m.reward.stones ? `+${m.reward.stones}🔷` : null,
    ].filter(Boolean).join(' · ');
    return `<li class="${m.done ? 'done' : ''}"><span>${m.text}</span><span class="reward">${reward}</span></li>`;
  }).join('');
  const open = game.missions.filter(m => !m.done).length;
  ui.missionsCount.textContent = open;
  ui.missionsCount.classList.toggle('empty', open === 0);
}

function isSheetOpen(el) { return !!el && el.classList.contains('open'); }

function updateBackdrop() {
  const open = ['missionsPopup', 'dungeonPopup', 'artifactsPopup', 'inspectorSheet']
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

function renderRecipes() {
  const list = document.getElementById('welcome-recipes');
  if (!list) return;
  list.innerHTML = Object.entries(MYTHIC_RECIPES).map(([legId, mythId]) => {
    const a = UNITS[legId], b = UNITS[mythId];
    return `<li>
      <span class="recipe-from" style="color:${RARITY_COLORS[a.rarity]}">3× ${a.glyph} ${a.name}</span>
      <span class="recipe-arrow">→</span>
      <span class="recipe-to" style="color:${RARITY_COLORS[b.rarity]}">${b.glyph} ${b.name}</span>
    </li>`;
  }).join('');
}

function renderDungeon() {
  const boss = game.dungeon.boss;
  const totalDps = game.dungeon.units.reduce((s, u) => s + dungeonDps(u), 0);
  const lootPerSec = game.dungeon.units.reduce((s, u) => s + (UNITS[u.id].loot || 0) * 0.6, 0);
  const unitsHtml = game.dungeon.units.length === 0
    ? `<p class="hint">No guardians assigned. Open the inspector for an eligible unit (Rare or higher) and tap <b>Send to Dungeon</b>. Bandits also generate Loot gold/s here.</p>`
    : `<ul class="dungeon-units">${game.dungeon.units.map((u, i) => {
        const d = UNITS[u.id];
        return `<li>
          <span class="glyph" style="border-color:${RARITY_COLORS[d.rarity]}">${d.glyph}</span>
          <span class="name">${d.name}</span>
          <span class="dps">${dungeonDps(u).toFixed(1)} dps${d.loot ? ` · +${(d.loot*0.6).toFixed(1)}g/s` : ''}</span>
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
        <span>${lootPerSec ? `+${lootPerSec.toFixed(1)}g/s loot` : '—'}</span>
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

function renderArtifacts() {
  const rows = ARTIFACT_ORDER.map(id => {
    const a = ARTIFACTS[id];
    const lvl = game.artifacts[id];
    const cost = a.upgradeCost(lvl);
    const maxed = lvl >= ARTIFACT_MAX_LEVEL;
    const effectNow  = lvl  > 0 ? a.effectAt(lvl,     game.gold) : '—';
    const effectNext = maxed ? '' : a.effectAt(lvl + 1, game.gold);
    const canBuy = !maxed && game.stones >= cost;
    return `<li class="artifact-row">
      <span class="glyph" style="border-color:${RARITY_COLORS.Legendary}">${a.glyph}</span>
      <div class="meta">
        <div class="name">${a.name} <span class="lvl">Lv ${lvl}${maxed ? ' · MAX' : ''}</span></div>
        <div class="desc">${a.desc}</div>
        <div class="effect">Now: <b>${effectNow}</b>${effectNext ? `   <span class="dim">→ ${effectNext}</span>` : ''}</div>
      </div>
      ${maxed
        ? '<button class="artifact-buy" disabled>Maxed</button>'
        : `<button class="artifact-buy" data-artifact="${id}" ${canBuy ? '' : 'disabled'}>+1 <span class="cost">${cost}🔷</span></button>`}
    </li>`;
  }).join('');
  ui.artifactsBody.innerHTML = `<ul class="artifact-list">${rows}</ul>
    <p class="hint">Artifacts persist across runs. Spend Luck Stones to level them up.</p>`;
  ui.artifactsBody.querySelectorAll('[data-artifact]').forEach(btn => {
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
  ui.endText.textContent  = victory
    ? `The codebase is secured. Wave ${game.wave} cleared.`
    : `The codebase is overrun on wave ${game.wave}.`;
  if (victory) unlock('victory');
  saveProgress();
  updateUI();
}

function restart() {
  game.gold = STARTING_GOLD;
  game.stones = 0;
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
  game.selectedUnit = null;
  game.draggingUnit = null;
  game.upgrades = { Common: 0, Epic: 0, Mythic: 0 };
  game.gameOver = false;
  game.victory = false;
  game.missions = makeMissions();
  game.golem = { cooldown: GOLEM_COOLDOWN, ready: false, active: false, timer: 0, kills: 0 };
  game.dungeon = { units: [], boss: { hp: DUNGEON_BASE_HP, maxHp: DUNGEON_BASE_HP, tier: 1 }, kills: 0 };
  game.particles = [];
  game.rings = [];
  game.shake = { time: 0, intensity: 0 };
  game.waveEscapes = 0;
  game.runActive = true;
  // Artifacts, achievements, difficulty and cumulative stats persist across runs.
  ui.gameOver.hidden = true;
  ui.logList.innerHTML = '';
  const diff = DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
  log(`A new ${diff.name} run begins. Build your guardians wisely!`);
  if (game.artifacts.sb > 0 || game.artifacts.mg > 0) {
    log(`Artifacts active — Safe Box Lv ${game.artifacts.sb}, Money Gun Lv ${game.artifacts.mg}`, 'epic');
  }
  renderMissions();
  renderRecipes();
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

function refreshWelcome() {
  renderDifficulty();
  renderRecipes();
  renderAchievements();
  const sb = document.getElementById('welcome-sb');
  const mg = document.getElementById('welcome-mg');
  if (sb) sb.textContent = game.artifacts.sb;
  if (mg) mg.textContent = game.artifacts.mg;
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
  game.stats = { kills: 0, stuns: 0, golemKills: 0, dungeonClears: 0, recipesUsed: {} };
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
    if (saved.difficulty && DIFFICULTIES[saved.difficulty]) game.difficulty = saved.difficulty;
  }
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
