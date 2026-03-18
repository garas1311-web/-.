// Состояние игрока
let player = {
    level: 1,
    exp: 0,
    nextLvlExp: 100,
    hp: 100,
    maxHp: 100,
    strength: 10,
    magic: 10,
    gold: 0,
    rank: "Новичок",
    inventory: { sword: false }
};

const ranks = ["Новичок", "Подмастерье", "Мастер", "Магистр", "Immortal"];

// Сохранение и загрузка
function save() { localStorage.setItem('heroSave', JSON.stringify(player)); }
function load() {
    const data = localStorage.getItem('heroSave');
    if (data) {
        player = JSON.parse(data);
        updateUI();
    }
}

// Регенерация HP (1 HP каждые 2 секунды)
setInterval(() => {
    if (player.hp < player.maxHp) {
        player.hp = Math.min(player.hp + 1, player.maxHp);
        updateUI();
    }
}, 2000);

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('exp').innerText = player.exp;
    document.getElementById('next-lvl-exp').innerText = player.nextLvlExp;
    document.getElementById('hp').innerText = player.hp;
    document.getElementById('max-hp').innerText = player.maxHp;
    document.getElementById('stat-strength').innerText = player.strength;
    document.getElementById('stat-magic').innerText = player.magic;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('rank-name').innerText = player.rank;

    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + "%";

    const swordBtn = document.getElementById('buy-sword');
    if(player.inventory.sword) {
        swordBtn.innerText = "Владеете";
        swordBtn.disabled = true;
    }
}

function train(type) {
    if (type === 'strength') player.strength++;
    else player.magic++;
    addLog(`Тренировка завершена. ${type === 'strength' ? 'Сила' : 'Магия'} +1.`);
    gainExp(15);
}

function hunt() {
    if (player.hp <= 20) {
        addLog("Вы слишком ранены для охоты! Отдохните.");
        return;
    }

    // Шанс на случайное событие (20%)
    let chance = Math.random();
    if (chance > 0.8) {
        let foundGold = 30;
        player.gold += foundGold;
        addLog(`✨ Вы нашли сундук странника! +${foundGold} золота.`);
    } else {
        let damage = Math.floor(Math.random() * 25) + 5;
        let loot = Math.floor(Math.random() * 10) + 5 + (player.inventory.sword ? 10 : 0);
        player.hp -= damage;
        player.gold += loot;
        addLog(`Бой с гоблином: -${damage} HP, +${loot} золота.`);
    }

    gainExp(35);
    if (player.hp <= 0) {
        player.hp = 10;
        player.gold = Math.floor(player.gold / 2);
        addLog("💀 Вы потеряли сознание и часть золота! Добрые люди спасли вас.");
    }
}

function rest() {
    if (player.gold >= 5) {
        player.gold -= 5;
        player.hp = player.maxHp;
        addLog("Вы сладко выспались в таверне. HP полностью восстановлено.");
        updateUI();
        save();
    } else {
        addLog("Не хватает золота на ночлег.");
    }
}

function buyItem(item, cost) {
    if (player.gold >= cost && !player.inventory[item]) {
        player.gold -= cost;
        player.inventory[item] = true;
        if(item === 'sword') player.strength += 10;
        addLog("Вы купили Меч! Теперь охота приносит больше золота.");
        updateUI();
        save();
    } else {
        addLog("Недостаточно средств.");
    }
}

function gainExp(amt) {
    player.exp += amt;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.6);
        player.maxHp += 10;
        player.hp = player.maxHp;
        
        let rankIdx = Math.min(Math.floor(player.level / 5), ranks.length - 1);
        player.rank = ranks[rankIdx];
        
        addLog(`🎊 Уровень ${player.level} достигнут! Ранг: ${player.rank}.`);
    }
    updateUI();
    save();
}

function addLog(msg) {
    const log = document.getElementById('game-log');
    log.innerHTML = `<div>> ${msg}</div>` + log.innerHTML;
}

// Старт
load();
updateUI();
