let player = {
    level: 1, exp: 0, nextLvlExp: 100,
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    strength: 10, magic: 10, gold: 0,
    rank: "Новичок", location: "Лес",
    kills: 0,
    inventory: { sword: false, staff: false, armor: false },
    quest: { target: 5, current: 0, rewardGold: 100, rewardExp: 200, active: true }
};

const ranks = ["Новичок", "Подмастерье", "Мастер", "Магистр", "Мудрец", "Immortal"];
const locations = {
    "Лес": { minLvl: 1, danger: 15, loot: 12, exp: 30 },
    "Пещеры": { minLvl: 5, danger: 35, loot: 35, exp: 70 },
    "Замок": { minLvl: 10, danger: 65, loot: 90, exp: 160 }
};

const monsters = {
    "Лес": ["🌲Волк", "🌲Гоблин", "🌲Слизень"],
    "Пещеры": ["🦇Летучая мышь", "🦇Тролль", "🦇Паук"],
    "Замок": ["🏰Рыцарь", "🏰Дракон", "🏰Вампир"]
};

function save() { localStorage.setItem('immortalVisualRPG', JSON.stringify(player)); }
function load() {
    const data = localStorage.getItem('immortalVisualRPG');
    if (data) { player = JSON.parse(data); updateUI(); }
}

setInterval(() => {
    if (player.hp < player.maxHp) player.hp = Math.min(player.hp + 2, player.maxHp);
    if (player.mp < player.maxMp) player.mp = Math.min(player.mp + 3, player.maxMp);
    updateUI();
}, 2000);

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('exp').innerText = player.exp;
    document.getElementById('next-lvl-exp').innerText = player.nextLvlExp;
    document.getElementById('hp').innerText = Math.floor(player.hp);
    document.getElementById('max-hp').innerText = player.maxHp;
    document.getElementById('mp').innerText = Math.floor(player.mp);
    document.getElementById('max-mp').innerText = player.maxMp;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('stat-strength').innerText = player.strength;
    document.getElementById('stat-magic').innerText = player.magic;
    document.getElementById('rank-name').innerText = player.rank;
    document.getElementById('location-name').innerText = "📍 " + player.location;

    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + "%";
    document.getElementById('mp-fill').style.width = (player.mp / player.maxMp * 100) + "%";

    updateQuestUI();
    checkItems();
    updateCharacterVisual(); // Обновить вид рыцаря
}

function updateQuestUI() {
    const q = player.quest;
    if (q.active) {
        document.getElementById('quest-info').innerText = `Квест: Победить монстров (${q.current}/${q.target})`;
        document.getElementById('quest-fill').style.width = (q.current / q.target * 100) + "%";
    } else {
        document.getElementById('quest-info').innerText = "Квесты выполнены!";
        document.getElementById('quest-fill').style.width = "0%";
    }
}

// НОВАЯ ФУНКЦИЯ: Обновление внешнего вида
function updateCharacterVisual() {
    const viewer = document.getElementById('character-viewer');
    if (player.inventory.sword) viewer.classList.add('has-sword');
    if (player.inventory.armor) viewer.classList.add('has-armor');
}

function checkItems() {
    if (player.inventory.sword) markOwned('item-sword');
    if (player.inventory.staff) markOwned('item-staff');
    if (player.inventory.armor) markOwned('item-armor');
}

function markOwned(id) {
    const el = document.getElementById(id);
    el.classList.add('owned');
    el.querySelector('button').innerText = "✅";
    el.querySelector('button').disabled = true;
}

function changeLoc(name) {
    if (player.level >= locations[name].minLvl) {
        player.location = name;
        addLog(`✈️ Вы перешли в локацию ${name}.`);
    } else {
        addLog(`⚠️ Слишком опасно! Нужен уровень ${locations[name].minLvl}.`);
    }
    updateUI();
}

function hunt(type) {
    let loc = locations[player.location];
    if (type === 'magic' && player.mp < 15) { addLog("❌ Недостаточно маны!"); return; }
    if (player.hp <= 25) { addLog("🩹 Вы слишком ранены! Отдохните."); return; }

    if (type === 'magic') player.mp -= 15;

    let isWin = Math.random() > 0.15; 
    let monsterList = monsters[player.location];
    let currentMonster = monsterList[Math.floor(Math.random() * monsterList.length)];

    if (isWin) {
        let dmg = type === 'magic' ? 5 : Math.floor(Math.random() * loc.danger);
        let bonus = player.inventory.sword ? 20 : 0;
        let goldLoot = Math.floor(Math.random() * loc.loot) + bonus;
        
        player.hp -= dmg;
        player.gold += goldLoot;
        
        if (player.quest.active) {
            player.quest.current++;
            if (player.quest.current >= player.quest.target) finishQuest();
        }

        addLog(`⚔️ Победа над ${currentMonster}! -${dmg} HP, +${goldLoot}💰`, 'log-win');
        gainExp(loc.exp);
    } else {
        player.hp -= 30;
        addLog(`🛡️ Вы отступили от ${currentMonster}! Монстр слишком сильный.`);
    }

    if (player.hp <= 0) {
        player.hp = 25; player.gold = Math.floor(player.gold * 0.7);
        addLog("💀 Поражение! Потеряно 30% золота.", 'log-lose');
    }
    updateUI();
}

function finishQuest() {
    player.gold += player.quest.rewardGold;
    gainExp(player.quest.rewardExp);
    addLog(`🎁 КВЕСТ ВЫПОЛНЕН! +${player.quest.rewardGold}💰`, 'log-quest');
    
    player.quest.target += 5;
    player.quest.current = 0;
    player.quest.rewardGold += 50;
    player.quest.rewardExp += 100;
}

function buyItem(item, cost) {
    if (player.gold >= cost) {
        player.gold -= cost;
        player.inventory[item] = true;
        if (item === 'sword') player.strength += 15;
        if (item === 'staff') player.magic += 15;
        if (item === 'armor') { player.maxHp += 50; player.hp += 50; }
        addLog(`🔨 Куплено!`);
        save(); updateUI();
    } else {
        addLog("💰 Мало золота!");
    }
}

function train() {
    if (player.hp < 20) { addLog("Сначала отдохните!"); return; }
    player.strength += 1; player.magic += 1;
    player.hp -= 10;
    addLog("🏋️ Тренировка: +1 СИЛ/МАГ.");
    gainExp(15);
}

function rest() {
    if (player.gold >= 10) {
        player.gold -= 10; player.hp = player.maxHp; player.mp = player.maxMp;
        addLog("🛌 Отдых в таверне.");
        save(); updateUI();
    }
}

function gainExp(amt) {
    player.exp += amt;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.6);
        player.maxHp += 25; player.maxMp += 15;
        player.hp = player.maxHp;
        player.rank = ranks[Math.min(Math.floor(player.level / 5), ranks.length - 1)];
        addLog(`🎉 НОВЫЙ УРОВЕНЬ: ${player.level}!`);
    }
    save(); updateUI();
}

function addLog(msg, className = '') {
    const log = document.getElementById('game-log');
    let span = document.createElement('div');
    if (className) span.classList.add(className);
    span.innerText = `> ${msg}`;
    log.prepend(span); 
}

load(); updateUI();
