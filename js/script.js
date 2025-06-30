/**
 * Página de Rifa - Sistema Mejorado
 * - Números únicos entre participantes y en cada selección.
 * - Validación completa del formulario.
 * - Redirección correcta al ganador.
 */

const TOTAL_NUMBERS = 10000;
const NUMBERS_TO_SELECT = 5;
const DRAW_TIME = "17:00:00";

let allNumbers = Array.from({length: TOTAL_NUMBERS}, (_, i) => i.toString().padStart(4, '0'));
let usedNumbers = new Set();
let participants = [];

document.addEventListener('DOMContentLoaded', function() {
    loadParticipants();
    startCountdown();
    setupNumberInputs();
    
    document.getElementById('participateBtn').addEventListener('click', handleParticipation);
    document.getElementById('viewNumbersBtn').addEventListener('click', showAvailableNumbers);
});

function setupNumberInputs() {
    const container = document.getElementById('numbersContainer');
    container.innerHTML = '';
    
    for (let i = 1; i <= NUMBERS_TO_SELECT; i++) {
        container.innerHTML += `
            <div class="number-input">
                <label>Número ${i}</label>
                <input type="text" class="number-input" maxlength="4" pattern="\\d{4}" 
                       placeholder="0000" required>
            </div>
        `;
    }
}

function handleParticipation() {
    const name = document.getElementById('participantName').value.trim();
    const numberInputs = document.querySelectorAll('.number-input');
    const numbers = [];
    const errors = [];

    // Validar nombre
    if (!name) {
        errors.push("Por favor ingresa tu nombre");
    }

    // Validar números
    const tempUsed = new Set();
    numberInputs.forEach(input => {
        const num = input.value.padStart(4, '0');
        
        if (!/^\d{4}$/.test(num)) {
            errors.push("Todos los números deben ser de 4 dígitos");
            return;
        }
        
        if (usedNumbers.has(num)) {
            errors.push(`El número ${num} ya fue seleccionado por otro participante`);
            return;
        }
        
        if (tempUsed.has(num)) {
            errors.push(`No puedes repetir el número ${num} en tu selección`);
            return;
        }
        
        tempUsed.add(num);
        numbers.push(num);
    });

    // Mostrar errores o proceder
    if (errors.length > 0) {
        alert("Errores:\n" + errors.join("\n"));
        return;
    }

    // Registrar participación
    participants.push({ name, numbers });
    numbers.forEach(num => usedNumbers.add(num));
    localStorage.setItem('participants', JSON.stringify(participants));
    localStorage.setItem('lastWinner', JSON.stringify({ name, numbers }));

    // Redireccionar
    window.location.href = "winner.html";
}

function showAvailableNumbers() {
    const available = allNumbers.filter(num => !usedNumbers.has(num));
    const count = available.length;
    alert(`Números disponibles: ${count}\n\nEjemplos:\n${
        available.slice(0, 5).join(', ')}${count > 5 ? '...' : ''}`);
}

function loadParticipants() {
    const stored = localStorage.getItem('participants');
    if (stored) {
        participants = JSON.parse(stored);
        participants.forEach(p => p.numbers.forEach(n => usedNumbers.add(n)));
    }
}

function startCountdown() {
    const element = document.getElementById('countdown');
    if (!element) return;

    function update() {
        const now = new Date();
        const target = new Date(now.toDateString() + ' ' + DRAW_TIME);
        
        if (now >= target) {
            element.textContent = "00:00:00";
            return;
        }

        const diff = target - now;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');

        element.textContent = `${h}:${m}:${s}`;
    }

    update();
    setInterval(update, 1000);
}
// Cerrar modal al hacer clic en "Aceptar" o la X
document.getElementById('acceptTerms').addEventListener('click', closeModal);
document.getElementById('closeModal').addEventListener('click', closeModal);

function closeModal() {
    document.getElementById('termsModal').style.display = 'none';
}