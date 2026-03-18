let player = {
    level: 1, exp: 0, nextLvlExp: 100,
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    strength: 10, magic: 10, gold: 0,
    rank: "Новичок", location: "Лес",
    inventory: { sword: false, staff: false, armor: false, plate: false }
};

const ranksData = [
    { name: "Новичок", icon: "🌑", color: "#95a5a6" },
    { name: "Мастер", icon: "⚔️", color: "#3498db" },
    { name: "Мудрец", icon: "🔮", color: "#9b59b6" },
    { name: "Immortal", icon: "🔥", color: "#f1c40f" }
];

const locations = {
    "Лес": { danger: 15, loot: 15, exp: 35, enemies: ["🐺 Волк", "🌳 Энт"] },
    "Пещеры": { danger: 40, loot: 45, exp: 80, enemies: ["🦇 Мышь", "🕷️ Паук"] },
    "Замок": { danger: 75, loot: 120, exp: 180, enemies: ["🧛 Вампир", "💀 Скелет"] }
};

let isBusy = false;

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
    document.getElementById('location-name').innerText = "📍 " + player.location;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('battle-arena').className = "loc-" + player.location;

    // Авто-прогрессия аватара и ранга
    let rankIdx = Math.min(Math.floor(player.level / 5), ranksData.length - 1);
    let currentRank = ranksData[rankIdx];
    document.getElementById('rank-name').innerText = currentRank.name;
    document.getElementById('rank-icon').innerText = currentRank.icon;
    
    // Меняем SVG аватарку
    document.getElementById('avatar-bg').setAttribute('fill', currentRank.color);
    document.getElementById('progression-avatar').style.borderColor = currentRank.color;

    checkInventory();
}

function squadAttack(type) {
    if (isBusy) return;
    let loc = locations[player.location];
    if (type === 'magic' && player.mp < 20) return;
    
    isBusy = true;
    if (type === 'magic') player.mp -= 20;

    // 1. Анимации отряда
    document.getElementById('unit-knight').classList.add('anim-slash');
    document.getElementById('unit-archer').classList.add('anim-shoot');
    document.getElementById('unit-mage').classList.add('anim-cast');

    setTimeout(() => {
        // 2. Урон по врагу
        let enemy = loc.enemies[Math.floor(Math.random() * loc.enemies.length)];
        let totalDmg = player.strength + (type === 'magic' ? player.magic : 5);
        
        document.getElementById('enemy-sprite').classList.add('anim-hit');
        showDmg('enemy-damage', `-${totalDmg}`, 'dmg-red');

        setTimeout(() => {
            document.getElementById('unit-knight').classList.remove('anim-slash');
            document.getElementById('unit-archer').classList.remove('anim-shoot');
            document.getElementById('unit-mage').classList.remove('anim-cast');
            document.getElementById('enemy-sprite').classList.remove('anim-hit');

            // 3. Результат
            let loot = Math.floor(Math.random() * loc.loot) + 10;
            player.gold += loot;
            player.hp -= Math.floor(Math.random() * loc.danger);
            gainExp(loc.exp);
            
            addLog(`⚔️ Отряд разбил ${enemy}! Получено ${loot}💰`);
            
            if (player.hp <= 0) { player.hp = 30; player.gold = Math.floor(player.gold * 0.8); addLog("💀 Отряд отступил с потерями."); }
            
            isBusy = false;
            updateUI();
        }, 400);
    }, 300);
}

function showDmg(id, text, cls) {
    let el = document.getElementById(id);
    el.innerText = text; el.className = `floating-text ${cls}`;
    void el.offsetWidth; el.style.animation = 'none';
    setTimeout(() => el.style.animation = '', 10);
}

function gainExp(amt) {
    player.exp += amt;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.6);
        player.maxHp += 40; player.hp = player.maxHp;
        addLog(`✨ Уровень повышен до ${player.level}!`);
    }
}

function changeLoc(n) { player.location = n; addLog(`📍 Переход в ${n}`); updateUI(); }

function buyItem(id, cost) {
    if (player.gold >= cost && !player.inventory[id]) {
        player.gold -= cost; player.inventory[id] = true;
        if (id === 'sword') player.strength += 20;
        if (id === 'staff') player.magic += 25;
        if (id === 'armor') player.maxHp += 80;
        if (id === 'plate') player.maxHp += 200;
        updateUI();
    }
}

function checkInventory() {
    for (let key in player.inventory) {
        let el = document.getElementById(`item-${key}`);
        if (player.inventory[key] && el) {
            el.classList.add('owned');
            el.querySelector('button').innerText = "✅";
        }
    }
}

function rest() { player.hp = player.maxHp; player.mp = player.maxMp; addLog("🛌 Отряд восстановил силы."); updateUI(); }

function lifeEvent() {
    const events = [
        "Тедди нашел заначку! +40 золота.",
        "Привал с друзьями. +30 HP.",
        "Разговор о работе вымотал мага. -20 MP."
    ];
    addLog(`🎲 ${events[Math.floor(Math.random()*events.length)]}`);
    updateUI();
}

function addLog(m) {
    const l = document.getElementById('game-log');
    let d = document.createElement('div'); d.innerText = "> " + m;
    l.prepend(d);
}

function switchTab(t) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('tab-' + t).classList.add('active');
}

updateUI();
