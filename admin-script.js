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

// Función para cerrar sesión
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Verificar autenticación
function checkAuth() {
  const auth = localStorage.getItem('auth');
  const authTime = localStorage.getItem('authTime');
  const currentTime = new Date().getTime();
  const sessionDuration = 10 * 60 * 1000; // 10 minutos
  
  if (!auth || auth !== "true" || !authTime || (currentTime - parseInt(authTime)) > sessionDuration) {
    logout();
  }
}

// Configurar event listeners
function setupEventListeners() {
  DOM.logoutBtn.addEventListener('click', logout);
  DOM.registerBtn.addEventListener('click', () => {
    DOM.quickRegisterModal.style.display = 'flex';
    DOM.quickName.focus();
  });
  
  DOM.closeModal.addEventListener('click', () => {
    DOM.quickRegisterModal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === DOM.quickRegisterModal) {
      DOM.quickRegisterModal.style.display = 'none';
    }
  });
  
  DOM.quickRegisterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await registerParticipant();
  });
  
  DOM.drawWinnerBtn.addEventListener('click', drawWinner);
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
  
  onSnapshot(q, (snapshot) => {
    todayParticipantsCount = 0;
    todayParticipantsAmount = 0;
    DOM.participantsTable.innerHTML = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      todayParticipantsCount++;
      todayParticipantsAmount += parseInt(data.amount);
      
      const date = data.date.toDate ? data.date.toDate() : new Date(data.date);
      const timeString = date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const row = DOM.participantsTable.insertRow();
      row.innerHTML = `
        <td>${data.name}</td>
        <td>${data.number}</td>
        <td>$${data.amount} MXN</td>
        <td>${timeString}</td>
      `;
    });
    
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
    
    if (!name || name.length < 3) {
      alert("Por favor ingresa un nombre válido (mínimo 3 letras)");
      return;
    }
    
    if (!number || number.length !== 4) {
      alert("Por favor ingresa un número de 4 dígitos");
      return;
    }

    const participant = {
      name: name,
      number: number,
      amount: parseInt(amount),
      date: serverTimestamp(),
      paid: false
    };
    
    await addDoc(collection(db, "participants"), participant);
    
    DOM.quickRegisterForm.reset();
    DOM.quickRegisterModal.style.display = 'none';
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
  
  const qParticipants = query(
    collection(db, "participants"),
    where("date", ">=", today.toISOString())
  );
  
  const participantsSnapshot = await getDocs(qParticipants);
  
  if (participantsSnapshot.empty) {
    alert("No hay participantes hoy");
    return;
  }
  
  const participants = participantsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  const winnerIndex = Math.floor(Math.random() * participants.length);
  const winner = participants[winnerIndex];
  const prize = calculatePrize(participants.length);
  
  const winnerRef = await addDoc(collection(db, "winners"), {
    ...winner,
    prize: prize,
    date: serverTimestamp(),
    paid: false
  });
  
  selectedWinnerId = winnerRef.id;
  
  showWinner({
    ...winner,
    prize: prize
  });
  
  DOM.drawWinnerBtn.disabled = true;
  DOM.drawWinnerBtn.textContent = "Sorteo Realizado";
  
  alert(`¡Ganador seleccionado!\n\nNombre: ${winner.name}\nNúmero: ${winner.number}\nPremio: $${prize} MXN`);
}

// Calcular premio
function calculatePrize(participantCount) {
  const basePrize = 3000;
  const extra = Math.min(participantCount * 20, 2000);
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

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
  loadTodayParticipants();
  checkTodayWinner();
});