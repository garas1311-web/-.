let player = {
    level: 1, exp: 0, nextLvlExp: 100,
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    strength: 10, magic: 10, gold: 0,
    rank: "Новичок", location: "Лес",
    inventory: { sword: false, staff: false, armor: false, plate: false },
    artifacts: []
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

    let rankIdx = Math.min(Math.floor(player.level / 5), ranksData.length - 1);
    let r = ranksData[rankIdx];
    document.getElementById('rank-name').innerText = r.name;
    document.getElementById('rank-icon').innerText = r.icon;
    document.getElementById('avatar-bg').setAttribute('fill', r.color);
    
    if (player.level >= 5) document.getElementById('avatar-core').setAttribute('d', 'M25 5 L45 25 L25 45 L5 25 Z');
    if (player.level >= 10) document.getElementById('avatar-core').setAttribute('d', 'M25 5 L30 20 L45 25 L30 30 L25 45 L20 30 L5 25 L20 20 Z');

    for (let key in player.inventory) {
        let el = document.getElementById(`item-${key}`);
        if (player.inventory[key] && el) {
            el.classList.add('owned');
            el.querySelector('button').innerText = "✅";
        }
    }
    renderArtifacts();
}

function squadAttack(type) {
    if (isBusy) return;
    if (type === 'magic' && player.mp < 25) { addLog("❌ Мало маны!"); return; }
    
    isBusy = true;
    if (type === 'magic') player.mp -= 25;

    document.getElementById('unit-knight').classList.add('anim-slash');
    setTimeout(() => document.getElementById('unit-archer').classList.add('anim-shoot'), 100);
    setTimeout(() => document.getElementById('unit-mage').classList.add('anim-cast'), 200);

    setTimeout(() => {
        let loc = locations[player.location];
        let dmg = player.strength + (type === 'magic' ? player.magic : 5);
        let enemy = loc.enemies[Math.floor(Math.random() * loc.enemies.length)];
        
        document.getElementById('game-container').classList.add('shake-screen');
        document.getElementById('enemy-sprite').classList.add('anim-hit');
        showDmg('enemy-damage', `-${dmg}`, 'dmg-red');

        setTimeout(() => {
            document.querySelectorAll('.unit').forEach(u => u.classList.remove('anim-slash', 'anim-shoot', 'anim-cast'));
            document.getElementById('enemy-sprite').classList.remove('anim-hit');
            document.getElementById('game-container').classList.remove('shake-screen');

            let loot = Math.floor(Math.random() * loc.loot) + 10;
            player.gold += loot;
            player.hp -= Math.floor(Math.random() * loc.danger);
            gainExp(loc.exp);
            addLog(`⚔️ ${enemy} повержен! +${loot}💰`);
            
            if (Math.random() > 0.8) dropArtifact();
            if (player.hp <= 0) { player.hp = 20; player.gold = Math.floor(player.gold * 0.8); addLog("💀 Отряд разбит."); }
            isBusy = false;
            updateUI();
        }, 400);
    }, 400);
}

function dropArtifact() {
    if (player.artifacts.length >= 3) return;
    const arts = [
        { name: "Кольцо Сил", icon: "💍", s: 10 },
        { name: "Амулет Мага", icon: "📿", m: 10 },
        { name: "Щит", icon: "🛡️", h: 50 }
    ];
    let a = arts[Math.floor(Math.random()*arts.length)];
    player.artifacts.push(a);
    if (a.s) player.strength += a.s;
    if (a.m) player.magic += a.m;
    if (a.h) { player.maxHp += a.h; player.hp += a.h; }
    addLog(`💎 Найден артефакт: ${a.name}!`);
}

function renderArtifacts() {
    const slots = document.querySelectorAll('.art-slot');
    slots.forEach((s, i) => {
        if (player.artifacts[i]) {
            s.innerText = player.artifacts[i].icon;
            s.classList.add('art-full');
        }
    });
}

function triggerRandomEvent() {
    const evs = [
        { t: "Алтарь", p: "Пожертвовать 50💰 за +5 силы?", c1: "Да", c2: "Нет", f: () => { if(player.gold>=50){player.gold-=50; player.strength+=5; return true;} } },
        { t: "Тедди", p: "Ваш пес нашел клад! Открыть?", c1: "Да", c2: "Мимо", f: () => { player.gold+=100; return true; } }
    ];
    let e = evs[Math.floor(Math.random()*evs.length)];
    document.getElementById('event-title').innerText = e.t;
    document.getElementById('event-text').innerText = e.p;
    const ov = document.getElementById('event-overlay');
    ov.classList.remove('hidden');
    document.getElementById('choice-1').onclick = () => { if(e.f()) addLog("✅ Выполнено"); ov.classList.add('hidden'); updateUI(); };
    document.getElementById('choice-2').onclick = () => { ov.classList.add('hidden'); };
}

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
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.5);
        player.maxHp += 50; player.hp = player.maxHp;
        addLog(`✨ УРОВЕНЬ ${player.level}!`);
    }
}

function buyItem(id, c) {
    if (player.gold >= c && !player.inventory[id]) {
        player.gold -= c; player.inventory[id] = true;
        if (id==='sword') player.strength += 20;
        if (id==='staff') player.magic += 25;
        if (id==='armor') player.maxHp += 80;
        if (id==='plate') player.maxHp += 200;
        updateUI();
    }
}

function switchTab(t) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('tab-' + t).classList.add('active');
}

function changeLoc(n) { player.location = n; addLog(`📍 Локация: ${n}`); updateUI(); }
function rest() { player.hp = player.maxHp; player.mp = player.maxMp; addLog("🛌 Отдых завершен."); updateUI(); }
function addLog(m) {
    const l = document.getElementById('game-log');
    let d = document.createElement('div'); d.innerText = "> " + m;
    l.prepend(d);
}

updateUI();
