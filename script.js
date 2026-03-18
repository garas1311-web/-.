let player = {
    level: 1,
    exp: 0,
    nextLvlExp: 100,
    strength: 10,
    magic: 10,
    gold: 0,
    rank: "Новичок"
};

const ranks = ["Новичок", "Подмастерье", "Мастер", "Магистр", "Immortal"];

// --- ФУНКЦИИ СОХРАНЕНИЯ ---

function saveGame() {
    localStorage.setItem('fantasyRPG_save', JSON.stringify(player));
}

function loadGame() {
    const savedData = localStorage.getItem('fantasyRPG_save');
    if (savedData) {
        player = JSON.parse(savedData);
        updateUI();
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
