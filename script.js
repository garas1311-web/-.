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
    inventory: {
        sword: false
    }
};

// Обновленная функция UI
function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('exp').innerText = player.exp;
    document.getElementById('next-lvl-exp').innerText = player.nextLvlExp;
    document.getElementById('stat-strength').innerText = player.strength;
    document.getElementById('stat-magic').innerText = player.magic;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('rank-name').innerText = player.rank;
    
    // HP
    document.getElementById('hp').innerText = player.hp;
    document.getElementById('max-hp').innerText = player.maxHp;
    document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + "%";
    
    // Опыт
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";

    // Состояние магазина
    if(player.inventory.sword) {
        document.getElementById('buy-sword').innerText = "Куплено";
        document.getElementById('buy-sword').disabled = true;
    }
}

// Охота с риском
function hunt() {
    if (player.hp <= 10) {
        addLog("Вы слишком слабы для охоты! Нужно отдохнуть.");
        return;
    }

    let damage = Math.floor(Math.random() * 20); // Получаем урон
    player.hp -= damage;
    
    let bonus = player.inventory.sword ? 10 : 0; // Бонус от меча
    let earnedGold = Math.floor(Math.random() * 15) + 5 + bonus;
    
    player.gold += earnedGold;
    addLog(`В бою вы потеряли ${damage} HP, но добыли ${earnedGold} золота!`);
    
    gainExp(40);
    saveGame();
}

// Отдых
function rest() {
    if (player.gold >= 5) {
        player.gold -= 5;
        player.hp = Math.min(player.hp + 20, player.maxHp);
        addLog("Вы отдохнули в таверне. +20 HP.");
        updateUI();
        saveGame();
    } else {
        addLog("Недостаточно золота для отдыха!");
    }
}

// Покупка
function buyItem(item, price) {
    if (player.gold >= price && !player.inventory[item]) {
        player.gold -= price;
        player.inventory[item] = true;
        player.strength += 5; // Меч дает постоянный буст к силе
        addLog(`Вы купили ${item}! Сила увеличена.`);
        updateUI();
        saveGame();
    } else {
        addLog("Не хватает золота!");
    }
}

// --- ЛОГИКА ИГРЫ ---

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('exp').innerText = player.exp;
    document.getElementById('next-lvl-exp').innerText = player.nextLvlExp;
    document.getElementById('stat-strength').innerText = player.strength;
    document.getElementById('stat-magic').innerText = player.magic;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('rank-name').innerText = player.rank;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
}

function train(type) {
    if (type === 'strength') player.strength++;
    else player.magic++;
    addLog(`Вы тренируете ${type === 'strength' ? 'силу' : 'магию'}.`);
    gainExp(20);
    saveGame(); // Сохраняем после тренировки
}

function hunt() {
    let earnedGold = Math.floor(Math.random() * 10) + 5;
    player.gold += earnedGold;
    addLog(`Вы победили слабого монстра и нашли ${earnedGold} золотых!`);
    gainExp(40);
    saveGame(); // Сохраняем после охоты
}

function gainExp(amount) {
    player.exp += amount;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.5);
        updateRank();
        addLog("Уровень повышен! Ваш ранг растет.");
    }
    updateUI();
}

function updateRank() {
    let rankIndex = Math.min(Math.floor(player.level / 5), ranks.length - 1);
    player.rank = ranks[rankIndex];
}

function addLog(message) {
    const log = document.getElementById('game-log');
    log.innerHTML = `> ${message}<br>` + log.innerHTML;
}

// Инициализация при запуске
loadGame(); 
updateUI();
