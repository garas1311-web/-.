// Базовые статы игрока и отряда
let player = {
    level: 1, exp: 0, nextLvlExp: 100, gold: 0,
    hp: 100, maxHp: 100, baseDmg: 15,
    squad: ['knight'], // Кто куплен
    stage: 1
};

// Генерация врагов
let enemy = { hp: 50, maxHp: 50, dmg: 5, name: "Волк", sprite: "🐺", gold: 10, exp: 20 };

const normalSprites = ["🐺", "🦇", "🕷️", "🐍", "🐗"];
const miniBossSprites = ["👹", "🦍", "🧛", "🦂"];
const bossSprites = ["🐉", "🌋", "👁️‍🗨️", "💀"];

let isCombatActive = false;
const delay = ms => new Promise(res => setTimeout(res, ms));

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('hp').innerText = Math.max(0, Math.floor(player.hp));
    document.getElementById('max-hp').innerText = player.maxHp;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + "%";
    
    document.getElementById('stage-display').innerText = player.stage;
    document.getElementById('enemy-hp-fill').style.width = (enemy.hp / enemy.maxHp * 100) + "%";
    
    // Смена фона по этапам
    let arena = document.getElementById('battle-arena');
    let locText = document.getElementById('loc-text');
    if (player.stage > 30) { arena.className = "loc-Замок"; locText.innerText = "Замок"; }
    else if (player.stage > 15) { arena.className = "loc-Пещеры"; locText.innerText = "Пещеры"; }
    else { arena.className = "loc-Лес"; locText.innerText = "Лес"; }
}

function spawnEnemy() {
    let hpMultiplier = 1 + (player.stage * 0.2);
    let isSuperBoss = player.stage % 50 === 0;
    let isBoss = player.stage % 10 === 0;
    let isMiniBoss = player.stage % 5 === 0;

    if (isSuperBoss) {
        enemy = { hp: 1000 * hpMultiplier, maxHp: 1000 * hpMultiplier, dmg: 40 * hpMultiplier, name: "Император Тьмы", sprite: "👑💀", gold: 500, exp: 1000 };
    } else if (isBoss) {
        enemy = { hp: 300 * hpMultiplier, maxHp: 300 * hpMultiplier, dmg: 20 * hpMultiplier, name: "Босс Уровня", sprite: bossSprites[Math.floor(Math.random()*bossSprites.length)], gold: 150, exp: 300 };
    } else if (isMiniBoss) {
        enemy = { hp: 150 * hpMultiplier, maxHp: 150 * hpMultiplier, dmg: 12 * hpMultiplier, name: "Элитный Монстр", sprite: miniBossSprites[Math.floor(Math.random()*miniBossSprites.length)], gold: 50, exp: 100 };
    } else {
        enemy = { hp: 40 * hpMultiplier, maxHp: 40 * hpMultiplier, dmg: 5 * hpMultiplier, name: "Монстр", sprite: normalSprites[Math.floor(Math.random()*normalSprites.length)], gold: 15, exp: 30 };
    }

    document.getElementById('enemy-sprite').innerText = enemy.sprite;
    document.getElementById('enemy-name').innerText = enemy.name;
    
    // Делаем боссов визуально больше
    document.getElementById('enemy-sprite').style.fontSize = (isBoss || isSuperBoss) ? "110px" : "80px";
    updateUI();
}

function createFloatingText(targetId, text, className) {
    let target = document.getElementById(targetId);
    let rect = target.getBoundingClientRect();
    let arenaRect = document.getElementById('battle-arena').getBoundingClientRect();
    
    let el = document.createElement('div');
    el.className = `floating-text ${className}`;
    el.innerText = text;
    el.style.left = (rect.left - arenaRect.left + 20) + 'px';
    el.style.top = (rect.top - arenaRect.top) + 'px';
    
    document.getElementById('combat-text-layer').appendChild(el);
    setTimeout(() => el.remove(), 800);
}

// Главный цикл боя
async function startCombatLoop() {
    if (isCombatActive) return;
    if (player.hp <= 0) { addLog("❌ Отряд мертв. Нажмите 'Привал' для воскрешения."); return; }
    
    isCombatActive = true;
    document.getElementById('btn-adventure').disabled = true;
    addLog(`⚔️ Начат бой на Этапе ${player.stage}: ${enemy.name}`);

    while (player.hp > 0 && enemy.hp > 0) {
        // Ход Отряда
        for (let unitId of player.squad) {
            if (enemy.hp <= 0) break;
            
            let unitEl = document.getElementById('unit-' + unitId);
            let dmg = Math.floor(player.baseDmg * (0.8 + Math.random() * 0.4));
            
            // Анимации атаки в зависимости от класса
            if (unitId === 'knight') {
                unitEl.classList.add('anim-melee');
            } else if (unitId === 'archer') {
                unitEl.classList.add('anim-shoot');
                dmg = Math.floor(dmg * 0.8); // Лучник бьет слабее, но дополняет
            } else if (unitId === 'mage') {
                unitEl.classList.add('anim-cast');
                dmg = Math.floor(dmg * 1.5); // Маг бьет сильно
            }

            await delay(200); // Ждем пока анимация дойдет до цели
            enemy.hp -= dmg;
            document.getElementById('enemy-sprite').classList.add('anim-hit');
            createFloatingText('enemy-sprite', `-${dmg}`, 'dmg-red');
            updateUI();
            
            setTimeout(() => {
                unitEl.classList.remove('anim-melee', 'anim-shoot', 'anim-cast');
                document.getElementById('enemy-sprite').classList.remove('anim-hit');
            }, 300);

            await delay(500); // Пауза между ударами сопартийцев
        }

        // Ход Врага
        if (enemy.hp > 0 && player.hp > 0) {
            document.getElementById('enemy-sprite').classList.add('anim-enemy-attack');
            await delay(250);
            
            let eDmg = Math.floor(enemy.dmg * (0.8 + Math.random() * 0.4));
            player.hp -= eDmg;
            
            document.getElementById('squad-stage').classList.add('anim-hit');
            createFloatingText('unit-knight', `-${eDmg}`, 'dmg-red');
            updateUI();

            setTimeout(() => {
                document.getElementById('enemy-sprite').classList.remove('anim-enemy-attack');
                document.getElementById('squad-stage').classList.remove('anim-hit');
            }, 300);
            
            await delay(600);
        }
    }

    // Итоги боя
    if (player.hp <= 0) {
        addLog(`💀 Отряд разбит! Вы отступили.`);
    } else {
        addLog(`🏆 ${enemy.name} повержен! +${enemy.gold}г, +${enemy.exp} опыта.`);
        player.gold += enemy.gold;
        gainExp(enemy.exp);
        player.stage++;
        spawnEnemy();
    }

    document.getElementById('btn-adventure').disabled = false;
    isCombatActive = false;
    updateUI();
}

function gainExp(amount) {
    player.exp += amount;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.5);
        player.baseDmg += 5;
        player.maxHp += 20;
        player.hp = player.maxHp;
        addLog(`🌟 УРОВЕНЬ ПОВЫШЕН до ${player.level}! Характеристики выросли.`);
    }
}

function restSquad() {
    if (isCombatActive) { addLog("❌ Нельзя отдыхать во время боя!"); return; }
    if (player.hp >= player.maxHp) { addLog("ℹ️ Отряд и так полон сил."); return; }
    player.hp = player.maxHp;
    addLog("🛌 Отряд отдохнул. Здоровье восстановлено.");
    updateUI();
}

// Функции магазина
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    event.target.classList.add('active');
}

function buyItem(type, cost) {
    if (player.gold >= cost) {
        player.gold -= cost;
        if (type === 'dmg') player.baseDmg += 10;
        if (type === 'hp') { player.maxHp += 20; player.hp += 20; }
        addLog("🛒 Покупка успешна!");
        updateUI();
    } else {
        addLog("❌ Недостаточно золота!");
    }
}

function buyMerc(id, cost) {
    if (player.squad.includes(id)) return;
    if (player.gold >= cost) {
        player.gold -= cost;
        player.squad.push(id);
        document.getElementById('unit-' + id).classList.remove('hidden');
        document.getElementById('merc-' + id).classList.add('purchased');
        document.getElementById('merc-' + id).querySelector('button').innerText = "Нанят";
        addLog(`🤝 Нанят новый герой! Теперь он атакует в бою.`);
        updateUI();
    } else {
        addLog("❌ Недостаточно золота для найма!");
    }
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
