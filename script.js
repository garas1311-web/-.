// Индивидуальные статы отряда
let squad = {
    knight: { name: "Рыцарь", hp: 100, maxHp: 100, baseDmg: 20, energy: 0, hired: true, artifact: null },
    archer: { name: "Лучник", hp: 60, maxHp: 60, baseDmg: 15, energy: 0, hired: false, artifact: null },
    mage: { name: "Маг", hp: 50, maxHp: 50, baseDmg: 30, energy: 0, hired: false, artifact: null }
};

let player = { level: 1, exp: 0, nextLvlExp: 40, gold: 0, stage: 1 };
let inventory = []; // Список ID полученных артефактов
let enemy = { hp: 40, maxHp: 40, baseDmg: 5, name: "Волк", sprite: "🐺", isBoss: false };

// База артефактов боссов
const artifactDB = {
    'fury_blade': { name: '⚔️ Клинок Ярости', desc: 'Рыцарь: 40% шанс ударить дважды', class: 'art-fury', target: 'knight' },
    'mirror_shield': { name: '🛡️ Щит Отражения', desc: 'Рыцарь: Отражает 10 урона при получении', class: 'art-mirror', target: 'knight' },
    'wind_bow': { name: '🌪️ Лук Ветров', desc: 'Лучник: Базовый урон +15', class: 'art-wind', target: 'archer' },
    'void_orb': { name: '🌌 Сфера Пустоты', desc: 'Маг: Энергия копится в 2 раза быстрее', class: 'art-void', target: 'mage' }
};

const normalSprites = ["🐺", "🦇", "🕷️", "🐍", "🐗"];
const bossSprites = ["🐉", "🌋", "👁️‍🗨️", "💀"];

let isCombatActive = false;
const delay = ms => new Promise(res => setTimeout(res, ms));

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('stage-display').innerText = player.stage;
    
    // Фоны
    let arena = document.getElementById('battle-arena');
    if (player.stage > 20) arena.className = "loc-Замок";
    else if (player.stage > 10) arena.className = "loc-Пещеры";
    else arena.className = "loc-Лес";

    // Обновление полосок героев
    let allDead = true;
    for (let id in squad) {
        let char = squad[id];
        if (char.hired) {
            document.getElementById('wrapper-' + id).classList.remove('hidden');
            let hpBar = document.getElementById('hp-' + id);
            let enBar = document.getElementById('en-' + id);
            
            hpBar.style.width = Math.max(0, (char.hp / char.maxHp * 100)) + "%";
            enBar.style.width = Math.min(100, char.energy) + "%";

            let unitEl = document.getElementById('unit-' + id);
            if (char.hp <= 0) {
                unitEl.classList.add('dead');
            } else {
                unitEl.classList.remove('dead');
                allDead = false;
            }
        }
    }

    document.getElementById('enemy-hp-fill').style.width = Math.max(0, (enemy.hp / enemy.maxHp * 100)) + "%";
    
    // Если все мертвы, блокируем кнопку
    document.getElementById('btn-adventure').disabled = allDead || isCombatActive;
}

function spawnEnemy() {
    let scale = Math.pow(1.15, player.stage - 1); // Экспоненциальный рост силы врагов
    let isBoss = player.stage % 10 === 0;

    if (isBoss) {
        enemy = { 
            hp: Math.floor(250 * scale), maxHp: Math.floor(250 * scale), 
            baseDmg: Math.floor(15 * scale), name: "БОСС: Владыка", 
            sprite: bossSprites[Math.floor(Math.random()*bossSprites.length)], isBoss: true 
        };
        document.getElementById('enemy-sprite').style.fontSize = "120px";
        addLog(`⚠️ ПОЯВИЛСЯ БОСС: ${enemy.name}!`);
    } else {
        enemy = { 
            hp: Math.floor(40 * scale), maxHp: Math.floor(40 * scale), 
            baseDmg: Math.floor(6 * scale), name: "Монстр", 
            sprite: normalSprites[Math.floor(Math.random()*normalSprites.length)], isBoss: false 
        };
        document.getElementById('enemy-sprite').style.fontSize = "80px";
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
    setTimeout(() => el.remove(), 1000);
}

// ГЛАВНЫЙ ЦИКЛ БОЯ
async function startCombatLoop() {
    if (isCombatActive) return;
    isCombatActive = true;
    updateUI();

    while (enemy.hp > 0 && isAnyAlive()) {
        // ХОД ИГРОКА
        for (let id in squad) {
            let char = squad[id];
            if (char.hired && char.hp > 0 && enemy.hp > 0) {
                let unitEl = document.getElementById('unit-' + id);
                let isSuper = char.energy >= 100;
                let dmg = char.baseDmg;

                // Пассивки артефактов
                if (char.artifact === 'wind_bow') dmg += 15;
                let attacks = (char.artifact === 'fury_blade' && Math.random() < 0.4 && !isSuper) ? 2 : 1;

                for (let i = 0; i < attacks; i++) {
                    if (enemy.hp <= 0) break;
                    
                    if (isSuper) {
                        // СУПЕРСПОСОБНОСТИ
                        unitEl.classList.add(`super-${id}`);
                        if (id === 'knight') { dmg *= 2.5; createText('unit-knight', "ЩИТ СВЕТА!", "heal-green"); char.hp = Math.min(char.maxHp, char.hp + 30); }
                        if (id === 'archer') { dmg *= 3; createText('unit-archer', "ГРАД СТРЕЛ!", "dmg-yellow"); }
                        if (id === 'mage') { dmg *= 4; createText('unit-mage', "МЕТЕОРИТ!", "dmg-yellow"); }
                        char.energy = 0;
                        await delay(600);
                    } else {
                        // ОБЫЧНАЯ АТАКА
                        if (id === 'knight') unitEl.classList.add('anim-melee');
                        else if (id === 'archer') unitEl.classList.add('anim-shoot');
                        else unitEl.classList.add('anim-cast');
                        
                        // Накопление энергии
                        let enGain = (id === 'mage' && char.artifact === 'void_orb') ? 40 : 25;
                        char.energy = Math.min(100, char.energy + enGain);
                        await delay(300);
                    }

                    // Нанесение урона врагу
                    let finalDmg = Math.floor(dmg * (0.8 + Math.random() * 0.4));
                    enemy.hp -= finalDmg;
                    document.getElementById('enemy-sprite').classList.add('anim-hit');
                    createText('enemy-sprite', `-${finalDmg}`, isSuper ? 'dmg-yellow' : 'dmg-red');
                    updateUI();

                    setTimeout(() => {
                        unitEl.classList.remove('anim-melee', 'anim-shoot', 'anim-cast', `super-${id}`);
                        document.getElementById('enemy-sprite').classList.remove('anim-hit');
                    }, 400);

                    await delay(500); // Пауза после удара
                }
            }
        }

        // ХОД ВРАГА
        if (enemy.hp > 0 && isAnyAlive()) {
            document.getElementById('enemy-sprite').classList.add('anim-enemy-attack');
            await delay(300);

            let eDmg = Math.floor(enemy.baseDmg * (0.8 + Math.random() * 0.4));
            
            // Логика Босса (АОЕ атака)
            if (enemy.isBoss && Math.random() < 0.3) {
                document.getElementById('enemy-sprite').classList.add('boss-aoe');
                addLog(`🔥 БОСС ПРИМЕНЯЕТ МАССОВЫЙ УДАР!`);
                for (let id in squad) {
                    if (squad[id].hired && squad[id].hp > 0) {
                        applyDamageTo(id, eDmg);
                    }
                }
            } else {
                // Обычная атака по случайной цели
                let aliveTargets = Object.keys(squad).filter(k => squad[k].hired && squad[k].hp > 0);
                let targetId = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
                applyDamageTo(targetId, eDmg);
            }

            document.getElementById('squad-stage').classList.add('anim-hit');
            updateUI();

            setTimeout(() => {
                document.getElementById('enemy-sprite').classList.remove('anim-enemy-attack', 'boss-aoe');
                document.getElementById('squad-stage').classList.remove('anim-hit');
            }, 400);
            
            await delay(600);
        }
    }

    // Итоги боя
    if (!isAnyAlive()) {
        addLog(`💀 Отряд разбит! Вы отступили. Нажмите Привал.`);
    } else {
        let goldDrop = enemy.isBoss ? 150 : Math.floor(15 * Math.pow(1.1, player.stage));
        let expDrop = enemy.isBoss ? 200 : Math.floor(25 * Math.pow(1.15, player.stage));
        addLog(`🏆 ${enemy.name} повержен! +${goldDrop}г, +${expDrop} опыта.`);
        player.gold += goldDrop;
        gainExp(expDrop);
        
        if (enemy.isBoss) dropArtifact();
        
        player.stage++;
        spawnEnemy();
    }

    isCombatActive = false;
    updateUI();
}

function applyDamageTo(id, dmg) {
    let char = squad[id];
    char.hp -= dmg;
    createText('unit-' + id, `-${dmg}`, 'dmg-red');
    char.energy = Math.min(100, char.energy + 15); // Энергия за получение урона
    
    // Артефакт Отражения
    if (char.artifact === 'mirror_shield' && enemy.hp > 0) {
        createText('unit-knight', "БЛОК!", "heal-green");
        enemy.hp -= 10;
        createText('enemy-sprite', "-10", 'dmg-red');
    }
}

function isAnyAlive() {
    return Object.values(squad).some(char => char.hired && char.hp > 0);
}

// НОВАЯ КРИВАЯ ОПЫТА (Усложняется с уровнями)
function gainExp(amount) {
    player.exp += amount;
    while (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp -= player.nextLvlExp;
        // Экспоненциальный рост нужного опыта
        player.nextLvlExp = Math.floor(40 * Math.pow(1.4, player.level - 1));
        
        for(let id in squad) {
            squad[id].maxHp += 10;
            squad[id].baseDmg += 3;
            if(squad[id].hired) squad[id].hp = squad[id].maxHp;
        }
        addLog(`🌟 УРОВЕНЬ ПОВЫШЕН до ${player.level}! Все характеристики возросли.`);
    }
}

function restSquad() {
    if (isCombatActive) return;
    for (let id in squad) { if(squad[id].hired) squad[id].hp = squad[id].maxHp; }
    addLog("🛌 Отряд воскрешен и полностью исцелен.");
    updateUI();
}

// ЛУТ С БОССОВ
function dropArtifact() {
    let possibleDrops = Object.keys(artifactDB).filter(id => !inventory.includes(id));
    if (possibleDrops.length > 0 && Math.random() < 0.6) { // 60% шанс дропа
        let artId = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];
        inventory.push(artId);
        addLog(`🎁 ИЗ БОССА ВЫПАЛ АРТЕФАКТ: ${artifactDB[artId].name}! Зайдите в Инвентарь.`);
        renderInventory();
    }
}

// ИНВЕНТАРЬ И ЭКИПИРОВКА
function toggleInventory() {
    document.getElementById('inventory-modal').classList.toggle('hidden');
    renderInventory();
}

function renderInventory() {
    let list = document.getElementById('inventory-list');
    list.innerHTML = "";
    if (inventory.length === 0) {
        list.innerHTML = "<p style='color:#777'>Пусто. Убивайте боссов.</p>"; return;
    }
    
    inventory.forEach(id => {
        let art = artifactDB[id];
        let targetChar = squad[art.target];
        let isEquipped = targetChar.artifact === id;
        
        let div = document.createElement('div');
        div.className = 'art-card';
        div.innerHTML = `
            <div class="art-title">${art.name}</div>
            <div class="art-desc">${art.desc}</div>
            <button style="width:100%; background: ${isEquipped ? '#27ae60' : '#2980b9'}" 
                onclick="equipArtifact('${id}', '${art.target}')" ${!targetChar.hired ? 'disabled' : ''}>
                ${!targetChar.hired ? 'Герой не нанят' : (isEquipped ? 'Снять' : 'Надеть на ' + targetChar.name)}
            </button>
        `;
        list.appendChild(div);
    });
}

function equipArtifact(artId, targetId) {
    let char = squad[targetId];
    // Снимаем старое
    if (char.artifact) {
        document.querySelector(`#unit-${targetId} .${artifactDB[char.artifact].class}`).classList.add('hidden');
    }
    
    // Если нажали на то же самое - снимаем, иначе надеваем новое
    if (char.artifact === artId) {
        char.artifact = null;
    } else {
        char.artifact = artId;
        document.querySelector(`#unit-${targetId} .${artifactDB[artId].class}`).classList.remove('hidden');
    }
    renderInventory();
    addLog(`🎒 Снаряжение отряда изменено.`);
}

// МАГАЗИН
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
            if (type === 'dmg') squad[id].baseDmg += 5;
            if (type === 'hp') { squad[id].maxHp += 20; if(squad[id].hp>0) squad[id].hp += 20; }
        }
        addLog("🛒 Все герои усилены!");
        updateUI();
    } else addLog("❌ Мало золота!");
}

function buyMerc(id, cost) {
    if (squad[id].hired) return;
    if (player.gold >= cost) {
        player.gold -= cost;
        squad[id].hired = true;
        squad[id].hp = squad[id].maxHp;
        document.getElementById('merc-' + id).classList.add('purchased');
        addLog(`🤝 Нанят ${squad[id].name}!`);
        updateUI();
        renderInventory();
    } else addLog("❌ Мало золота!");
}

function addLog(text) {
    let log = document.getElementById('game-log');
    let d = document.createElement('div');
    d.innerText = "> " + text;
    log.prepend(d);
}

// Инициализация
spawnEnemy();
updateUI();
