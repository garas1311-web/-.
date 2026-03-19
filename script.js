let player = { 
    level: 1, exp: 0, nextLvlExp: 40, gold: 0, stage: 1, 
    talentPoints: 0,
    stats: { critChance: 0.05, critDmgMult: 1.5, vampirism: 0, dodge: 0.05, comboChance: 0.15, hpBonusMult: 1 }
};

let squad = {
    knight: { name: "Рыцарь", hp: 100, maxHp: 100, baseDmg: 20, energy: 0, hired: true, artifact: null },
    archer: { name: "Лучник", hp: 60, maxHp: 60, baseDmg: 15, energy: 0, hired: false, artifact: null },
    mage: { name: "Маг", hp: 50, maxHp: 50, baseDmg: 30, energy: 0, hired: false, artifact: null }
};

let inventory = [];
let enemy = { hp: 40, maxHp: 40, baseDmg: 5, name: "Волк", sprite: "🐺", isBoss: false };
let isCombatActive = false;
let autoBattle = false;
let gameSpeed = 2;
let godMode = false;

const delay = ms => new Promise(res => setTimeout(res, ms / gameSpeed));

// Управление скоростью
function changeSpeed() {
    gameSpeed = parseFloat(document.getElementById('speed-select').value);
    document.documentElement.style.setProperty('--speed', gameSpeed);
}

// Режим бога
function toggleGodMode() {
    godMode = document.getElementById('god-mode-chk').checked;
    if (godMode) { player.gold = 999999; player.talentPoints = 999; addLog("👑 God Mode активирован"); }
    updateUI();
}

function toggleAutoBattle() {
    autoBattle = document.getElementById('auto-battle-chk').checked;
    if (autoBattle && !isCombatActive) manualStartCombat();
}

// ПОКАЗ СТАТОВ
function showStats(id) {
    let char = squad[id];
    if (!char.hired) return;
    let tooltip = document.getElementById('tooltip');
    let actualMaxHp = Math.floor(char.maxHp * player.stats.hpBonusMult);
    let totalDmg = char.baseDmg + (char.artifact === 'wind_bow' ? 20 : 0);
    
    tooltip.innerHTML = `
        <strong>${char.name}</strong><br>
        ❤️ HP: ${Math.floor(char.hp)} / ${actualMaxHp}<br>
        ⚔️ Урон: ${totalDmg}<br>
        ⚡ Энергия: ${char.energy}/100
    `;
    tooltip.classList.remove('hidden');
}

function hideStats() { document.getElementById('tooltip').classList.add('hidden'); }

document.addEventListener('mousemove', (e) => {
    let tooltip = document.getElementById('tooltip');
    if (!tooltip.classList.contains('hidden')) {
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
    }
});

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('tp').innerText = player.talentPoints;
    document.getElementById('tp-display').innerText = player.talentPoints;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('stage-display').innerText = player.stage;
    
    for (let id in squad) {
        let char = squad[id];
        if (char.hired) {
            document.getElementById('wrapper-' + id).classList.remove('hidden');
            let mHp = char.maxHp * player.stats.hpBonusMult;
            document.getElementById('hp-' + id).style.width = Math.max(0, (char.hp / mHp * 100)) + "%";
            document.getElementById('en-' + id).style.width = char.energy + "%";
            if (char.hp <= 0) document.getElementById('unit-' + id).classList.add('dead');
            else document.getElementById('unit-' + id).classList.remove('dead');
        }
    }
    document.getElementById('enemy-hp-fill').style.width = (enemy.hp / enemy.maxHp * 100) + "%";
}

// НОВЫЙ БАЛАНС (Мягкий скейлинг 1.08)
function spawnEnemy() {
    let scale = Math.pow(1.08, player.stage - 1);
    let isBoss = player.stage % 10 === 0;

    if (isBoss) {
        enemy = { hp: Math.floor(180 * scale), maxHp: Math.floor(180 * scale), baseDmg: Math.floor(14 * scale), name: "БОСС", sprite: "👹", isBoss: true };
        document.getElementById('boss-dialogue').innerText = "Вам не пройти дальше!";
        document.getElementById('boss-dialogue').classList.remove('hidden');
    } else {
        enemy = { hp: Math.floor(35 * scale), maxHp: Math.floor(35 * scale), baseDmg: Math.floor(5 * scale), name: "Монстр", sprite: "🐺", isBoss: false };
        document.getElementById('boss-dialogue').classList.add('hidden');
    }
    document.getElementById('enemy-sprite').innerText = enemy.sprite;
    updateUI();
}

async function manualStartCombat() { if (!isCombatActive && isAnyAlive()) startCombatLoop(); }

// ЦИКЛИЧНЫЙ АВТОБОЙ
async function startCombatLoop() {
    if (isCombatActive) return;
    isCombatActive = true;
    
    while (enemy.hp > 0 && isAnyAlive()) {
        for (let id in squad) {
            let char = squad[id];
            if (char.hired && char.hp > 0 && enemy.hp > 0) {
                let unitEl = document.getElementById('unit-' + id);
                unitEl.classList.add('anim-melee');
                
                let dmg = Math.floor(char.baseDmg * (0.9 + Math.random() * 0.2));
                if (Math.random() < player.stats.critChance) dmg *= player.stats.critDmgMult;
                
                enemy.hp -= dmg;
                createText('enemy-sprite', `-${Math.floor(dmg)}`, 'dmg-red');
                document.getElementById('enemy-sprite').classList.add('anim-hit');
                
                await delay(400);
                unitEl.classList.remove('anim-melee');
                document.getElementById('enemy-sprite').classList.remove('anim-hit');
                updateUI();
            }
        }

        if (enemy.hp > 0 && isAnyAlive()) {
            let targets = Object.keys(squad).filter(k => squad[k].hired && squad[k].hp > 0);
            let targetId = targets[Math.floor(Math.random() * targets.length)];
            let eDmg = Math.floor(enemy.baseDmg * (0.8 + Math.random() * 0.4));
            
            if (Math.random() > player.stats.dodge) {
                squad[targetId].hp -= eDmg;
                createText('unit-' + targetId, `-${eDmg}`, 'dmg-red');
            } else {
                createText('unit-' + targetId, `МИМО!`, 'heal-green');
            }
            updateUI();
            await delay(500);
        }
    }

    isCombatActive = false;

    if (!isAnyAlive()) {
        addLog("💀 Поражение...");
        if (autoBattle) { await delay(2000); restSquad(); startCombatLoop(); }
    } else {
        addLog(`✅ Этап ${player.stage} пройден!`);
        player.gold += enemy.isBoss ? 150 : 20;
        gainExp(enemy.isBoss ? 200 : 35);
        player.stage++;
        spawnEnemy();
        if (autoBattle) { await delay(1000); startCombatLoop(); }
    }
}

function gainExp(amount) {
    player.exp += amount;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp -= player.nextLvlExp;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.4);
        player.talentPoints++;
        for (let id in squad) {
            squad[id].maxHp += 20;
            squad[id].baseDmg += 5;
            if (squad[id].hired) squad[id].hp = squad[id].maxHp * player.stats.hpBonusMult;
        }
        addLog(`🌟 УРОВЕНЬ ${player.level}! Сила и ОЗ выросли.`);
    }
}

function restSquad() {
    for (let id in squad) if (squad[id].hired) squad[id].hp = squad[id].maxHp * player.stats.hpBonusMult;
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
    setTimeout(() => el.remove(), 700 / gameSpeed);
}

function addLog(t) {
    let log = document.getElementById('game-log');
    let d = document.createElement('div');
    d.innerText = "> " + t;
    log.prepend(d);
}

// Заглушки для функций талантов и магазина (остаются из прошлого кода)
function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+id).classList.add('active');
    event.target.classList.add('active');
}
function buyMerc(id, cost) {
    if (player.gold >= cost && !squad[id].hired) {
        player.gold -= cost; squad[id].hired = true; squad[id].hp = squad[id].maxHp;
        updateUI();
    }
}
function toggleModal(id) { document.getElementById(id).classList.toggle('hidden'); }
function buyUpgrade(t, c) { if(player.gold >= c) { player.gold -= c; for(let i in squad) { if(t==='dmg') squad[i].baseDmg+=10; else squad[i].maxHp+=50; } updateUI(); }}
function buyAttribute(t, c) { if(player.gold >= c) { player.gold -= c; if(t==='vamp') player.stats.vampirism+=0.02; if(t==='crit') player.stats.critChance+=0.02; updateUI(); }}
function upgradeTalent(t) { if(player.talentPoints > 0) { player.talentPoints--; if(t==='hpBonus') player.stats.hpBonusMult+=0.05; updateUI(); }}

spawnEnemy();
updateUI();
