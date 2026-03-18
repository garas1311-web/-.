let player = {
    level: 1, exp: 0, nextLvlExp: 100,
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    strength: 10, magic: 10, endurance: 10, gold: 0,
    talentPoints: 0,
    rank: "Новичок", location: "Лес",
    inventory: { sword: false, staff: false, armor: false, plate: false },
    talents: { force: 0, arcane: 0, endurance: 0 },
    artifacts: [] // Максимум 5 ячеек
};

const ranksData = [
    { name: "Новичок", icon: "🌑", color: "#95a5a6" },
    { name: "Мастер", icon: "⚔️", color: "#3498db" },
    { name: "Мудрец", icon: "🔮", color: "#9b59b6" },
    { name: "Immortal", icon: "🔥", color: "#f1c40f" }
];

const locations = {
    "Лес": { danger: 15, loot: 15, exp: 35, enemies: ["🐺 Волк", "🌳 Энт"] },
    "Peщеры": { danger: 40, loot: 45, exp: 80, enemies: ["🦇 Мышь", "🕷️ Паук"] },
    "Замок": { danger: 75, loot: 120, exp: 180, enemies: ["🧛 Вампир", "💀 Скелет"] }
};

let isBusy = false;
let selectedArts = []; // Для синтеза

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('hp').innerText = Math.floor(player.hp);
    document.getElementById('mp').innerText = Math.floor(player.mp);
    document.getElementById('stat-strength').innerText = player.strength;
    document.getElementById('talent-points').innerText = player.talentPoints;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('battle-arena').className = "loc-" + player.location;

    // Авто-ранг
    let rankIdx = Math.min(Math.floor(player.level / 5), ranksData.length - 1);
    document.getElementById('rank-name').innerText = ranksData[rankIdx].name;
    document.getElementById('rank-icon').innerText = ranksData[rankIdx].icon;
    
    // Кузница
    for (let key in player.inventory) {
        if (player.inventory[key]) document.getElementById('item-'+key)?.classList.add('owned');
    }
}

function squadAttack(type) {
    if (isBusy) return;
    if (type === 'magic' && player.mp < 25) { addLog("❌ Мало маны!"); return; }
    
    isBusy = true;
    const knightSprite = document.querySelector('.sprite-layer');
    
    // 1. Анимация Атаки Мечника
    knightSprite.className = "sprite-layer knight-attack";
    
    // 2. Анимации остальных (SVG, через 100мс)
    setTimeout(() => {
        document.getElementById('unit-archer').classList.add('anim-shoot');
        document.getElementById('unit-mage').classList.add('anim-cast');
        if(type === 'magic') player.mp -= 25;
    }, 100);

    // 3. Расчет результата (через 400мс)
    setTimeout(() => {
        let loc = locations[player.location];
        let dmg = player.strength + (type === 'magic' ? player.magic : 5);
        let enemy = loc.enemies[Math.floor(Math.random() * loc.enemies.length)];
        
        document.getElementById('game-container').classList.add('shake-screen');
        document.getElementById('enemy-sprite').classList.add('anim-hit');
        showDmg('enemy-damage', `-${dmg}`, 'dmg-red');

        addLog(`⚔️ Отряд атаковал ${enemy}!`);

        player.gold += Math.floor(Math.random() * loc.loot) + 10;
        player.hp -= Math.floor(Math.random() * loc.danger);
        gainExp(loc.exp);

        if(Math.random() > 0.8) dropArt(); // Шанс артефакта

        // Сброс анимаций и тряски
        setTimeout(() => {
            knightSprite.className = "sprite-layer knight-idle"; // Назад в покой
            document.querySelectorAll('.unit').forEach(u => u.classList.remove('anim-shoot', 'anim-cast'));
            document.getElementById('enemy-sprite').classList.remove('anim-hit');
            document.getElementById('game-container').classList.remove('shake-screen');
            isBusy = false;
            updateUI();
        }, 300);
    }, 400); // Ждем пока долетит меч
}

function gainExp(a) {
    player.exp += a;
    if (player.exp >= player.nextLvlExp) {
        player.level++; player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.5);
        player.talentPoints++;
        addLog("✨ УРОВЕНЬ ПОВЫШЕН!");
    }
}

function dropArt() {
    if(player.artifacts.length >= 5) return;
    player.artifacts.push("💍");
    player.strength += 5;
    addLog("💎 Найден артефакт!");
}

function showDmg(id, text, cls) {
    let el = document.getElementById(id);
    el.innerText = text; el.className = `floating-text ${cls}`;
    void el.offsetWidth; el.style.animation = 'none';
    setTimeout(() => el.style.animation = '', 10);
}

function addLog(m) {
    const l = document.getElementById('game-log');
    let d = document.createElement('div'); d.innerText = "> " + m;
    l.prepend(d);
}

updateUI();
