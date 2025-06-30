/**
 * Página de Rifa - Sistema Mejorado
 * Autor: GodieBar (optimizado por IA)
 * - Números del 0000 al 9999 (sin repeticiones).
 * - Selección aleatoria de 5 números al participar.
 * - Cronómetro hasta las 17:00:00.
 * - Redirección a página del ganador.
 */

// Configuración
const TOTAL_NUMBERS = 10000; // Números del 0000 al 9999
const NUMBERS_TO_SELECT = 5;  // Números asignados por participante
const DRAW_TIME = "17:00:00"; // Hora del sorteo (5:00 PM)

// Variables globales
let availableNumbers = [];    // Números disponibles (0000-9999)
let selectedNumbers = [];     // Números ya seleccionados
let participants = [];        // Participantes registrados

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    initializeNumbers();      // Generar números disponibles
    loadParticipants();       // Cargar datos guardados
    startCountdown();         // Iniciar cronómetro

    // Eventos
    document.getElementById('participateBtn').addEventListener('click', participate);
    document.getElementById('viewNumbersBtn').addEventListener('click', showAvailableNumbers);
});

/**
 * Genera los 10,000 números iniciales (0000-9999).
 */
function initializeNumbers() {
    for (let i = 0; i < TOTAL_NUMBERS; i++) {
        availableNumbers.push(i.toString().padStart(4, '0')); // Formato 0000
    }
    console.log("Números inicializados:", availableNumbers.length);
}

/**
 * Carga participantes desde localStorage.
 */
function loadParticipants() {
    const storedData = localStorage.getItem('participants');
    if (storedData) {
        participants = JSON.parse(storedData);
        // Actualizar números seleccionados
        selectedNumbers = participants.flatMap(p => p.numbers);
        console.log("Participantes cargados:", participants.length);
    }
}

/**
 * Selecciona 5 números aleatorios para el participante.
 */
function selectRandomNumbers() {
    const available = availableNumbers.filter(num => !selectedNumbers.includes(num));
    if (available.length < NUMBERS_TO_SELECT) {
        alert("¡No hay suficientes números disponibles!");
        return null;
    }

    const shuffled = [...available].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, NUMBERS_TO_SELECT);
}

/**
 * Procesa la participación (asigna números y redirige).
 */
function participate() {
    const name = document.getElementById('participantName').value.trim();
    if (!name) {
        alert("Por favor, ingresa tu nombre.");
        return;
    }

    const numbers = selectRandomNumbers();
    if (!numbers) return;

    // Registrar participante
    participants.push({ name, numbers });
    selectedNumbers.push(...numbers);
    localStorage.setItem('participants', JSON.stringify(participants));

    // Redirigir a winner.html (simulado aquí)
    window.location.href = "winner.html"; // Cambia a tu URL real
}

/**
 * Muestra números disponibles (en consola para prueba).
 */
function showAvailableNumbers() {
    const available = availableNumbers.filter(num => !selectedNumbers.includes(num));
    console.log("Números disponibles:", available);
    alert(`Hay ${available.length} números disponibles. Ver la consola para detalles.`);
}

/**
 * Cronómetro regresivo hasta las 17:00:00.
 */
function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;

    function updateCountdown() {
        const now = new Date();
        const today = new Date(now.toDateString());
        const drawTime = new Date(today.toDateString() + ' ' + DRAW_TIME);

        // Si ya pasó la hora, mostrar "00:00:00"
        if (now >= drawTime) {
            countdownElement.textContent = "00:00:00";
            return;
        }

        const diff = drawTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
        const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');

        countdownElement.textContent = `${hours}:${minutes}:${seconds}`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}
// Cerrar modal al hacer clic en "Aceptar" o la X
document.getElementById('acceptTerms').addEventListener('click', closeModal);
document.getElementById('closeModal').addEventListener('click', closeModal);

function closeModal() {
    document.getElementById('termsModal').style.display = 'none';
}