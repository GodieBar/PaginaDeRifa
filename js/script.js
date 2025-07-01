/**
 * Página de Rifa - Script Principal
 * Autor: GodieBar (mejorado por IA y DominusZero)
 * Descripción:
 * Sistema de rifa con sorteo ponderado y gestión de participantes.
 * Funciones:
 * - Agregar participantes con validaciones
 * - Eliminar participantes individuales
 * - Guardar/cargar datos en localStorage
 * - Sortear ganador ponderado (más boletos, más chances)
 * - Mostrar mensajes de éxito/error en HTML
 */

// ========== CONSTANTES ==========

// Máximo de boletos permitidos por participante
const MAX_TICKETS = 1000;

// Selectores frecuentes
const nameInput = document.getElementById('participantName');
const ticketsInput = document.getElementById('ticketCount');
const errorDiv = document.getElementById('error-message');
const participantsTable = document.getElementById('participantsTable').querySelector('tbody');
const winnerDiv = document.getElementById('winner-result');

const acceptTermsBtn = document.getElementById('acceptTerms');
const closeModalBtn = document.getElementById('closeModal');
const termsModal = document.getElementById('termsModal');

// ========== VARIABLES ==========

let participants = [];

/**
 * Escapa caracteres peligrosos en texto dinámico
 * para evitar inyección HTML (XSS)
 */
const escapeHTML = (str) =>
  str.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

/**
 * Inicializa la página al cargar el DOM
 */
document.addEventListener('DOMContentLoaded', () => {
  loadParticipants();
  updateParticipantsTable();

  document.getElementById('addParticipant').addEventListener('click', addParticipant);
  document.getElementById('drawWinner').addEventListener('click', drawWinner);
  document.getElementById('clearData').addEventListener('click', clearData);

  acceptTermsBtn?.addEventListener('click', closeModal);
  closeModalBtn?.addEventListener('click', closeModal);
});

/**
 * Carga participantes guardados en localStorage
 */
function loadParticipants() {
  const stored = localStorage.getItem('participants');
  participants = stored ? JSON.parse(stored) : [];
}

/**
 * Guarda participantes en localStorage
 */
function saveParticipants() {
  localStorage.setItem('participants', JSON.stringify(participants));
}

/**
 * Muestra un mensaje de error o éxito en un div.
 * @param {string} message
 * @param {string} type - 'error' o 'success'
 */
function showMessage(message, type = 'error') {
  errorDiv.textContent = message;
  errorDiv.className = type === 'error' ? 'alert alert-danger' : 'alert alert-success';
  errorDiv.style.display = 'block';

  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 3000);
}

/**
 * Agrega un nuevo participante tras validar datos
 */
function addParticipant() {
  const name = nameInput.value.trim();
  const tickets = parseInt(ticketsInput.value, 10);

  // Validaciones
  if (!name) {
    showMessage('El nombre no puede estar vacío.');
    return;
  }

  if (isNaN(tickets) || tickets <= 0) {
    showMessage('El número de boletos debe ser mayor a 0.');
    return;
  }

  if (tickets > MAX_TICKETS) {
    showMessage(`Máximo ${MAX_TICKETS} boletos por persona.`);
    return;
  }

  if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    showMessage('Este nombre ya está registrado.');
    return;
  }

  // Agregar participante
  participants.push({ name, tickets });
  saveParticipants();
  updateParticipantsTable();

  nameInput.value = '';
  ticketsInput.value = '';
  showMessage(`Participante ${escapeHTML(name)} agregado correctamente.`, 'success');
}

/**
 * Refresca la tabla de participantes en pantalla
 */
function updateParticipantsTable() {
  participantsTable.innerHTML = '';

  participants.forEach((p, index) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${escapeHTML(p.name)}</td>
      <td>${p.tickets}</td>
      <td>
        <button class="btn btn-danger btn-sm delete-btn" data-index="${index}">
          🗑️
        </button>
      </td>
    `;

    participantsTable.appendChild(row);
  });

  // Asignar eventos a botones de eliminar
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      participants.splice(idx, 1);
      saveParticipants();
      updateParticipantsTable();
      showMessage('Participante eliminado.', 'success');
    });
  });
}

/**
 * Realiza el sorteo ponderado
 */
function drawWinner() {
  if (participants.length === 0) {
    showMessage('No hay participantes para sortear.');
    return;
  }

  const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);
  const randomTicket = Math.floor(Math.random() * totalTickets) + 1;

  let accumulated = 0;
  let winner = null;

  for (const participant of participants) {
    accumulated += participant.tickets;
    if (randomTicket <= accumulated) {
      winner = participant;
      break;
    }
  }

  if (winner) {
    winnerDiv.innerHTML = `
      <div class="alert alert-success mt-3">
        <h4>🎉 ¡Ganador: ${escapeHTML(winner.name)}!</h4>
        <p>Boletos comprados: ${winner.tickets}</p>
      </div>
    `;
  }
}

/**
 * Elimina todos los datos del sistema
 */
function clearData() {
  if (confirm('¿Estás seguro de borrar TODOS los participantes?')) {
    participants = [];
    localStorage.removeItem('participants');
    updateParticipantsTable();
    winnerDiv.innerHTML = '';
    showMessage('Todos los datos han sido eliminados.', 'success');
  }
}

/**
 * Cierra el modal de términos
 */
function closeModal() {
  termsModal.style.display = 'none';
}
