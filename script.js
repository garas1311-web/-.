let player = {
    level: 1, exp: 0, nextLvlExp: 100,
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    strength: 10, magic: 10, gold: 0,
    rank: "Новичок", location: "Лес",
    kills: 0, huntCount: 0, avatar: null,
    inventory: { sword: false, staff: false, armor: false, plate: false, meme1: false, meme2: false },
    quest: { target: 5, current: 0, rewardGold: 100, rewardExp: 200, active: true }
};

const ranks = ["Новичок", "Подмастерье", "Мастер", "Магистр", "Мудрец", "Immortal"];
const locations = {
    "Лес": { minLvl: 1, danger: 15, loot: 15, exp: 35 },
    "Пещеры": { minLvl: 5, danger: 40, loot: 45, exp: 80 },
    "Замок": { minLvl: 10, danger: 75, loot: 120, exp: 180 }
};

// Эмодзи для визуализации врагов
const monstersVisual = {
    "Лес": [{name: "Волк", icon: "🐺"}, {name: "Гоблин", icon: "👹"}, {name: "Энт", icon: "🌳"}],
    "Пещеры": [{name: "Летучая мышь", icon: "🦇"}, {name: "Тролль", icon: "🧌"}, {name: "Паук", icon: "🕷️"}],
    "Замок": [{name: "Рыцарь-скелет", icon: "💀"}, {name: "Горгулья", icon: "🗿"}, {name: "Вампир", icon: "🧛"}]
};

let currentEnemy = null;
let isAnimating = false;

// Пасхалки
const easterEggs = [
    "Семья зовет ужинать. Вы сбежали с поля боя, но зато вкусно поели! +50 HP.",
    "Вы попытались объяснить друзьям, чем занимаетесь на работе. Мана истощена до нуля.",
    "Коллега попросил сделать отчет к пятнице, но сегодня уже пятница! -20 HP от стресса.",
    "Ваш верный пес Тедди радостно принес вам мешочек! +50 золота.",
    "Начальник звонит в выходной. Вы притворились мертвым. Навык скрытности повышен! +100 Опыта.",
    "Жена похвалила вас. Все характеристики временно кажутся бесконечными! +Полное здоровье."
];

function save() { localStorage.setItem('immortalAction', JSON.stringify(player)); }
function load() {
    const data = localStorage.getItem('immortalAction');
    if (data) player = JSON.parse(data); 
    spawnEnemy();
    updateUI(); 
}

function uploadPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            player.avatar = e.target.result;
            save(); updateUI();
            addLog("📷 Фото успешно добавлено!", 'log-quest');
        };
        reader.readAsDataURL(file);
    }
}

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
    
    // Обновляем фон арены
    document.getElementById('battle-arena').className = "loc-" + player.location;

    if (player.avatar) {
        document.getElementById('player-avatar').src = player.avatar;
        document.getElementById('player-avatar').style.display = 'block';
        document.getElementById('avatar-placeholder').style.display = 'none';
    }

    updateQuestUI();
    checkItems();
    updateCharacterVisual();
}

function spawnEnemy() {
    const list = monstersVisual[player.location];
    currentEnemy = list[Math.floor(Math.random() * list.length)];
    const sprite = document.getElementById('enemy-sprite');
    sprite.innerText = currentEnemy.icon;
    sprite.classList.remove('anim-die');
    sprite.classList.add('anim-spawn');
    setTimeout(() => sprite.classList.remove('anim-spawn'), 300);
}

function updateQuestUI() {
    const q = player.quest;
    if (q.active) {
        document.getElementById('quest-info').innerText = `Квест: Убить врагов (${q.current}/${q.target})`;
        document.getElementById('quest-fill').style.width = (q.current / q.target * 100) + "%";
    }
}

function updateCharacterVisual() {
    const heroSvg = document.getElementById('hero-stage');
    heroSvg.className = ''; 
    if (player.inventory.sword) heroSvg.classList.add('has-sword');
    if (player.inventory.armor) heroSvg.classList.add('has-armor');
    if (player.inventory.plate) heroSvg.classList.add('has-plate');
}

function checkItems() {
    ['sword', 'staff', 'armor', 'plate', 'meme1', 'meme2'].forEach(item => {
        if (player.inventory[item]) markOwned(`item-${item}`);
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
        addLog(`✈️ Локация изменена: ${name}.`);
        spawnEnemy();
    } else {
        addLog(`⚠️ Нужен уровень ${locations[name].minLvl}.`);
    }
    updateUI();
}

function showDamageText(targetId, text, className) {
    const el = document.getElementById(targetId);
    el.innerText = text;
    el.className = `floating-text ${className}`;
    // Перезапуск анимации
    void el.offsetWidth; 
    el.style.animation = 'none';
    setTimeout(() => el.style.animation = '', 10);
}

function hunt(type) {
    if (isAnimating) return; // Блокировка спама кнопок
    let loc = locations[player.location];
    if (type === 'magic' && player.mp < 20) { addLog("❌ Нужно 20 маны!"); return; }
    if (player.hp <= 25) { addLog("🩹 Здоровье критическое!"); return; }

    isAnimating = true;
    const heroStage = document.getElementById('hero-stage');
    const enemyStage = document.getElementById('enemy-sprite');

    // Шаг 1: Анимация атаки героя
    if (type === 'magic') {
        player.mp -= 20;
        heroStage.classList.add('anim-attack-magic');
    } else {
        heroStage.classList.add('anim-attack-sword');
    }

    setTimeout(() => {
        heroStage.classList.remove('anim-attack-sword', 'anim-attack-magic');
        
        // Шаг 2: Расчет боя
        let isWin = Math.random() > 0.15; 
        
        if (isWin) {
            let dmgToHero = type === 'magic' ? 5 : Math.floor(Math.random() * loc.danger);
            let pwrBonus = player.inventory.sword ? 20 : 0;
            let dmgToEnemy = Math.floor(Math.random() * 50) + 20 + pwrBonus;
            let goldLoot = Math.floor(Math.random() * loc.loot) + 10;
            
            player.hp -= dmgToHero;
            player.gold += goldLoot;
            
            // Анимация попадания по врагу
            enemyStage.classList.add('anim-hit');
            showDamageText('enemy-damage', `-${dmgToEnemy}`, 'dmg-red');
            if (dmgToHero > 0) showDamageText('hero-damage', `-${dmgToHero}`, 'dmg-red');

            setTimeout(() => {
                enemyStage.classList.remove('anim-hit');
                // Смерть врага
                enemyStage.classList.add('anim-die');
                addLog(`⚔️ ${currentEnemy.name} повержен! +${goldLoot}💰`, 'log-win');
                
                if (player.quest.active) {
                    player.quest.current++;
                    if (player.quest.current >= player.quest.target) finishQuest();
                }
                gainExp(loc.exp);

                setTimeout(() => {
                    spawnEnemy();
                    isAnimating = false;
                }, 400); // Ждем пока труп исчезнет
            }, 300);

        } else {
            // Промах / Враг ударил сильнее
            let dmgToHero = 30;
            player.hp -= dmgToHero;
            showDamageText('hero-damage', `-${dmgToHero}`, 'dmg-red');
            heroStage.classList.add('anim-hit');
            
            setTimeout(() => {
                heroStage.classList.remove('anim-hit');
                addLog(`🛡️ ${currentEnemy.name} оказался сильнее. Вы отступили!`, 'log-lose');
                isAnimating = false;
            }, 300);
        }

        if (player.hp <= 0) {
            player.hp = 25; player.gold = Math.floor(player.gold * 0.7);
            addLog("💀 Вы пали в бою. Потеряно 30% золота.", 'log-lose');
        }
        save(); updateUI();
    }, 350); // Ждем пока меч/магия долетит
}

function lifeEvent() {
    let egg = easterEggs[Math.floor(Math.random() * easterEggs.length)];
    addLog(`🎲 ${egg}`, 'log-easter');
    
    if (egg.includes("Тедди")) player.gold += 50;
    if (egg.includes("истощена")) player.mp = 0;
    if (egg.includes("стресса")) player.hp -= 20;
    if (egg.includes("вкусно поели") || egg.includes("Жена")) player.hp = player.maxHp;
    if (egg.includes("Начальник")) gainExp(100);
    
    if (player.hp <= 0) player.hp = 10;
    save(); updateUI();
}

function finishQuest() {
    player.gold += player.quest.rewardGold;
    gainExp(player.quest.rewardExp);
    addLog(`🎁 КВЕСТ ВЫПОЛНЕН! +${player.quest.rewardGold}💰`, 'log-quest');
    player.quest.target += 5;
    player.quest.current = 0;
}

function buyItem(item, cost) {
    if (player.gold >= cost) {
        player.gold -= cost;
        player.inventory[item] = true;
        
        if (item === 'sword') player.strength += 15;
        if (item === 'staff') player.magic += 15;
        if (item === 'armor') { player.maxHp += 50; player.hp += 50; }
        if (item === 'plate') { player.maxHp += 150; player.hp += 150; }
        
        addLog(`🛍️ Куплено: ${item}!`);
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
        addLog(`🎉 НОВЫЙ УРОВЕНЬ: ${player.level}!`);
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

load();
