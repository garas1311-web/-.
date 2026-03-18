let player = {
    level: 1, exp: 0, nextLvlExp: 100,
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    strength: 10, magic: 10, endurance: 10, gold: 0,
    talentPoints: 0, huntCount: 0,
    rank: "Новичок", location: "Лес",
    inventory: { sword: false, staff: false, armor: false, plate: false },
    talents: { force: 0, arcane: 0, endurance: 0 },
    artifacts: [] // Максимум 10 ячеек
};

const ranksData = [
    { name: "Новичок", icon: "🌑", color: "#95a5a6" },
    { name: "Мастер", icon: "⚔️", color: "#3498db" },
    { name: "Мудрец", icon: "🔮", color: "#9b59b6" },
    { name: "Immortal", icon: "🔥", color: "#f1c40f" }
];

const locations = {
    "Лес": { danger: 15, loot: 15, exp: 35, enemies: ["🌲 Волк", "🌳 Энт"] },
    "Пещеры": { danger: 40, loot: 45, exp: 80, enemies: ["🦇 Мышь", "🕷️ Паук"] },
    "Замок": { danger: 75, loot: 120, exp: 180, enemies: ["🧛 Вампир", "💀 Скелет"] }
};

const artifactLibrary = [
    { name: "💍 Огонь", id: "art_str", s: 10, tier: 1 },
    { name: "📿 Мана", id: "art_mag", m: 10, tier: 1 },
    { name: "🛡️ Щит", id: "art_hp", h: 50, tier: 1 }
];

let isBusy = false;
let selectedArtifacts = []; // Для синтеза

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
    document.getElementById('stat-endurance').innerText = player.endurance;
    document.getElementById('location-name').innerText = "📍 " + player.location;
    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('battle-arena').className = "loc-" + player.location;
    document.getElementById('talent-points').innerText = player.talentPoints;
    document.getElementById('talent-points-display').innerText = player.talentPoints;

    // Ранг
    let rankIdx = Math.min(Math.floor(player.level / 5), ranksData.length - 1);
    let r = ranksData[rankIdx];
    document.getElementById('rank-name').innerText = r.name;
    document.getElementById('rank-icon').innerText = r.icon;

    // Кузница
    for (let key in player.inventory) {
        let el = document.getElementById(`item-${key}`);
        if (player.inventory[key] && el) {
            el.classList.add('owned');
            el.querySelector('button').innerText = "✅";
            el.querySelector('button').disabled = true;
        }
    }
}

function squadAttack(type) {
    if (isBusy) return;
    if (type === 'magic' && player.mp < 25) { addLog("❌ Нужно 25 маны!"); return; }
    
    isBusy = true;
    if (type === 'magic') player.mp -= 25;
    player.huntCount++;

    // Анимации отряда
    document.getElementById('unit-knight').classList.add('anim-slash');
    setTimeout(() => document.getElementById('unit-archer').classList.add('anim-shoot'), 100);
    setTimeout(() => document.getElementById('unit-mage').classList.add('anim-cast'), 200);

    setTimeout(() => {
        let loc = locations[player.location];
        let baseDmg = player.strength + (type === 'magic' ? player.magic * 1.5 : 5);
        let dmg = Math.floor(baseDmg * (0.8 + Math.random() * 0.4));
        let enemyName = loc.enemies[Math.floor(Math.random() * loc.enemies.length)];
        
        document.getElementById('game-container').classList.add('shake-screen');
        document.getElementById('enemy-sprite').classList.add('anim-hit');
        showDmg('enemy-damage', `-${dmg}`, 'dmg-red');

        setTimeout(() => {
            document.querySelectorAll('.unit').forEach(u => u.classList.remove('anim-slash', 'anim-shoot', 'anim-cast'));
            document.getElementById('enemy-sprite').classList.remove('anim-hit');
            document.getElementById('game-container').classList.remove('shake-screen');

            // Успех
            let loot = Math.floor(Math.random() * loc.loot + 10);
            player.gold += loot;
            gainExp(loc.exp);
            
            // Получение урона
            let danger = loc.danger / (player.inventory.armor ? 1.5 : 1) / (player.inventory.plate ? 2 : 1);
            player.hp -= Math.max(2, Math.floor(Math.random() * danger));
            
            addLog(`⚔️ ${enemyName} разбит! +${loot}💰`);
            
            if (player.hp <= 0) { player.hp = 20; player.gold = Math.floor(player.gold * 0.8); addLog("💀 Отряд разбит."); }
            if (player.huntCount % 3 === 0 && Math.random() > 0.3) dropArtifact(); // Шанс артефакта
            if (Math.random() > 0.8) triggerRandomEvent(); // Шанс события

            isBusy = false;
            updateUI();
        }, 300);
    }, 400); // Тайминг пока долетит меч/магия
}

// Утилиты урона и лога
function showDmg(id, text, cls) {
    let el = document.getElementById(id);
    el.innerText = text; el.className = `floating-text ${cls}`;
    void el.offsetWidth; el.style.animation = 'none';
    setTimeout(() => el.style.animation = '', 10);
}

function gainExp(a) {
    player.exp += a;
    if (player.exp >= player.nextLvlExp) {
        player.level++; player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.6);
        player.maxHp += 50; player.hp = player.maxHp;
        player.talentPoints += 1; // 1 очко таланта за уровень
        addLog(`🎉 УРОВЕНЬ ${player.level}! +1 очко навыков.`);
    }
}

function addLog(m) {
    const l = document.getElementById('game-log');
    let d = document.createElement('div'); d.innerText = "> " + m;
    l.prepend(d);
}

// Артефакты и Синтез
function dropArtifact() {
    if (player.artifacts.length >= 10) return;
    let a = artifactLibrary[Math.floor(Math.random()*artifactLibrary.length)];
    player.artifacts.push({...a}); // Клонируем
    applyStats(a);
    addLog(`💎 НАЙДЕН АРТЕФАКТ: ${a.name}!`);
}

function applyStats(item) {
    if (item.s) player.strength += item.s;
    if (item.m) player.magic += item.m;
    if (item.h) { player.maxHp += item.h; player.hp += item.h; }
}

function renderArtifacts() {
    const slots = document.querySelectorAll('#artifact-slots .art-slot');
    slots.forEach((s, i) => {
        s.innerHTML = ""; s.classList.remove('art-full', 'art-selected');
        s.onclick = null;
        if (player.artifacts[i]) {
            let art = player.artifacts[i];
            s.innerText = art.name.split(' ')[0]; // Эмодзи
            s.classList.add('art-full');
            s.title = art.name;
            if (selectedArtifacts.includes(i)) s.classList.add('art-selected');
            
            s.onclick = () => {
                if (selectedArtifacts.includes(i)) {
                    selectedArtifacts = selectedArtifacts.filter(id => id !== i);
                } else if (selectedArtifacts.length < 2) {
                    selectedArtifacts.push(i);
                }
                updateUI(); // Перерисовать с выделением
            };
        }
    });
}

function combineArtifacts() {
    if (selectedArtifacts.length !== 2) { addLog("❌ Выберите 2 ячейки!"); return; }
    let a1 = player.artifacts[selectedArtifacts[0]];
    let a2 = player.artifacts[selectedArtifacts[1]];

    if (a1.id !== a2.id || a1.tier >= 2) { addLog("❌ Синтез невозможен (нужны одинаковые Т1 предметы)."); selectedArtifacts = []; updateUI(); return; }

    // Успешный синтез Т2
    player.gold += 50; // Бонус
    let newArt = {...a1, name: a1.name + "+", tier: 2, s: (a1.s||0)*3, m: (a1.m||0)*3, h: (a1.h||0)*3};
    
    // Снять старые статы
    if(a1.s) player.strength -= a1.s; if(a1.h) player.maxHp -= a1.h;
    if(a2.s) player.strength -= a2.s; if(a2.h) player.maxHp -= a2.h;

    // Удалить старые, добавить новый
    player.artifacts = player.artifacts.filter((art, i) => !selectedArtifacts.includes(i));
    player.artifacts.push(newArt);
    applyStats(newArt);

    addLog(`🔥 УСПЕШНЫЙ СИНТЕЗ: ${newArt.name}!`);
    selectedArtifacts = []; updateUI();
}

// Таланты
function buyTalent(branch, level) {
    if (player.talentPoints < 1) { addLog("❌ Мало очков!"); return; }
    if (player.talents[branch] !== level - 1) { addLog("❌ Прошлый уровень не куплен!"); return; }

    player.talentPoints -= 1; player.talents[branch] = level;
    if (branch === 'force') player.strength += (level * 5);
    if (branch === 'arcane') player.magic += (level * 5);
    if (branch === 'endurance') { player.endurance += (level * 5); player.maxHp += 50; player.hp += 50; }

    addLog(`⭐ Изучен талан: ${branch} ${level}.`);
    updateUI(); renderTalentTree();
}

function renderTalentTree() {
    for (let branch in player.talents) {
        let level = player.talents[branch];
        for (let i = 1; i <= 2; i++) {
            let node = document.getElementById(`talent-${branch}-${i}`);
            if (node) {
                node.className = "talent-node locked";
                if (i <= level) node.classList.add('purchased');
                if (i === level + 1 && player.talentPoints > 0) node.classList.remove('locked');
            }
        }
    }
}

// Оверлеи
function showTalentTree() { document.getElementById('talent-overlay').classList.remove('hidden'); renderTalentTree(); }
function showFullInventory() { document.getElementById('inventory-overlay').classList.remove('hidden'); selectedArtifacts = []; renderArtifacts(); }
function closeOverlays() { document.querySelectorAll('.overlay').forEach(ov => ov.classList.add('hidden')); }

// Кузница/Магазин
function switchTab(t) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('tab-' + t).classList.add('active');
}
function buyItem(id, c) {
    if (player.gold >= c && !player.inventory[id]) {
        player.gold -= c; player.inventory[id] = true;
        if (id==='sword') player.strength += 20;
        if (id==='staff') player.magic += 25;
        if (id==='armor') player.maxHp += 80;
        if (id==='plate') player.maxHp += 200;
        addLog(`🛍️ Куплено: ${id}!`); updateUI();
    }
}

// Глобальные Квесты (События)
function triggerRandomEvent() {
    const evs = [
        { t: "Алтарь Силы", p: "Древний алтарь просит 100 золота в обмен на 10 Стр.", c1: "Да (100г)", c2: "Мимо", f: () => { if(player.gold>=100){player.gold-=100; player.strength+=10; return true;} } },
        { t: "Странный Маг", p: "Отдать всю ману за +15 магии навсегда?", c1: "Принять", c2: "Мимо", f: () => { if(player.mp>=40){player.mp=0; player.magic+=15; return true;} } },
        { t: "Пасхалка про Тедди", p: "Верный пес Тедди нашел заначку! Открыть?", c1: "Вскрыть", c2: "Нет", f: () => { player.gold+=150; return true; } }
    ];
    let e = evs[Math.floor(Math.random()*evs.length)];
    document.getElementById('event-title').innerText = e.t;
    document.getElementById('event-text').innerText = e.p;
    document.getElementById('choice-1').innerText = e.c1;
    document.getElementById('choice-2').innerText = e.c2;
    const ov = document.getElementById('event-overlay');
    ov.classList.remove('hidden');
    document.getElementById('choice-1').onclick = () => { if(e.f()) addLog(`🎲 Квест выполнен: ${e.t}`); ov.classList.add('hidden'); updateUI(); };
    document.getElementById('choice-2').onclick = () => { ov.classList.add('hidden'); };
}

// Утилиты
function changeLoc(n) { player.location = n; addLog(`📍 Локация: ${n}`); updateUI(); }
function rest() { if(player.gold>=10){player.gold-=10; player.hp=player.maxHp; player.mp=player.maxMp; addLog("🛌 Привал. Силы восстановлены."); updateUI();}else{addLog("❌ Мало золота.");} }

updateUI();
