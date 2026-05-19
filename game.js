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

const RARITY_ORDER = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

const RARITY_COLORS = {
  Common:    '#b6bac3',
  Rare:      '#4ed188',
  Epic:      '#4f8bf0',
  Legendary: '#b06bf0',
  Mythic:    '#f49b3a',
};

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
  tenx:      { id: 'tenx',      name: '10× Engineer',     rarity: 'Mythic',    glyph: '🦸', dmg: 130, range: 3.0, aps: 1.6, type: 'physical' },
  refactor:  { id: 'refactor',  name: 'Refactor Master',  rarity: 'Mythic',    glyph: '🧹', dmg: 80,  range: 2.6, aps: 0.9, type: 'magic',    percentHP: 0.045 },
  copilot:   { id: 'copilot',   name: 'Copilot Pro',      rarity: 'Mythic',    glyph: '🚀', dmg: 110, range: 3.4, aps: 1.0, type: 'magic',    aoe: 1.0 },
};

const POOLS = {
  Common:    ['intern', 'junior'],
  Rare:      ['mid', 'qa'],
  Epic:      ['senior', 'architect'],
  Legendary: ['techlead', 'aipair', 'linter'],
  Mythic:    ['tenx', 'refactor', 'copilot'],
};

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
  const tuning = {
    normal: { hp: 7  * Math.pow(1.062, wave - 1), speed: 82, size: 16, def: Math.floor(wave * 0.35), magicRes: 0, color: '#e25555', glyph: '🐛' },
    elite:  { hp: 26 * Math.pow(1.072, wave - 1), speed: 66, size: 20, def: Math.floor(wave * 0.55), magicRes: 0, color: '#7a55c4', glyph: '💧' },
    boss:   { hp: 75 * Math.pow(1.092, wave - 1), speed: 38, size: 28, def: Math.floor(wave * 0.65), magicRes: wave >= 50 ? 0.3 : 0, color: '#1a1a1a', glyph: '💀' },
  }[kind];
  const e = {
    kind,
    maxHp: tuning.hp, hp: tuning.hp,
    baseSpeed: tuning.speed,
    size: tuning.size,
    def: tuning.def,
    magicRes: tuning.magicRes,
    color: tuning.color,
    glyph: tuning.glyph,
    pathDist: 0, x: 0, y: 0,
    stunTimer: 0,
    slowTimer: 0, slowAmount: 0,
    defDownTimer: 0, defDownAmount: 0,
    dead: false, escaped: false,
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
  showBanner(`Wave ${game.wave}${game.wave % 10 === 0 ? ' — BOSS' : ''}`);
  log(`Wave ${game.wave} starts`);
  updateUI();
}

function updateWaveSpawning(dt) {
  game.spawnTimer -= dt;
  while (game.spawnTimer <= 0 && game.spawnQueue.length > 0) {
    const next = game.spawnQueue.shift();
    game.enemies.push(makeEnemy(next.kind, game.wave));
    game.spawnTimer += spawnDelay(next.kind);
  }
}

function checkWaveComplete() {
  if (game.spawnQueue.length === 0 && game.enemies.length === 0) {
    game.waveRunning = false;
    const bonus = 6 + Math.floor(game.wave * 1.2);
    game.gold += bonus;
    log(`Wave ${game.wave} cleared (+${bonus}g)`, 'gold');
    if (game.wave % 5 === 0) {
      game.stones += 1;
      log('+1 Luck Stone (5-wave bonus)', 'stone');
    }
    if (game.wave === 10) completeMission('reachWave10');
    if (game.wave === 30) completeMission('reachWave30');
    if (game.wave >= MAX_WAVES) { endGame(true); return; }
    game.wave++;
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

    let speed = e.baseSpeed;
    if (e.stunTimer > 0) speed = 0;
    else if (e.slowAmount > 0) speed *= (1 - e.slowAmount);

    e.pathDist += speed * dt;
    const pos = positionAt(e.pathDist);
    e.x = pos.x; e.y = pos.y;
    if (pos.done) {
      e.escaped = true;
      const dmg = e.kind === 'boss' ? 5 : e.kind === 'elite' ? 2 : 1;
      game.hp -= dmg;
      log(`Escape! ${e.glyph} reached the base (-${dmg} HP)`, 'danger');
      if (game.hp <= 0) { game.hp = 0; endGame(false); }
    }
  }
  game.enemies = game.enemies.filter(e => !e.dead && !e.escaped);
}

function damageEnemy(enemy, dmg, type) {
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
    onEnemyKilled(enemy);
  }
}

function onEnemyKilled(enemy) {
  if (enemy.kind === 'normal') game.gold += 2 + Math.floor(game.wave * 0.25);
  else if (enemy.kind === 'elite') game.gold += 9 + Math.floor(game.wave * 0.5);
  else if (enemy.kind === 'boss') {
    const reward = 30 + game.wave * 2;
    game.gold += reward;
    game.stones += 2;
    log(`Boss defeated (+${reward}g, +2 stones)`, 'gold');
    completeMission('beatBoss');
  }
}

/* === Units === */
function unitDamage(unit) {
  const d = UNITS[unit.id];
  let dmg = d.dmg;
  if (d.rarity === 'Common' || d.rarity === 'Rare') dmg *= 1 + 0.20 * game.upgrades.Common;
  else if (d.rarity === 'Epic')                     dmg *= 1 + 0.20 * game.upgrades.Epic;
  else                                              dmg *= 1 + 0.25 * game.upgrades.Mythic;
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
    damageEnemy(target, dmg, d.type);

    if (d.aoe) {
      const aoeR = d.aoe * TILE;
      for (const e of game.enemies) {
        if (e === target || e.dead || e.escaped) continue;
        if (Math.hypot(e.x - target.x, e.y - target.y) <= aoeR) {
          damageEnemy(e, dmg * 0.55, d.type);
        }
      }
    }
    if (d.stun && Math.random() < d.stun.chance) {
      target.stunTimer = Math.max(target.stunTimer, d.stun.duration);
    }
    if (d.slow) {
      target.slowAmount = Math.max(target.slowAmount, d.slow.amount);
      target.slowTimer  = Math.max(target.slowTimer,  d.slow.duration);
    }
    if (d.defDown) {
      target.defDownAmount = Math.max(target.defDownAmount, d.defDown.amount);
      target.defDownTimer  = Math.max(target.defDownTimer,  d.defDown.duration);
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
  const newId = POOLS[nextRarity][Math.floor(Math.random() * POOLS[nextRarity].length)];
  const newUnit = spawnUnit(newId, keepCell.col, keepCell.row);
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
  const idx = game.units.indexOf(u);
  if (idx >= 0) game.units.splice(idx, 1);
  game.selectedUnit = null;
  log(`Sold ${d.name} (+${refund}g)`, 'gold');
  updateUI();
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

/* === Effects === */
function updateEffects(dt) {
  for (const b of game.beams) b.life -= dt;
  game.beams = game.beams.filter(b => b.life > 0);
  for (const p of game.popups) { p.life -= dt; p.y -= 22 * dt; }
  game.popups = game.popups.filter(p => p.life > 0);
}

function spawnPopup(x, y, text, color) {
  game.popups.push({ x, y, text, color, life: 0.65 });
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
  ctx.lineWidth = d.rarity === 'Mythic' ? 4 : 3;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.stroke();
  if (d.rarity === 'Mythic') {
    ctx.strokeStyle = 'rgba(244, 155, 58, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.stroke();
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
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + e.size - 2, e.size * 0.85, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${Math.round(e.size * 1.2)}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.glyph, e.x, e.y + 1);
    // HP bar
    const w = e.size * 2.2;
    const hp = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = '#000';
    ctx.fillRect(e.x - w / 2 - 1, e.y - e.size - 10, w + 2, 5);
    ctx.fillStyle = hp > 0.55 ? '#5fd870' : hp > 0.25 ? '#f5c542' : '#e15555';
    ctx.fillRect(e.x - w / 2, e.y - e.size - 9, w * hp, 3);
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
  drawGrid(ctx);
  drawPath(ctx);
  drawHoverCell(ctx);
  if (game.selectedUnit) drawRangeIndicator(ctx, game.selectedUnit);
  drawUnits(ctx);
  drawEnemies(ctx);
  drawBeams(ctx);
  drawPopups(ctx);
}

/* === Game loop === */
function gameLoop(timestamp) {
  const raw = (timestamp - game.lastTime) / 1000;
  const dt = Math.min(0.05, raw) * game.speed;
  game.lastTime = timestamp;

  if (!game.gameOver) {
    if (game.waveRunning) {
      updateWaveSpawning(dt);
      updateEnemies(dt);
      updateUnits(dt);
      checkWaveComplete();
    }
    updateEffects(dt);
    // Refresh UI numbers (gold ticks from kills); cheap enough each frame.
    ui.gold.textContent = Math.floor(game.gold);
    ui.stones.textContent = game.stones;
    ui.hp.textContent = game.hp;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

/* === Mouse interaction === */
function canvasCoords(ev) {
  const r = game.canvas.getBoundingClientRect();
  const sx = game.canvas.width  / r.width;
  const sy = game.canvas.height / r.height;
  return { x: (ev.clientX - r.left) * sx, y: (ev.clientY - r.top) * sy };
}

function findUnitAt(x, y) {
  let best = null, bestDist = Infinity;
  for (const u of game.units) {
    const c = cellCenter(u.col, u.row);
    const d = Math.hypot(x - c.x, y - c.y);
    if (d <= 26 && d < bestDist) { bestDist = d; best = u; }
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
  ui.logList      = document.getElementById('log-list');
  ui.gameOver     = document.getElementById('game-over');
  ui.endTitle     = document.getElementById('end-title');
  ui.endText      = document.getElementById('end-text');
  ui.restart      = document.getElementById('restart');
  ui.waveBanner   = document.getElementById('wave-banner');

  ui.summonBtn.addEventListener('click', summon);
  ui.rouletteBtn.addEventListener('click', roulette);
  ui.upgCommon.addEventListener('click', () => upgrade('Common'));
  ui.upgEpic.addEventListener('click',   () => upgrade('Epic'));
  ui.upgMythic.addEventListener('click', () => upgrade('Mythic'));
  ui.speedBtn.addEventListener('click', toggleSpeed);
  ui.waveBtn.addEventListener('click', startWave);
  ui.sellBtn.addEventListener('click', sellSelected);
  ui.mergeBtn.addEventListener('click', mergeSelected);
  ui.restart.addEventListener('click', restart);

  ui.missionsToggle.addEventListener('click', toggleMissionsPopup);
  ui.missionsClose.addEventListener('click', () => setMissionsPopup(false));
  document.addEventListener('click', (e) => {
    if (ui.missionsPopup.hidden) return;
    if (ui.missionsPopup.contains(e.target) || ui.missionsToggle.contains(e.target)) return;
    setMissionsPopup(false);
  });

  ui.canvas.addEventListener('mousedown', onMouseDown);
  ui.canvas.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

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
  ui.upgCommon.disabled   = game.gold < upgradeCostFor('Common') || game.gameOver;
  ui.upgEpic.disabled     = game.gold < upgradeCostFor('Epic')   || game.gameOver;
  ui.upgMythic.disabled   = game.gold < upgradeCostFor('Mythic') || game.gameOver;
  ui.waveBtn.disabled     = game.waveRunning || game.gameOver;
  ui.waveBtn.textContent  = game.waveRunning ? 'In Progress…' : `Start Wave ${game.wave}`;
  ui.waveBtn.classList.toggle('running', game.waveRunning);
  renderUnitInfo();
}

function renderUnitInfo() {
  const u = game.selectedUnit;
  if (!u) {
    ui.unitInfo.innerHTML = '<p class="hint">Click a unit on the board to inspect. Drag to reposition. Press <b>S</b> to summon, <b>Space</b> to start waves.</p>';
    ui.unitActions.hidden = true;
    return;
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

function setMissionsPopup(open) {
  ui.missionsPopup.hidden = !open;
  ui.missionsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function toggleMissionsPopup() {
  setMissionsPopup(ui.missionsPopup.hidden);
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
  game.victory = victory;
  ui.gameOver.hidden = false;
  ui.endTitle.textContent = victory ? 'Victory!' : 'Defeat';
  ui.endText.textContent  = victory
    ? `The codebase is secured. Wave ${game.wave} cleared.`
    : `The codebase is overrun on wave ${game.wave}.`;
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
  ui.gameOver.hidden = true;
  ui.logList.innerHTML = '';
  log('A new run begins. Build your guardians wisely!');
  renderMissions();
  updateUI();
}

/* === Bootstrap === */
function init() {
  setupUI();
  game.missions = makeMissions();
  renderMissions();
  updateUI();
  log('Welcome to Copilot Defence!');
  log('Bugs invade the codebase every wave. Summon, merge, and defend.');
  log('Tip: stand by the path with high-range Mythics for late-wave coverage.');
  game.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

init();
