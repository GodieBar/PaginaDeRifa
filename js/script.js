/**
 * Página de Rifa - Script Principal
 * Autor: GodieBar (mejorado por IA)
 * Descripción: Sistema de rifa donde los participantes compran boletos y se elige un ganador aleatorio.
 * Mejoras:
 * - Sorteo ponderado (más boletos = más probabilidad).
 * - Eliminar participantes individuales.
 * - Mensajes de error/éxito en HTML.
 * - Comentarios detallados.
 */

// Variables globales
let participants = []; // Array para almacenar los participantes
const MAX_TICKETS = 1000; // Límite máximo de boletos por participante (ajustable)

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    loadParticipants(); // Cargar participantes al iniciar
    updateParticipantsTable(); // Actualizar la tabla

    // Evento para agregar participante
    document.getElementById('addParticipant').addEventListener('click', addParticipant);

    // Evento para sortear
    document.getElementById('drawWinner').addEventListener('click', drawWinner);

    // Evento para borrar todos los datos
    document.getElementById('clearData').addEventListener('click', clearData);
});

/**
 * Carga participantes desde localStorage.
 * Si no hay datos, inicializa el array vacío.
 */
function loadParticipants() {
    const storedData = localStorage.getItem('participants');
    participants = storedData ? JSON.parse(storedData) : [];
}

/**
 * Guarda participantes en localStorage.
 */
function saveParticipants() {
    localStorage.setItem('participants', JSON.stringify(participants));
}

/**
 * Agrega un nuevo participante con validaciones.
 */
function addParticipant() {
    const nameInput = document.getElementById('participantName');
    const ticketsInput = document.getElementById('ticketCount');
    const errorDiv = document.getElementById('error-message');

    const name = nameInput.value.trim();
    const tickets = parseInt(ticketsInput.value);

    // Validaciones
    if (!name) {
        showError('El nombre no puede estar vacío.', errorDiv);
        return;
    }

    if (isNaN(tickets) || tickets <= 0) {
        showError('El número de boletos debe ser mayor a 0.', errorDiv);
        return;
    }

    if (tickets > MAX_TICKETS) {
        showError(`Máximo ${MAX_TICKETS} boletos por persona.`, errorDiv);
        return;
    }

    // Verificar si el nombre ya existe
    if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showError('Este nombre ya está registrado.', errorDiv);
        return;
    }

    // Agregar participante
    participants.push({ name, tickets });
    saveParticipants();
    updateParticipantsTable();

    // Limpiar inputs y mensajes
    nameInput.value = '';
    ticketsInput.value = '';
    errorDiv.textContent = '';
}

/**
 * Muestra un mensaje de error en el div especificado.
 */
function showError(message, errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 3000);
}

/**
 * Actualiza la tabla de participantes en el HTML.
 */
function updateParticipantsTable() {
    const tableBody = document.getElementById('participantsTable').querySelector('tbody');
    tableBody.innerHTML = '';

    participants.forEach((participant, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${participant.name}</td>
            <td>${participant.tickets}</td>
            <td><button class="btn btn-danger btn-sm delete-btn" data-index="${index}">🗑️</button></td>
        `;

        tableBody.appendChild(row);
    });

    // Agregar evento a los botones de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'));
            participants.splice(index, 1);
            saveParticipants();
            updateParticipantsTable();
        });
    });
}

/**
 * Realiza el sorteo de manera justa (probabilidad ponderada por boletos).
 */
function drawWinner() {
    if (participants.length === 0) {
        showError('No hay participantes para sortear.', document.getElementById('error-message'));
        return;
    }

    // Calcular el total de boletos
    const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);

    // Generar un número aleatorio entre 1 y el total de boletos
    const randomTicket = Math.floor(Math.random() * totalTickets) + 1;

    // Encontrar al ganador
    let accumulatedTickets = 0;
    let winner = null;

    for (const participant of participants) {
        accumulatedTickets += participant.tickets;
        if (randomTicket <= accumulatedTickets) {
            winner = participant;
            break;
        }
    }

    // Mostrar el ganador en HTML (no en alert)
    const winnerDiv = document.getElementById('winner-result');
    winnerDiv.innerHTML = `
        <div class="alert alert-success mt-3">
            <h4>🎉 ¡Ganador: ${winner.name}!</h4>
            <p>Boletos comprados: ${winner.tickets}</p>
        </div>
    `;
}

/**
 * Borra todos los datos (con confirmación).
 */
function clearData() {
    if (confirm('¿Estás seguro de borrar TODOS los participantes?')) {
        participants = [];
        localStorage.clear();
        updateParticipantsTable();
        document.getElementById('winner-result').innerHTML = '';
    }
}
// Cerrar modal al hacer clic en "Aceptar" o la X
document.getElementById('acceptTerms').addEventListener('click', closeModal);
document.getElementById('closeModal').addEventListener('click', closeModal);

function closeModal() {
    document.getElementById('termsModal').style.display = 'none';
}