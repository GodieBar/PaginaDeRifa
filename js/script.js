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

// ====== VARIABLES GLOBALES ======

let participants = []; 
// Array donde se almacenan los participantes, cada uno como objeto { name, tickets }

const MAX_TICKETS = 1000; 
// Máximo de boletos que puede comprar una sola persona (ajustable)

// ====== EVENTOS AL CARGAR EL DOM ======

document.addEventListener('DOMContentLoaded', function () {
    loadParticipants();             // Cargar datos guardados si existen
    updateParticipantsTable();      // Mostrar la tabla de participantes al inicio

    // Botón para agregar participante
    document.getElementById('addParticipant').addEventListener('click', addParticipant);

    // Botón para realizar el sorteo
    document.getElementById('drawWinner').addEventListener('click', drawWinner);

    // Botón para borrar todos los datos
    document.getElementById('clearData').addEventListener('click', clearData);
});

/**
 * Carga participantes desde localStorage.
 * Si no hay datos, deja el array vacío.
 */
function loadParticipants() {
    const storedData = localStorage.getItem('participants');
    participants = storedData ? JSON.parse(storedData) : [];
}

/**
 * Guarda los participantes actuales en localStorage.
 */
function saveParticipants() {
    localStorage.setItem('participants', JSON.stringify(participants));
}

/**
 * Agrega un nuevo participante tras validar los datos.
 */
function addParticipant() {
    const nameInput = document.getElementById('participantName');
    const ticketsInput = document.getElementById('ticketCount');
    const errorDiv = document.getElementById('error-message');

    const name = nameInput.value.trim();
    const tickets = parseInt(ticketsInput.value);

    // VALIDACIONES BÁSICAS

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

    // Comprobar si el participante ya existe (ignora mayúsculas/minúsculas)
    if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showError('Este nombre ya está registrado.', errorDiv);
        return;
    }

    // Si pasa todas las validaciones, agregamos al array
    participants.push({ name, tickets });
    saveParticipants();            // Guardar en localStorage
    updateParticipantsTable();     // Actualizar tabla en la página

    // Limpiar campos e indicadores
    nameInput.value = '';
    ticketsInput.value = '';
    errorDiv.textContent = '';
}

/**
 * Muestra un mensaje de error en un div visible.
 * Luego lo oculta tras 3 segundos.
 */
function showError(message, errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 3000);
}

/**
 * Actualiza el contenido de la tabla de participantes en el HTML.
 */
function updateParticipantsTable() {
    const tableBody = document.getElementById('participantsTable').querySelector('tbody');
    tableBody.innerHTML = ''; // Limpiar tabla antes de volver a dibujarla

    participants.forEach((participant, index) => {
        const row = document.createElement('tr');

        // Creamos una fila con:
        // - nombre
        // - cantidad de boletos
        // - botón para eliminarlo
        row.innerHTML = `
            <td>${participant.name}</td>
            <td>${participant.tickets}</td>
            <td><button class="btn btn-danger btn-sm delete-btn" data-index="${index}">🗑️</button></td>
        `;

        tableBody.appendChild(row);
    });

    // Asignar eventos a todos los botones "eliminar" recién creados
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'));
            participants.splice(index, 1); // Eliminar del array
            saveParticipants();             // Guardar cambios
            updateParticipantsTable();      // Refrescar tabla
        });
    });
}

/**
 * Realiza el sorteo ponderado según la cantidad de boletos.
 */
function drawWinner() {
    if (participants.length === 0) {
        showError('No hay participantes para sortear.', document.getElementById('error-message'));
        return;
    }

    // Calcular el total de boletos en juego
    const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);

    // Generar un número aleatorio entre 1 y totalTickets
    const randomTicket = Math.floor(Math.random() * totalTickets) + 1;

    // Vamos sumando los boletos acumulados hasta encontrar al ganador
    let accumulatedTickets = 0;
    let winner = null;

    for (const participant of participants) {
        accumulatedTickets += participant.tickets;

        if (randomTicket <= accumulatedTickets) {
            winner = participant;
            break;
        }
    }

    // Mostrar el ganador en un div HTML
    const winnerDiv = document.getElementById('winner-result');
    winnerDiv.innerHTML = `
        <div class="alert alert-success mt-3">
            <h4>🎉 ¡Ganador: ${winner.name}!</h4>
            <p>Boletos comprados: ${winner.tickets}</p>
        </div>
    `;
}

/**
 * Borra todos los datos del sistema (con confirmación).
 */
function clearData() {
    if (confirm('¿Estás seguro de borrar TODOS los participantes?')) {
        participants = [];
        localStorage.clear();
        updateParticipantsTable();
        document.getElementById('winner-result').innerHTML = '';
    }
}

// ========== MODAL TÉRMINOS Y CONDICIONES ==========

// Cerrar modal al hacer clic en "Aceptar" o la X
document.getElementById('acceptTerms').addEventListener('click', closeModal);
document.getElementById('closeModal').addEventListener('click', closeModal);

/**
 * Oculta el modal de términos.
 */
function closeModal() {
    document.getElementById('termsModal').style.display = 'none';
}
