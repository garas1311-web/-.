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
    addLog(`Вы усердно тренируетесь. ${type === 'strength' ? 'Сила' : 'Магия'} выросла!`);
    gainExp(20);
}

function gainExp(amount) {
    player.exp += amount;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.5);
        updateRank();
        addLog("Уровень повышен! Вы стали сильнее.");
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

// Инициализация
updateUI();
