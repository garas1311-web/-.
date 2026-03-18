let player = {
    level: 1, exp: 0, nextLvlExp: 100,
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    strength: 10, magic: 10, gold: 0,
    rank: "Новичок", location: "Лес",
    inventory: { sword: false, staff: false, armor: false }
};

const ranks = ["Новичок", "Подмастерье", "Мастер", "Магистр", "Мудрец", "Immortal"];
const locations = {
    "Лес": { minLvl: 1, danger: 15, loot: 10, exp: 25 },
    "Пещеры": { minLvl: 5, danger: 35, loot: 30, exp: 60 },
    "Замок": { minLvl: 10, danger: 60, loot: 80, exp: 150 }
};

function save() { localStorage.setItem('immortalSave', JSON.stringify(player)); }
function load() {
    const data = localStorage.getItem('immortalSave');
    if (data) { player = JSON.parse(data); updateUI(); }
}

// Регенерация каждые 2 сек
setInterval(() => {
    if (player.hp < player.maxHp) player.hp = Math.min(player.hp + 2, player.maxHp);
    if (player.mp < player.maxMp) player.mp = Math.min(player.mp + 3, player.maxMp);
    updateUI();
}, 2000);

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('exp').innerText = player.exp;
    document.getElementById('next-lvl-exp').innerText = player.nextLvlExp;
    document.getElementById('hp').innerText = player.hp;
    document.getElementById('max-hp').innerText = player.maxHp;
    document.getElementById('mp').innerText = player.mp;
    document.getElementById('max-mp').innerText = player.maxMp;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('stat-strength').innerText = player.strength;
    document.getElementById('stat-magic').innerText = player.magic;
    document.getElementById('rank-name').innerText = player.rank;
    document.getElementById('location-name').innerText = "Локация: " + player.location;

    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + "%";
    document.getElementById('mp-fill').style.width = (player.mp / player.maxMp * 100) + "%";

    checkOwned('sword', 'buy-sword');
    checkOwned('staff', 'buy-staff');
    checkOwned('armor', 'buy-armor');
}

function checkOwned(id, btnId) {
    if(player.inventory[id]) {
        document.getElementById(btnId).innerText = "Есть";
        document.getElementById(btnId).disabled = true;
    }
}

function changeLoc(name) {
    if (player.level >= locations[name].minLvl) {
        player.location = name;
        addLog(`Вы отправились в ${name}.`);
    } else {
        addLog(`Нужен уровень ${locations[name].minLvl}!`);
    }
    updateUI();
}

function hunt(type) {
    let loc = locations[player.location];
    
    if (type === 'magic') {
        if (player.mp < 10) { addLog("Мана пуста!"); return; }
        player.mp -= 10;
    } else if (player.hp <= 20) {
        addLog("Слишком мало здоровья!"); return;
    }

    let event = Math.random();
    if (event > 0.9) {
        player.gold += 50; addLog("🍀 Нашли тайник! +50 золота.");
    } else {
        let dmg = type === 'magic' ? 5 : Math.floor(Math.random() * loc.danger);
        let bonus = player.inventory.sword ? 15 : 0;
        let goldFound = Math.floor(Math.random() * loc.loot) + bonus;
        
        player.hp -= dmg;
        player.gold += goldFound;
        addLog(`Бой в ${player.location}: -${dmg} HP, +${goldFound}г.`);
    }

    if (player.hp <= 0) {
        player.hp = 20; player.gold = Math.floor(player.gold / 2);
        addLog("💀 Поражение! Потеряна часть золота.");
    }
    gainExp(loc.exp);
}

function buyItem(item, cost) {
    if (player.gold >= cost) {
        player.gold -= cost;
        player.inventory[item] = true;
        if (item === 'sword') player.strength += 10;
        if (item === 'staff') player.magic += 10;
        if (item === 'armor') { player.maxHp += 50; player.hp += 50; }
        addLog(`Куплено: ${item}!`);
        save(); updateUI();
    }
}

function train() {
    player.strength += 1; player.magic += 1;
    addLog("Тренировка: Сила и Магия +1.");
    gainExp(10);
}

function rest() {
    if (player.gold >= 10) {
        player.gold -= 10; player.hp = player.maxHp; player.mp = player.maxMp;
        addLog("Вы отдохнули. Силы восстановлены!");
        save(); updateUI();
    }
}

function gainExp(amt) {
    player.exp += amt;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.5);
        player.maxHp += 20; player.maxMp += 10;
        player.rank = ranks[Math.min(Math.floor(player.level / 5), ranks.length - 1)];
        addLog(`⭐ Уровень повышен! Новый ранг: ${player.rank}`);
    }
    save(); updateUI();
}

function addLog(msg) {
    const log = document.getElementById('game-log');
    log.innerHTML = `<div>> ${msg}</div>` + log.innerHTML;
}

load(); updateUI();
