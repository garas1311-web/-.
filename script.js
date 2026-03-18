let player = {
    level: 1, exp: 0, nextLvlExp: 100,
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    strength: 10, magic: 10, gold: 0,
    rank: "Новичок", location: "Лес",
    kills: 0, huntCount: 0,
    avatar: null,
    inventory: { sword: false, axe: false, staff: false, book: false, armor: false, plate: false },
    quest: { target: 5, current: 0, rewardGold: 100, rewardExp: 200, active: true }
};

const ranks = ["Новичок", "Подмастерье", "Мастер", "Магистр", "Мудрец", "Грандмастер", "Легенда", "Immortal"];
const locations = {
    "Лес": { minLvl: 1, danger: 15, loot: 15, exp: 35 },
    "Пещеры": { minLvl: 5, danger: 40, loot: 45, exp: 80 },
    "Замок": { minLvl: 10, danger: 75, loot: 120, exp: 180 }
};

const monsters = {
    "Лес": ["🌲Волк", "🌲Гоблин", "🌲Слизень"],
    "Пещеры": ["🦇Летучая мышь", "🦇Тролль", "🦇Паук"],
    "Замок": ["🏰Рыцарь-предатель", "🏰Горгулья", "🏰Вампир"]
};

// Каталог пасхалок (события из жизни)
const easterEggs = [
    "Семья зовет ужинать. Вы сбежали с поля боя, но зато вкусно поели! +50 HP.",
    "Вы попытались объяснить друзьям, кем работаете. Мана истощена до нуля.",
    "Коллега попросил сделать отчет к пятнице, но сегодня уже пятница! -20 HP от стресса.",
    "Ваш верный пес Тедди радостно принес вам мешочек! +50 золота.",
    "Начальник звонит в выходной. Вы притворились мертвым. Навык скрытности повышен! +100 Опыта.",
    "Жена сказала, что вы молодец. Все характеристики временно кажутся бесконечными! +Полное здоровье."
];

function save() { localStorage.setItem('immortalUltimate', JSON.stringify(player)); }
function load() {
    const data = localStorage.getItem('immortalUltimate');
    if (data) { 
        player = JSON.parse(data); 
        // Поддержка старых сохранений при обновах
        if(player.huntCount === undefined) player.huntCount = 0;
        updateUI(); 
    }
}

// Загрузка фото аватара
function uploadPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                player.avatar = e.target.result;
                save(); updateUI();
                addLog("📷 Фото успешно добавлено в профиль!", 'log-quest');
            } catch (err) {
                addLog("❌ Ошибка: файл слишком большой для сохранения браузером.", 'log-lose');
            }
        };
        reader.readAsDataURL(file);
    }
}

// Переключение вкладок магазина
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById('tab-' + tabName).classList.add('active');
}

setInterval(() => {
    if (player.hp < player.maxHp) player.hp = Math.min(player.hp + 2, player.maxHp);
    if (player.mp < player.maxMp) player.mp = Math.min(player.mp + 3, player.maxMp);
    updateUI();
}, 2000);

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
    document.getElementById('rank-name').innerText = player.rank;
    document.getElementById('location-name').innerText = "📍 " + player.location;

    document.getElementById('exp-fill').style.width = (player.exp / player.nextLvlExp * 100) + "%";
    document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + "%";
    document.getElementById('mp-fill').style.width = (player.mp / player.maxMp * 100) + "%";

    // Обновление аватара
    if (player.avatar) {
        document.getElementById('player-avatar').src = player.avatar;
        document.getElementById('player-avatar').style.display = 'block';
        document.getElementById('avatar-placeholder').style.display = 'none';
    }

    updateQuestUI();
    checkItems();
    updateCharacterVisual();
}

function updateQuestUI() {
    const q = player.quest;
    if (q.active) {
        document.getElementById('quest-info').innerText = `Квест: Убить врагов (${q.current}/${q.target})`;
        document.getElementById('quest-fill').style.width = (q.current / q.target * 100) + "%";
    }
}

function updateCharacterVisual() {
    const viewer = document.getElementById('character-viewer');
    viewer.className = 'character-stage'; // сброс
    if (player.inventory.sword || player.inventory.axe) viewer.classList.add('has-sword');
    if (player.inventory.armor || player.inventory.plate) viewer.classList.add('has-armor');
}

function checkItems() {
    const inv = player.inventory;
    ['sword', 'axe', 'staff', 'book', 'armor', 'plate'].forEach(item => {
        if (inv[item]) markOwned(`item-${item}`);
    });
}

function markOwned(id) {
    const el = document.getElementById(id);
    if(el) {
        el.classList.add('owned');
        el.querySelector('button').innerText = "✅";
        el.querySelector('button').disabled = true;
    }
}

function changeLoc(name) {
    if (player.level >= locations[name].minLvl) {
        player.location = name;
        addLog(`✈️ Локация: ${name}.`);
    } else {
        addLog(`⚠️ Нужен уровень ${locations[name].minLvl}.`);
    }
    updateUI();
}

function lifeEvent() {
    let egg = easterEggs[Math.floor(Math.random() * easterEggs.length)];
    addLog(`🎲 ${egg}`, 'log-easter');
    
    // Эффекты от приколов
    if (egg.includes("Тедди")) player.gold += 50;
    if (egg.includes("истощена")) player.mp = 0;
    if (egg.includes("стресса")) player.hp -= 20;
    if (egg.includes("вкусно поели") || egg.includes("Жена")) player.hp = player.maxHp;
    if (egg.includes("Начальник")) gainExp(100);
    
    if (player.hp <= 0) player.hp = 10;
    save(); updateUI();
}

function hunt(type) {
    let loc = locations[player.location];
    if (type === 'magic' && player.mp < 20) { addLog("❌ Нужно 20 маны!"); return; }
    if (player.hp <= 25) { addLog("🩹 Здоровье критическое!"); return; }

    if (type === 'magic') player.mp -= 20;
    player.huntCount++;

    // Система Боссов (Каждый 10-й бой)
    let isBoss = (player.huntCount % 10 === 0);
    let currentMonster = isBoss ? "🔥 БОСС ЛОКАЦИИ 🔥" : monsters[player.location][Math.floor(Math.random() * monsters[player.location].length)];
    let successChance = isBoss ? 0.6 : 0.85; // На боссе шанс победить ниже

    if (Math.random() < successChance) {
        let dmg = isBoss ? Math.floor(loc.danger * 1.5) : Math.floor(Math.random() * loc.danger);
        if (type === 'magic') dmg = Math.floor(dmg / 2); // Магия бьет издалека, урон по нам меньше

        let pwrBonus = (player.inventory.axe ? 40 : (player.inventory.sword ? 15 : 0));
        let goldLoot = Math.floor(Math.random() * loc.loot) + pwrBonus + (isBoss ? 200 : 0);
        
        player.hp -= dmg;
        player.gold += goldLoot;
        player.kills++;
        
        if (player.quest.active) {
            player.quest.current++;
            if (player.quest.current >= player.quest.target) finishQuest();
        }

        addLog(`⚔️ Убит ${currentMonster}! -${dmg} HP, +${goldLoot}💰`, 'log-win');
        gainExp(loc.exp * (isBoss ? 3 : 1));
    } else {
        player.hp -= isBoss ? 60 : 30;
        addLog(`🛡️ ${currentMonster} оказался сильнее. Вы сбежали!`, 'log-lose');
    }

    // Случайное вмешательство питомца (Секретная пасхалка)
    if (Math.random() > 0.95) {
        player.hp = Math.min(player.hp + 40, player.maxHp);
        addLog("🐶 Из кустов выскочил Тедди и зализал ваши раны! +40 HP.", 'log-easter');
    }

    if (player.hp <= 0) {
        player.hp = 25; player.gold = Math.floor(player.gold * 0.7);
        addLog("💀 Вы пали в бою. Потеряно 30% золота.", 'log-lose');
    }
    save(); updateUI();
}

function finishQuest() {
    player.gold += player.quest.rewardGold;
    gainExp(player.quest.rewardExp);
    addLog(`🎁 КВЕСТ ВЫПОЛНЕН! +${player.quest.rewardGold}💰`, 'log-quest');
    
    player.quest.target += 5;
    player.quest.current = 0;
    player.quest.rewardGold += 80;
    player.quest.rewardExp += 150;
}

function buyItem(item, cost) {
    if (player.gold >= cost) {
        player.gold -= cost;
        player.inventory[item] = true;
        
        if (item === 'sword') player.strength += 15;
        if (item === 'axe') player.strength += 30;
        if (item === 'staff') player.magic += 15;
        if (item === 'book') player.magic += 40;
        if (item === 'armor') { player.maxHp += 50; player.hp += 50; }
        if (item === 'plate') { player.maxHp += 150; player.hp += 150; }
        
        addLog(`🔨 В каталог добавлено: ${item}!`);
        save(); updateUI();
    } else {
        addLog("💰 Мало золота!");
    }
}

function rest() {
    player.hp = player.maxHp; player.mp = player.maxMp;
    addLog("🛌 Полноценный отдых.");
    save(); updateUI();
}

function gainExp(amt) {
    player.exp += amt;
    if (player.exp >= player.nextLvlExp) {
        player.level++;
        player.exp = 0;
        player.nextLvlExp = Math.floor(player.nextLvlExp * 1.6);
        player.maxHp += 30; player.maxMp += 20;
        player.hp = player.maxHp;
        player.rank = ranks[Math.min(Math.floor(player.level / 5), ranks.length - 1)];
        addLog(`🎉 НОВЫЙ УРОВЕНЬ: ${player.level}! Ранг: ${player.rank}`);
    }
    save(); updateUI();
}

function addLog(msg, className = '') {
    const log = document.getElementById('game-log');
    let span = document.createElement('div');
    if (className) span.classList.add(className);
    span.innerText = `> ${msg}`;
    log.prepend(span); 
}

load(); updateUI();
