/**
 * Script para el panel del vendedor - Versión Simplificada
 * Funcionalidades básicas:
 * 1. Registrar participantes rápidamente
 * 2. Realizar sorteo cuando sea la hora
 * 3. Ver lista de participantes
 * 4. Marcar ganador como pagado
 */

import { 
  db, collection, addDoc, getDocs, 
  query, where, orderBy, limit, updateDoc, doc,
  onSnapshot, serverTimestamp
} from './firebase.js';

// Elementos del DOM
const DOM = {
  logoutBtn: document.getElementById('logoutBtn'),
  drawWinnerBtn: document.getElementById('drawWinnerBtn'),
  registerBtn: document.getElementById('registerBtn'),
  markAsPaidBtn: document.getElementById('markAsPaidBtn'),
  todayParticipants: document.getElementById('todayParticipants'),
  totalMoney: document.getElementById('totalMoney'),
  todayWinner: document.getElementById('todayWinner'),
  winnerSection: document.getElementById('winnerSection'),
  winnerInfo: document.getElementById('winnerInfo'),
  participantsTable: document.getElementById('participantsTable').getElementsByTagName('tbody')[0],
  quickRegisterModal: document.getElementById('quickRegisterModal'),
  closeModal: document.querySelector('.close-modal'),
  quickRegisterForm: document.getElementById('quickRegisterForm'),
  quickName: document.getElementById('quickName'),
  quickNumber: document.getElementById('quickNumber')
};

// Variables globales
let selectedWinnerId = null;
let todayParticipantsCount = 0;
let todayParticipantsAmount = 0;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
  loadTodayParticipants();
  checkTodayWinner();
});

// Verificar autenticación
function checkAuth() {
  const auth = localStorage.getItem('auth');
  if (!auth) {
    window.location.href = 'login.html';
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Cerrar sesión
  DOM.logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('auth');
    window.location.href = 'login.html';
  });
  
  // Registrar participante
  DOM.registerBtn.addEventListener('click', () => {
    DOM.quickRegisterModal.style.display = 'flex';
    DOM.quickName.focus();
  });
  
  // Cerrar modal
  DOM.closeModal.addEventListener('click', () => {
    DOM.quickRegisterModal.style.display = 'none';
  });
  
  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === DOM.quickRegisterModal) {
      DOM.quickRegisterModal.style.display = 'none';
    }
  });
  
  // Formulario rápido de registro
  DOM.quickRegisterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await registerParticipant();
  });
  
  // Realizar sorteo
  DOM.drawWinnerBtn.addEventListener('click', drawWinner);
  
  // Marcar como pagado
  DOM.markAsPaidBtn.addEventListener('click', markAsPaid);
}

// Cargar participantes de hoy
async function loadTodayParticipants() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, "participants"),
    where("date", ">=", today.toISOString()),
    orderBy("date", "desc")
  );
  
  // Actualización en tiempo real
  onSnapshot(q, (snapshot) => {
    todayParticipantsCount = 0;
    todayParticipantsAmount = 0;
    DOM.participantsTable.innerHTML = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      todayParticipantsCount++;
      todayParticipantsAmount += parseInt(data.amount);
      
      // Formatear fecha
      const date = data.date.toDate ? data.date.toDate() : new Date(data.date);
      const timeString = date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Agregar a la tabla
      const row = DOM.participantsTable.insertRow();
      row.innerHTML = `
        <td>${data.name}</td>
        <td>${data.number}</td>
        <td>$${data.amount} MXN</td>
        <td>${timeString}</td>
      `;
    });
    
    // Actualizar estadísticas
    DOM.todayParticipants.textContent = todayParticipantsCount;
    DOM.totalMoney.textContent = `$${todayParticipantsAmount} MXN`;
  });
}

// Registrar participante
async function registerParticipant() {
  try {
    const name = DOM.quickName.value.trim();
    const number = DOM.quickNumber.value.padStart(4, '0');
    const amount = document.querySelector('input[name="quickAmount"]:checked').value;
    
    // Validaciones básicas
    if (!name || name.length < 3) {
      alert("Por favor ingresa un nombre válido (mínimo 3 letras)");
      return;
    }
    
    if (!number || number.length !== 4) {
      alert("Por favor ingresa un número de 4 dígitos");
      return;
    }
    
    // Crear objeto participante
    const participant = {
      name: name,
      number: number,
      amount: parseInt(amount),
      date: serverTimestamp(),
      paid: false
    };
    
    // Guardar en Firebase
    await addDoc(collection(db, "participants"), participant);
    
    // Limpiar formulario
    DOM.quickRegisterForm.reset();
    DOM.quickRegisterModal.style.display = 'none';
    
    // Mostrar mensaje de éxito
    alert("Participante registrado exitosamente");
    
  } catch (error) {
    console.error("Error al registrar participante:", error);
    alert("Ocurrió un error al registrar. Por favor intenta nuevamente.");
  }
}

// Verificar si ya hay ganador hoy
async function checkTodayWinner() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, "winners"),
    where("date", ">=", today.toISOString()),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const winner = snapshot.docs[0].data();
    showWinner(winner);
    DOM.drawWinnerBtn.disabled = true;
    DOM.drawWinnerBtn.textContent = "Sorteo Realizado";
  }
}

// Realizar sorteo
async function drawWinner() {
  if (!confirm("¿Estás seguro de realizar el sorteo ahora?")) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Verificar si ya hay ganador hoy
  const qCheck = query(
    collection(db, "winners"),
    where("date", ">=", today.toISOString()),
    limit(1)
  );
  
  const checkSnapshot = await getDocs(qCheck);
  if (!checkSnapshot.empty) {
    alert("Ya se realizó el sorteo hoy");
    return;
  }
  
  // Obtener participantes de hoy que han pagado
  const qParticipants = query(
    collection(db, "participants"),
    where("date", ">=", today.toISOString())
  );
  
  const participantsSnapshot = await getDocs(qParticipants);
  
  if (participantsSnapshot.empty) {
    alert("No hay participantes hoy");
    return;
  }
  
  // Seleccionar ganador aleatorio
  const participants = participantsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  const winnerIndex = Math.floor(Math.random() * participants.length);
  const winner = participants[winnerIndex];
  const prize = calculatePrize(participants.length);
  
  // Registrar ganador
  const winnerRef = await addDoc(collection(db, "winners"), {
    ...winner,
    prize: prize,
    date: serverTimestamp(),
    paid: false
  });
  
  selectedWinnerId = winnerRef.id;
  
  // Mostrar resultado
  showWinner({
    ...winner,
    prize: prize
  });
  
  // Deshabilitar botón de sorteo
  DOM.drawWinnerBtn.disabled = true;
  DOM.drawWinnerBtn.textContent = "Sorteo Realizado";
  
  alert(`¡Ganador seleccionado!\n\nNombre: ${winner.name}\nNúmero: ${winner.number}\nPremio: $${prize} MXN`);
}

// Calcular premio basado en participantes
function calculatePrize(participantCount) {
  const basePrize = 3000;
  const extra = Math.min(participantCount * 20, 2000); // Máximo $2000 extra
  return basePrize + extra;
}

// Mostrar información del ganador
function showWinner(winner) {
  DOM.winnerSection.style.display = 'block';
  DOM.todayWinner.textContent = winner.name;
  
  DOM.winnerInfo.innerHTML = `
    <p><strong>Nombre:</strong> ${winner.name}</p>
    <p><strong>Número Ganador:</strong> ${winner.number}</p>
    <p><strong>Premio:</strong> $${winner.prize} MXN</p>
    <p><strong>Fecha:</strong> ${new Date(winner.date).toLocaleDateString('es-MX')}</p>
    <p><strong>Estado:</strong> ${winner.paid ? 'Pagado' : 'Pendiente'}</p>
  `;
}

// Marcar ganador como pagado
async function markAsPaid() {
  if (!selectedWinnerId) return;
  
  if (!confirm("¿Marcar este premio como pagado?")) return;
  
  try {
    await updateDoc(doc(db, "winners", selectedWinnerId), {
      paid: true,
      paidDate: serverTimestamp()
    });
    
    alert("Premio marcado como pagado correctamente");
    DOM.markAsPaidBtn.disabled = true;
  } catch (error) {
    console.error("Error al marcar como pagado:", error);
    alert("Ocurrió un error al marcar como pagado");
  }
}
// Verificar autenticación
function checkAuth() {
  const auth = localStorage.getItem('auth');
  const authTime = localStorage.getItem('authTime');
  const currentTime = new Date().getTime();
  const sessionDuration = 10 * 60 * 1000; // 10 minutos en milisegundos
  
  if (!auth || auth !== "true" || !authTime || (currentTime - parseInt(authTime)) > sessionDuration) {
    localStorage.removeItem('auth');
    localStorage.removeItem('authTime');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
  }
}
// Configurar event listeners
function setupEventListeners() {
  // Cerrar sesión
  DOM.logoutBtn.addEventListener('click', logout);
  
  // ... (resto de tus event listeners)
}

// Función para cerrar sesión
function logout() {
  // Limpiar todos los datos de autenticación
  localStorage.removeItem('auth');
  localStorage.removeItem('authTime');
  localStorage.removeItem('userRole');
  
  // Redirigir a la página de login
  window.location.href = 'login.html';
}
// Verificar autenticación
function checkAuth() {
  const auth = localStorage.getItem('auth');
  const authTime = localStorage.getItem('authTime');
  const currentTime = new Date().getTime();
  const sessionDuration = 10 * 60 * 1000; // 10 minutos en milisegundos
  
  if (!auth || auth !== "true" || !authTime || (currentTime - parseInt(authTime)) > sessionDuration) {
    logout(); // Usamos la misma función de logout para limpiar
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
  loadTodayParticipants();
  checkTodayWinner();
});