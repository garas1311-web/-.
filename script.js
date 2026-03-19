let player = {
    level: 1, gold: 180, stage: 1, tp: 5,
    inventory: [
        { id: 1, name: "Корона", icon: "👑", desc: "Увеличивает ХП на 50", stat: "hp", val: 50 },
        { id: 2, name: "Кольцо", icon: "💍", desc: "Добавляет +10 к силе атаки", stat: "dmg", val: 10 }
    ]
};

let knight = { name: "Рыцарь", hp: 100, maxHp: 100, dmg: 20, en: 0 };

// Показываем статы при наведении
function showStats(id) {
    const tt = document.getElementById('tooltip');
    tt.innerHTML = `
        <b style="color:var(--gold)">${knight.name}</b><br>
        ❤️ ХП: ${knight.hp}/${knight.maxHp}<br>
        ⚔️ Атака: ${knight.dmg}<br>
        ⚡ Энергия: ${knight.en}%
    `;
    tt.classList.remove('hidden');
}

// Движение тултипа за мышкой
document.addEventListener('mousemove', (e) => {
    const tt = document.getElementById('tooltip');
    if (!tt.classList.contains('hidden')) {
        tt.style.left = (e.pageX + 15) + 'px';
        tt.style.top = (e.pageY + 15) + 'px';
    }
});

function hideStats() { document.getElementById('tooltip').classList.add('hidden'); }

// Показываем инфо о предмете
function showItemDesc(item) {
    const tt = document.getElementById('tooltip');
    tt.innerHTML = `<b>${item.name}</b><br><span style="color:#aaa">${item.desc}</span>`;
    tt.classList.remove('hidden');
}

// Отрисовка инвентаря
function renderInv() {
    const grid = document.getElementById('inv-grid');
    grid.innerHTML = '';
    player.inventory.forEach(item => {
        let slot = document.createElement('div');
        slot.className = 'inv-slot';
        slot.innerText = item.icon;
        slot.onmouseover = () => showItemDesc(item);
        slot.onmouseout = hideStats;
        grid.appendChild(slot);
    });
}

function toggleInv() {
    document.getElementById('inv-modal').classList.toggle('hidden');
    renderInv();
}

// Функция отдыха (восстанавливаем ХП)
function rest() {
    knight.hp = knight.maxHp;
    addLog("Отряд отдохнул и восстановил силы.");
    updateUI();
}

function updateUI() {
    document.getElementById('gold-val').innerText = player.gold;
    document.getElementById('lvl-val').innerText = player.level;
    // ... остальное обновление полосок
}

function addLog(msg) {
    const log = document.getElementById('log');
    log.innerHTML = `<div>> ${msg}</div>` + log.innerHTML;
}
