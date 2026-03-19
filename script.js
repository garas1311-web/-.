// Глобальные статы и управление
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

const artifactDB = {
    'fury_blade': { name: '⚔️ Клинок Ярости', desc: 'Рыцарь: 40% шанс двойного удара', class: 'art-fury', target: 'knight' },
    'mirror_shield': { name: '🛡️ Щит Отражения', desc: 'Рыцарь: Отражает 10 урона', class: 'art-mirror', target: 'knight' },
    'wind_bow': { name: '🌪️ Лук Ветров', desc: 'Лучник: Базовый урон +20', class: 'art-wind', target: 'archer' },
    'void_orb': { name: '🌌 Сфера Пустоты', desc: 'Маг: Быстрый набор энергии', class: 'art-void', target: 'mage' }
};

const bossDialogues = [
    "Жалкие смертные, ваш путь заканчивается здесь!",
    "Вы осмелились бросить вызов Бессмертным?",
    "Моя сила безгранична, а ваши жизни - лишь пыль!",
    "Я поглощу ваши души!"
];

let isCombatActive = false;
let autoBattle = false;
let gameSpeed = 1;
let godMode = false;

// Измененный delay под ползунок скорости
const delay = ms => new Promise(res => setTimeout(res, ms / gameSpeed));

function changeSpeed() {
    gameSpeed = parseFloat(document.getElementById('speed-select').value);
    document.documentElement.style.setProperty('--speed', gameSpeed);
}

function toggleGodMode() {
    godMode = document.getElementById('god-mode-chk').checked;
    if (godMode) {
        player.gold = 999999;
        player.talentPoints = 999;
        addLog("👑 Включен РЕЖИМ БОГА. Ресурсы бесконечны.");
    }
    updateUI();
}

function toggleAutoBattle() {
    autoBattle = document.getElementById('auto-battle-chk').checked;
    if (autoBattle && !isCombatActive && isAnyAlive()) manualStartCombat();
}

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('tp').innerText = player.talentPoints;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('stage-display').innerText = player.stage;
    
    let arena = document.getElementById('battle-arena');
    if (player.stage > 20) arena.className = "loc-Замок";
    else if (player.stage > 10) arena.className = "loc-Пещеры";
    else arena.className = "loc-Лес";

    let allDead = true;
    for (let id in squad) {
        let char = squad[id];
        if (char.hired) {
            document.getElementById('wrapper-' + id).classList.remove('hidden');
            let actualMaxHp = char.maxHp * player.stats.hpBonusMult;
            document.getElementById('hp-' + id).style.width = Math.max(0, (char.hp / actualMaxHp * 100)) + "%";
            document.getElementById('en-' + id).style.width = Math.min(100, char.energy) + "%";
            let unitEl = document.getElementById('unit-' + id);
            
            if (char.hp <= 0) unitEl.classList.add('dead');
            else { unitEl.classList.remove('dead'); allDead = false; }
        }
    }
    document.getElementById('enemy-hp-fill').style.width = Math.max(0, (enemy.hp / enemy.maxHp * 100)) + "%";
    document.getElementById('btn-adventure').disabled = allDead || isCombatActive || autoBattle;
}

function spawnEnemy() {
    let scale = Math.pow(1.15, player.stage - 1);
    let isBoss = player.stage % 10 === 0;

    let bossBox = document.getElementById('boss-dialogue');
    if (isBoss) {
        enemy = { hp: Math.floor(250 * scale), maxHp: Math.floor(250 * scale), baseDmg: Math.floor(18 * scale), name: "БОСС: Владыка", sprite: ["🐉","🌋","👁️‍🗨️","💀"][Math.floor(Math.random()*4)], isBoss: true };
        document.getElementById('enemy-sprite').style.fontSize = "120px";
        bossBox.innerText = `"${bossDialogues[Math.floor(Math.random() * bossDialogues.length)]}"`;
        bossBox.classList.remove('hidden');
    } else {
        enemy = { hp: Math.floor(40 * scale), maxHp: Math.floor(40 * scale), baseDmg: Math.floor(6 * scale), name: "Монстр", sprite: ["🐺","🦇","🕷️","🐍","🐗"][Math.floor(Math.random()*5)], isBoss: false };
        document.getElementById('enemy-sprite').style.fontSize = "80px";
        bossBox.classList.add('hidden');
    }
    document.getElementById('enemy-sprite').innerText = enemy.sprite;
    document.getElementById('enemy-name').innerText = enemy.name;
    updateUI();
}

function createText(targetId, text, className) {
    let target = document.getElementById(targetId);
    if(!target) return;
    let rect = target.getBoundingClientRect();
    let arenaRect = document.getElementById('battle-arena').getBoundingClientRect();
    let el = document.createElement('div');
    el.className = `floating-text ${className}`;
    el.innerText = text;
    el.style.left = (rect.left - arenaRect.left + 20) + 'px';
    el.style.top = (rect.top - arenaRect.top) + 'px';
    document.getElementById('combat-text-layer').appendChild(el);
    setTimeout(() => el.remove(), 1000 / gameSpeed);
}

function manualStartCombat() {
    if (!isCombatActive) startCombatLoop();
}

async function startCombatLoop() {
    isCombatActive = true;
    document.getElementById('boss-dialogue').classList.add('hidden'); // Прячем диалог после старта
    updateUI();

    while (enemy.hp > 0 && isAnyAlive()) {
        // ХОД ИГРОКА
        for (let id in squad) {
            let char = squad[id];
            if (char.hired && char.hp > 0 && enemy.hp > 0) {
                let unitEl = document.getElementById('unit-' + id);
                let isSuper = char.energy >= 100;
                let dmg = char.baseDmg;

                if (char.artifact === 'wind_bow') dmg += 20;
                let attacks = (char.artifact === 'fury_blade' && Math.random() < 0.4 && !isSuper) ? 2 : 1;

                // ПРОВЕРКА КОМБО (если обычная атака рыцаря и есть другие)
                let comboProc = false;
                if (id === 'knight' && !isSuper && Math.random() < player.stats.comboChance) {
                    if (squad.archer.hired && squad.archer.hp > 0 && squad.mage.hired && squad.mage.hp > 0) {
                        dmg *= 3.5; comboProc = true; createText('unit-knight', "✨ ТРОЙНОЙ УДАР!", "dmg-combo");
                        document.getElementById('unit-archer').classList.add('anim-shoot');
                        document.getElementById('unit-mage').classList.add('anim-cast');
                    } else if (squad.archer.hired && squad.archer.hp > 0) {
                        dmg *= 2; comboProc = true; createText('unit-knight', "⚔️🏹 ПРОНЗАЮЩИЙ ШКВАЛ!", "dmg-combo");
                        document.getElementById('unit-archer').classList.add('anim-shoot');
                    } else if (squad.mage.hired && squad.mage.hp > 0) {
                        dmg *= 2.5; comboProc = true; createText('unit-knight', "⚔️🔮 МАГИЧЕСКИЙ КЛИНОК!", "dmg-combo");
                        document.getElementById('unit-mage').classList.add('anim-cast');
                    }
                }

                for (let i = 0; i < attacks; i++) {
                    if (enemy.hp <= 0) break;
                    
                    if (isSuper) {
                        unitEl.classList.add(`super-${id}`);
                        if (id === 'knight') { dmg *= 2.5; char.hp = Math.min(char.maxHp * player.stats.hpBonusMult, char.hp + 40); }
                        if (id === 'archer') dmg *= 3;
                        if (id === 'mage') dmg *= 4;
                        char.energy = 0;
                        await delay(600);
                    } else {
                        if (id === 'knight') unitEl.classList.add('anim-melee');
                        else if (id === 'archer') unitEl.classList.add('anim-shoot');
                        else unitEl.classList.add('anim-cast');
                        char.energy = Math.min(100, char.energy + ((id==='mage' && char.artifact==='void_orb') ? 40 : 25));
                        await delay(300);
                    }

                    // Атрибуты (Крит и Вампиризм)
                    let isCrit = Math.random() < player.stats.critChance;
                    let finalDmg = Math.floor(dmg * (0.8 + Math.random() * 0.4));
                    if (isCrit) finalDmg = Math.floor(finalDmg * player.stats.critDmgMult);
                    
                    enemy.hp -= finalDmg;
                    
                    // Вампиризм
                    if (player.stats.vampirism > 0) {
                        let heal = Math.floor(finalDmg * player.stats.vampirism);
                        if (heal > 0) {
                            char.hp = Math.min(char.maxHp * player.stats.hpBonusMult, char.hp + heal);
                            createText('unit-' + id, `+${heal}`, 'heal-green');
                        }
                    }

                    document.getElementById('enemy-sprite').classList.add('anim-hit');
                    createText('enemy-sprite', `-${finalDmg}`, isCrit ? 'dmg-crit' : (isSuper ? 'dmg-yellow' : 'dmg-red'));
                    updateUI();

                    setTimeout(() => {
                        unitEl.classList.remove('anim-melee', 'anim-shoot', 'anim-cast', `super-${id}`);
                        document.getElementById('enemy-sprite').classList.remove('anim-hit');
                    }, 400 / gameSpeed);

                    await delay(500);
                }
                
                if (comboProc) {
                    setTimeout(() => {
                        document.getElementById('unit-archer').classList.remove('anim-shoot');
                        document.getElementById('unit-mage').classList.remove('anim-cast');
                    }, 400 / gameSpeed);
                }
            }
        }

        // ХОД ВРАГА
        if (enemy.hp > 0 && isAnyAlive()) {
            document.getElementById('enemy-sprite').classList.add('anim-enemy-attack');
            await delay(300);
            let eDmg = Math.floor(enemy.baseDmg * (0.8 + Math.random() * 0.4));
            
            if (enemy.isBoss && Math.random() < 0.3) {
                document.getElementById('enemy-sprite').classList.add('boss-aoe');
                for (let id in squad) { if (squad[id].hired && squad[id].hp > 0) applyDamageTo(id, eDmg); }
            } else {
                let aliveTargets = Object.keys(squad).filter(k => squad[k].hired && squad[k].hp > 0);
                applyDamageTo(aliveTargets[Math.floor(Math.random() * aliveTargets.length)], eDmg);
            }

            document.getElementById('squad-stage').classList.add('anim-hit');
            updateUI();
            setTimeout(() => {
                document.getElementById('enemy-sprite').classList.remove('anim-enemy-attack', 'boss-aoe');
                document.getElementById('squad-stage').classList.remove('anim-hit');
            }, 400 / gameSpeed);
            await delay(600);
        }
    }

    if (!isAnyAlive()) {
        addLog(`💀 Отряд разбит! Вы отступили.`);
        if (autoBattle) { await delay(1500); restSquad(); manualStartCombat(); } // Авто-воскрешение
    } else {
        let goldDrop = enemy.isBoss ? 200 : Math.floor(20 * Math.pow(1.1, player.stage));
        let expDrop = enemy.isBoss ? 300 : Math.floor(30 * Math.pow(1.15, player.stage));
        player.gold += goldDrop;
        gainExp(expDrop);
        if (enemy.isBoss) dropArtifact();
        player.stage++;
        spawnEnemy();
        
        if (autoBattle) { await delay(1000); manualStartCombat(); }
    }

    isCombatActive = false;
    updateUI();
}

function applyDamageTo(id, dmg) {
    let char = squad[id];
    // Уклонение
    if (Math.random() < player.stats.dodge) {
        createText('unit-' + id, "ПРОМАХ!", "heal-green");
        document.getElementById('unit-' + id).classList.add('anim-dodge');
        setTimeout(() => document.getElementById('unit-' + id).classList.remove('anim-dodge'), 300/gameSpeed);
        return;
    }

    char.hp -= dmg;
    createText('unit-' + id, `-${dmg}`, 'dmg-red');
    char.energy = Math.min(100, char.energy + 15);
    
    if (char.artifact === 'mirror_shield' && enemy.hp > 0) {
        enemy.hp -= 10;
        createText('enemy-sprite', "-10", 'dmg-red');
    }
}

function isAnyAlive() { return Object.values(squad).some(char => char.hired && char.hp > 0); }

function gainExp(amount) {
    player.exp += amount;
    while (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp -= player.nextLvlExp;
        player.nextLvlExp = Math.floor(40 * Math.pow(1.4, player.level - 1));
        player.talentPoints++; // ОЧКИ ТАЛАНТОВ
        
        // ДИНАМИЧЕСКИЙ СКЕЙЛИНГ ХАРАКТЕРИСТИК (Масштабируется от уровня)
        for(let id in squad) {
            squad[id].maxHp += 15 + Math.floor(player.level * 2);
            squad[id].baseDmg += 4 + Math.floor(player.level * 1.2);
            if(squad[id].hired) squad[id].hp = squad[id].maxHp * player.stats.hpBonusMult;
        }
        addLog(`🌟 УРОВЕНЬ ПОВЫШЕН до ${player.level}! +1 Очко талантов.`);
    }
}

function restSquad() {
    if (isCombatActive) return;
    for (let id in squad) { if(squad[id].hired) squad[id].hp = squad[id].maxHp * player.stats.hpBonusMult; }
    addLog("🛌 Отряд исцелен.");
    updateUI();
}

// Таланты
function upgradeTalent(type) {
    if (player.talentPoints > 0) {
        player.talentPoints--;
        if (type === 'critDmg') { player.stats.critDmgMult += 0.05; document.getElementById('stat-critDmg').innerText = Math.round((player.stats.critDmgMult - 1.5)*100); }
        if (type === 'combo') { player.stats.comboChance += 0.03; document.getElementById('stat-combo').innerText = Math.round((player.stats.comboChance - 0.15)*100); }
        if (type === 'hpBonus') { 
            player.stats.hpBonusMult += 0.05; 
            document.getElementById('stat-hpBonus').innerText = Math.round((player.stats.hpBonusMult - 1)*100);
            for(let id in squad) { if(squad[id].hired) squad[id].hp += squad[id].maxHp * 0.05; } // Лечим на размер прибавки
        }
        updateUI();
    } else addLog("❌ Нет очков талантов!");
}

// Магазин
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    event.target.classList.add('active');
}

function buyUpgrade(type, cost) {
    if (player.gold >= cost) {
        player.gold -= cost;
        for(let id in squad) {
            if (type === 'dmg') squad[id].baseDmg += 10;
            if (type === 'hp') { squad[id].maxHp += 50; if(squad[id].hp>0) squad[id].hp += 50; }
        }
        updateUI();
    } else addLog("❌ Мало золота!");
}

function buyAttribute(type, cost) {
    if (player.gold >= cost) {
        player.gold -= cost;
        if (type === 'vamp') player.stats.vampirism += 0.02;
        if (type === 'crit') player.stats.critChance += 0.02;
        if (type === 'dodge') player.stats.dodge += 0.02;
        addLog(`🛒 Атрибут прокачан!`);
        updateUI();
    } else addLog("❌ Мало золота!");
}

function buyMerc(id, cost) {
    if (squad[id].hired) return;
    if (player.gold >= cost) {
        player.gold -= cost;
        squad[id].hired = true;
        squad[id].hp = squad[id].maxHp * player.stats.hpBonusMult;
        document.getElementById('merc-' + id).classList.add('purchased');
        updateUI();
    }
}

// Артефакты
function dropArtifact() {
    let possibleDrops = Object.keys(artifactDB).filter(id => !inventory.includes(id));
    if (possibleDrops.length > 0 && Math.random() < 0.7) {
        let artId = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];
        inventory.push(artId);
        addLog(`🎁 ВЫПАЛ АРТЕФАКТ: ${artifactDB[artId].name}!`);
        renderInventory();
    }
}

function toggleModal(id) { document.getElementById(id).classList.toggle('hidden'); if(id === 'inventory-modal') renderInventory(); }

function renderInventory() {
    let list = document.getElementById('inventory-list');
    list.innerHTML = "";
    if (inventory.length === 0) { list.innerHTML = "<p style='color:#777'>Пусто. Убивайте боссов.</p>"; return; }
    inventory.forEach(id => {
        let art = artifactDB[id];
        let targetChar = squad[art.target];
        let isEquipped = targetChar.artifact === id;
        let div = document.createElement('div');
        div.className = 'art-card';
        div.innerHTML = `<div class="art-title">${art.name}</div><div class="art-desc">${art.desc}</div>
            <button style="width:100%; background: ${isEquipped ? '#27ae60' : '#2980b9'}" onclick="equipArtifact('${id}', '${art.target}')" ${!targetChar.hired ? 'disabled' : ''}>
                ${!targetChar.hired ? 'Герой не нанят' : (isEquipped ? 'Снять' : 'Надеть на ' + targetChar.name)}
            </button>`;
        list.appendChild(div);
    });
}

function equipArtifact(artId, targetId) {
    let char = squad[targetId];
    if (char.artifact) document.querySelector(`#unit-${targetId} .${artifactDB[char.artifact].class}`).classList.add('hidden');
    if (char.artifact === artId) char.artifact = null;
    else { char.artifact = artId; document.querySelector(`#unit-${targetId} .${artifactDB[artId].class}`).classList.remove('hidden'); }
    renderInventory();
}

function addLog(text) {
    let log = document.getElementById('game-log');
    let d = document.createElement('div');
    d.innerText = "> " + text;
    log.prepend(d);
}

spawnEnemy();
updateUI();
<div id="tooltip" class="hidden"></div>
<div class="unit-wrapper" id="wrapper-knight" onmouseover="showStats('knight')" onmouseout="hideStats()">
...
