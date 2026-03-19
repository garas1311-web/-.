// База данных артефактов с описаниями
const ARTIFACT_DB = [
    { id: 1, name: "Корона Короля", icon: "👑", desc: "Дарует величие. +50 к макс. ХП", bonusType: "hp", bonusVal: 50 },
    { id: 2, name: "Кольцо Силы", icon: "💍", desc: "Сжимает пальцы, усиливая удар. +10 к Атаке", bonusType: "dmg", bonusVal: 10 },
    { id: 3, name: "Оберег", icon: "🧿", desc: "Снижает получаемый урон на 5%", bonusType: "def", bonusVal: 0.05 },
    { id: 4, name: "Перчатки спешки", icon: "🧤", desc: "Ускоряют наборы энергии на 10%", bonusType: "en", bonusVal: 1.1 }
];

let player = { gold: 0, tp: 0, stage: 1, inventory: [] };
let squad = {
    knight: { name: "Рыцарь", hp: 100, maxHp: 100, dmg: 20, en: 0, hired: true },
    archer: { name: "Лучник", hp: 70, maxHp: 70, dmg: 15, en: 0, hired: false }
};

// Показ характеристик персонажа
function showCharStats(id) {
    const char = squad[id];
    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = `
        <strong>${char.name}</strong><br>
        ❤️ ХП: ${Math.floor(char.hp)}/${char.maxHp}<br>
        ⚔️ Атака: ${char.dmg}<br>
        ⚡ Энергия: ${char.en}%
    `;
    tooltip.classList.remove('hidden');
    updateTooltipPos();
}

// Показ инфы о предмете
function showItemInfo(item) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = `
        <strong>${item.name}</strong><br>
        <span style="color:#f1c40f">${item.desc}</span><br>
        <em>(Действует пассивно)</em>
    `;
    tooltip.classList.remove('hidden');
}

function updateTooltipPos() {
    window.onmousemove = (e) => {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
    };
}

function hideTooltip() {
    document.getElementById('tooltip').classList.add('hidden');
}

// Выпадение лута (Исправлено)
function dropLoot() {
    const randomItem = ARTIFACT_DB[Math.floor(Math.random() * ARTIFACT_DB.length)];
    player.inventory.push(randomItem);
    
    // Сразу применяем бонус (упрощенно)
    if(randomItem.bonusType === 'hp') squad.knight.maxHp += randomItem.bonusVal;
    if(randomItem.bonusType === 'dmg') squad.knight.dmg += randomItem.bonusVal;

    addLog(`🎁 Найден артефакт: ${randomItem.name}!`);
    renderInventory();
}

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    player.inventory.forEach(item => {
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        slot.innerText = item.icon;
        slot.onmouseenter = () => showItemInfo(item);
        slot.onmouseleave = hideTooltip;
        grid.appendChild(slot);
    });
}

// Системные функции
function toggleModal(id) { document.getElementById(id).classList.toggle('hidden'); }
function addLog(msg) {
    const log = document.getElementById('log-container');
    log.innerHTML = `<div>> ${msg}</div>` + log.innerHTML;
}

// Начальная отрисовка
renderInventory();
updateTooltipPos();
