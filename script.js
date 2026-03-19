let gold = 0;
let isAttacking = false;

function squadAttack() {
    if (isAttacking) return;
    isAttacking = true;

    const knight = document.getElementById('unit-knight');
    const log = document.getElementById('game-log');

    // Запуск анимации
    knight.classList.add('attack-move');
    
    setTimeout(() => {
        gold += 10;
        document.getElementById('gold').innerText = gold;
        
        let msg = document.createElement('div');
        msg.innerText = "> Рыцарь разрубил врага! +10г";
        log.prepend(msg);

        knight.classList.remove('attack-move');
        isAttacking = false;
    }, 400);
}

function rest() {
    alert("Отряд отдыхает...");
}
