let player = { 
    level: 1, exp: 0, nextLvlExp: 40, gold: 0, stage: 1, 
    tp: 0, stats: { hpBonus: 1.0, energyRegen: 1.0, critChance: 0.05 }
};

let squad = {
    knight: { name: "Рыцарь", hp: 100, maxHp: 100, baseDmg: 20, energy: 0, hired: true, art: "⚔️" },
    archer: { name: "Лучник", hp: 60, maxHp: 60, baseDmg: 15, energy: 0, hired: false, art: "🏹" },
    mage: { name: "Маг", hp: 50, maxHp: 50, baseDmg: 35, energy: 0, hired: false, art: "🔮" }
};

let inventory = [];
let enemy = { hp: 40, maxHp: 40, baseDmg: 5, name: "Волк", sprite: "🐺", isBoss: false };
let isCombatActive = false;
let autoBattle = false;
let gameSpeed = 2;

const delay = ms => new Promise(res => setTimeout(res, ms / gameSpeed));

// УЛЬТИМЕЙТЫ
async function useUltimate(id) {
    let char = squad[id];
    if (char.energy < 100) return;
    
    char.energy = 0;
    document.getElementById('skill-' + id).classList.add('hidden');
    addLog(`🔥 ${char.name} использует СУПЕРУДАР!`);

    if (id === 'knight') {
        let dmg = char.baseDmg * 2.5;
        enemy.hp -= dmg;
        char.hp = Math.min(char.maxHp * player.stats.hpBonus, char.hp + 30);
        createText('enemy-sprite', `КРИТ ${Math.floor(dmg)}`, 'dmg-red');
    } else if (id === 'archer') {
        enemy.hp -= char.baseDmg * 4;
        createText('enemy-sprite', `ЗАЛП ${char.baseDmg * 4}`, 'dmg-red');
    } else if (id === 'mage') {
        enemy.hp -= char.baseDmg * 5;
        document.getElementById('battle-arena').classList.add('shake');
        setTimeout(() => document.getElementById('battle-arena').classList.remove('shake'), 300);
    }
    updateUI();
}

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('tp').innerText = player.tp;
    document.getElementById('stage-display').innerText = player.stage;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";

    for (let id in squad) {
        let char = squad[id];
        if (char.hired) {
            document.getElementById('wrapper-' + id).classList.remove('hidden');
            let mHp = char.maxHp * player.stats.hpBonus;
            document.getElementById('hp-' + id).style.width = Math.max(0, (char.hp / mHp * 100)) + "%";
            document.getElementById('en-' + id).style.width = char.energy + "%";
            if (char.energy >= 100) document.getElementById('skill-' + id).classList.remove('hidden');
        }
    }

    document.getElementById('enemy-hp-fill').style.width = (enemy.hp / enemy.maxHp * 100) + "%";
    document.getElementById('enemy-hp-text').innerText = `${Math.floor(enemy.hp)} / ${Math.floor(enemy.maxHp)}`;
    updateLocation();
}

function updateLocation() {
    let arena = document.getElementById('battle-arena');
    let txt = document.getElementById('loc-text');
    arena.classList.remove('bg-forest', 'bg-cave', 'bg-castle');
    
    if (player.stage <= 10) { arena.classList.add('bg-forest'); txt.innerText = "Лес"; }
    else if (player.stage <= 20) { arena.classList.add('bg-cave'); txt.innerText = "Пещеры"; }
    else { arena.classList.add('bg-castle'); txt.innerText = "Замок"; }
}

function spawnEnemy() {
    let scale = Math.pow(1.08, player.stage - 1);
    let isBoss = player.stage % 10 === 0;
    
    if (isBoss) {
        enemy = { hp: 200 * scale, maxHp: 200 * scale, baseDmg: 12 * scale, name: "БОСС", sprite: "👹", isBoss: true };
        addLog("⚠️ Появился БОСС локации!");
    } else {
        let sprites = ["🐺", "🦇", "🕷️", "🐍", "🐗"];
        enemy = { hp: 40 * scale, maxHp: 40 * scale, baseDmg: 6 * scale, name: "Монстр", sprite: sprites[Math.floor(Math.random()*sprites.length)], isBoss: false };
    }
    document.getElementById('enemy-sprite').innerText = enemy.sprite;
    document.getElementById('enemy-name').innerText = enemy.name;
    updateUI();
}

async function startCombatLoop() {
    if (isCombatActive) return;
    isCombatActive = true;

    while (enemy.hp > 0 && isAnyAlive()) {
        for (let id in squad) {
            let char = squad[id];
            if (char.hired && char.hp > 0 && enemy.hp > 0) {
                // Атака игрока
                let dmg = char.baseDmg * (0.9 + Math.random() * 0.2);
                enemy.hp -= dmg;
                char.energy = Math.min(100, char.energy + (10 * player.stats.energyRegen));
                
                createText('enemy-sprite', `-${Math.floor(dmg)}`, 'dmg-red');
                await delay(400);
                updateUI();
            }
        }

        if (enemy.hp > 0 && isAnyAlive()) {
            // Атака врага
            let targets = Object.keys(squad).filter(k => squad[k].hired && squad[k].hp > 0);
            let targetId = targets[Math.floor(Math.random() * targets.length)];
            let eDmg = enemy.baseDmg * (0.8 + Math.random() * 0.4);
            
            squad[targetId].hp -= eDmg;
            createText('unit-' + targetId, `-${Math.floor(eDmg)}`, 'dmg-red');
            if (enemy.isBoss) {
                 document.getElementById('battle-arena').classList.add('shake');
                 setTimeout(() => document.getElementById('battle-arena').classList.remove('shake'), 200);
            }
            updateUI();
            await delay(500);
        }
    }

    isCombatActive = false;
    if (!isAnyAlive()) {
        addLog("💀 Отряд пал. Нужен отдых.");
        if (autoBattle) { await delay(2000); restSquad(); startCombatLoop(); }
    } else {
        winBattle();
    }
}

function winBattle() {
    let goldGain = enemy.isBoss ? 200 : 25 + (player.stage * 2);
    player.gold += goldGain;
    gainExp(enemy.isBoss ? 250 : 40);
    
    if (Math.random() < 0.15 || enemy.isBoss) dropLoot();
    
    player.stage++;
    addLog(`🏆 Победа! Этап ${player.stage}. +${goldGain}г`);
    spawnEnemy();
    if (autoBattle) setTimeout(startCombatLoop, 1000 / gameSpeed);
}

function dropLoot() {
    let arts = ["💍", "🧿", "🧤", "📿", "👑"];
    let art = arts[Math.floor(Math.random()*arts.length)];
    inventory.push(art);
    addLog(`🎁 Выпал артефакт: ${art}!`);
    renderInventory();
}

function renderInventory() {
    let list = document.getElementById('inventory-list');
    list.innerHTML = '';
    inventory.forEach(item => {
        let div = document.createElement('div');
        div.className = 'art-slot';
        div.innerText = item;
        list.appendChild(div);
    });
}

function gainExp(amt) {
    player.exp += amt;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp -= player.nextLvlExp;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.5);
        player.tp++;
        for (let id in squad) { squad[id].maxHp += 25; squad[id].baseDmg += 5; }
        addLog(`🌟 УРОВЕНЬ ПОВЫШЕН: ${player.level}!`);
    }
}

function restSquad() {
    for (let id in squad) if (squad[id].hired) squad[id].hp = squad[id].maxHp * player.stats.hpBonus;
    addLog("🛌 Отряд восстановил силы.");
    updateUI();
}

function isAnyAlive() { return Object.values(squad).some(c => c.hired && c.hp > 0); }

function createText(targetId, text, className) {
    let target = document.getElementById(targetId);
    let rect = target.getBoundingClientRect();
    let arena = document.getElementById('battle-arena').getBoundingClientRect();
    let el = document.createElement('div');
    el.className = `floating-text ${className}`;
    el.innerText = text;
    el.style.left = (rect.left - arena.left + 20) + 'px';
    el.style.top = (rect.top - arena.top) + 'px';
    document.getElementById('combat-text-layer').appendChild(el);
    setTimeout(() => el.remove(), 800 / gameSpeed);
}

function addLog(msg) {
    let log = document.getElementById('game-log');
    let div = document.createElement('div');
    div.innerText = "> " + msg;
    log.prepend(div);
}

// СИСТЕМНЫЕ ФУНКЦИИ
function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+id).classList.add('active');
    event.target.classList.add('active');
}
function toggleModal(id) { document.getElementById(id).classList.toggle('hidden'); }
function changeSpeed() { gameSpeed = parseFloat(document.getElementById('speed-select').value); }
function toggleAutoBattle() { autoBattle = document.getElementById('auto-battle-chk').checked; if (autoBattle) manualStartCombat(); }
function manualStartCombat() { if (!isCombatActive && isAnyAlive()) startCombatLoop(); }
function buyMerc(id, cost) { if (player.gold >= cost && !squad[id].hired) { player.gold -= cost; squad[id].hired = true; squad[id].hp = squad[id].maxHp; updateUI(); }}
function buyUpgrade(type, cost) { if (player.gold >= cost) { player.gold -= cost; for (let id in squad) { if (type === 'hp') squad[id].maxHp += 50; else squad[id].baseDmg += 10; } updateUI(); }}
function upgradeTalent(type) { if (player.tp > 0) { player.tp--; if (type === 'hpBonus') player.stats.hpBonus += 0.1; else player.stats.energyRegen += 0.1; updateUI(); }}

spawnEnemy();
updateUI();
