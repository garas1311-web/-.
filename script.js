let player = {
    level: 1, exp: 0, nextLvlExp: 100,
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    strength: 10, magic: 10, endurance: 10, gold: 0,
    talentPoints: 0,
    location: "Лес",
    inventory: { sword: false, staff: false, armor: false },
    artifacts: [], talents: { force: 0, arcane: 0, endurance: 0 }
};

const locations = {
    "Лес": { danger: 15, loot: 15, exp: 35, enemies: ["🌲 Волк", "🌳 Энт"] },
    "Пещеры": { danger: 40, loot: 45, exp: 80, enemies: ["🦇 Мышь", "🕷️ Паук"] },
    "Замок": { danger: 75, loot: 120, exp: 180, enemies: ["🧛 Вампир", "💀 Скелет"] }
};

let isBusy = false;
let selectedArts = [];

function updateUI() {
    document.getElementById('level').innerText = player.level;
    document.getElementById('gold').innerText = player.gold;
    document.getElementById('hp').innerText = Math.floor(player.hp);
    document.getElementById('mp').innerText = Math.floor(player.mp);
    document.getElementById('stat-strength').innerText = player.strength;
    document.getElementById('stat-magic').innerText = player.magic;
    document.getElementById('talent-points').innerText = player.talentPoints;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('battle-arena').className = "loc-" + player.location;
    
    // Обновление кнопок в кузнице
    for(let item in player.inventory) {
        if(player.inventory[item]) document.getElementById('item-'+item)?.classList.add('owned');
    }
}

function squadAttack(type) {
    if (isBusy) return;
    if (type === 'magic' && player.mp < 25) { addLog("❌ Мало маны!"); return; }
    
    isBusy = true;
    const knightSprite = document.querySelector('.sprite-layer');
    
    // 1. Анимация Атаки Мечника
    knightSprite.className = "sprite-layer knight-attack";
    
    // 2. Анимации остальных (через 100мс)
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
        addLog(`⚔️ ${enemy} повержен!`);

        player.gold += Math.floor(Math.random() * loc.loot) + 10;
        player.hp -= Math.floor(Math.random() * loc.danger);
        gainExp(loc.exp);

        if(Math.random() > 0.8) dropArt();

        // Сброс анимаций
        setTimeout(() => {
            knightSprite.className = "sprite-layer knight-idle";
            document.querySelectorAll('.unit').forEach(u => u.classList.remove('anim-shoot', 'anim-cast'));
            document.getElementById('game-container').classList.remove('shake-screen');
            isBusy = false;
            updateUI();
        }, 300);
    }, 400);
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
    const art = { name: "💍", s: 5 };
    player.artifacts.push(art);
    player.strength += art.s;
    addLog("💎 Найден артефакт!");
}

function buyItem(id, c) {
    if(player.gold >= c && !player.inventory[id]) {
        player.gold -= c; player.inventory[id] = true;
        if(id === 'sword') player.strength += 20;
        updateUI();
    }
}

function addLog(m) {
    const l = document.getElementById('game-log');
    let d = document.createElement('div'); d.innerText = "> " + m;
    l.prepend(d);
}

// Утилиты окон
function showTalentTree() { 
    document.getElementById('talent-overlay').classList.remove('hidden'); 
    document.getElementById('talent-points-display').innerText = player.talentPoints;
}
function showFullInventory() { 
    document.getElementById('inventory-overlay').classList.remove('hidden'); 
    renderArts();
}
function closeOverlays() { document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden')); }

function renderArts() {
    const slots = document.querySelectorAll('.art-slot');
    slots.forEach((s, i) => {
        s.innerHTML = ""; s.className = "art-slot";
        if(player.artifacts[i]) {
            s.innerText = player.artifacts[i].name;
            s.classList.add('art-full');
            s.onclick = () => { s.classList.toggle('art-selected'); };
        }
    });
}

function changeLoc(n) { player.location = n; updateUI(); }
function rest() { player.hp = player.maxHp; player.mp = player.maxMp; updateUI(); }
function switchTab(t) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + t).classList.add('active');
}

updateUI();
