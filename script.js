import { 
  db, collection, addDoc, getDocs, query, where, orderBy, limit 
} from './firebase.js';

// Elementos del DOM
const form = document.getElementById('raffleForm');
const winnerSection = document.getElementById('winnerSection');
const winnerInfo = document.getElementById('winnerInfo');
const winnerList = document.getElementById('winnerList');
const countdownElement = document.getElementById('countdown');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  loadPreviousWinners();
  checkDailyWinner();
  startCountdown();
});

// Manejo del formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const participant = {
    name: document.getElementById('name').value.trim(),
    curp: document.getElementById('curp').value.trim().toUpperCase(),
    phone: document.getElementById('phone').value.trim(),
    number: document.getElementById('number').value,
    date: new Date().toISOString()
  };

  if (!validateCURP(participant.curp)) {
    alert("Por favor ingresa una CURP válida");
    return;
  }

  try {
    await addDoc(collection(db, "participants"), participant);
    alert("¡Participación registrada con éxito!");
    form.reset();
  } catch (error) {
    console.error("Error al registrar participación:", error);
    alert("Ocurrió un error al registrar tu participación");
  }
});

// Validación de CURP
function validateCURP(curp) {
  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
  return regex.test(curp);
}

// Cargar ganadores anteriores
async function loadPreviousWinners() {
  const q = query(collection(db, "winners"), orderBy("date", "desc"), limit(5));
  const querySnapshot = await getDocs(q);
  
  winnerList.innerHTML = '';
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement('li');
    li.textContent = `${formatDate(data.date)} - ${data.name} (${data.prize} MXN)`;
    winnerList.appendChild(li);
  });
}

// Verificar ganador del día
async function checkDailyWinner() {
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
  }
}

// Mostrar ganador
function showWinner(winner) {
  winnerSection.classList.remove('hidden');
  winnerInfo.textContent = `${winner.name} - ${winner.prize} MXN`;
}

// Temporizador para el sorteo
function startCountdown() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now = new Date();
  const target = new Date();
  target.setHours(17, 0, 0, 0); // 5:00 PM
  
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }
  
  const diff = target - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  countdownElement.textContent = 
    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Formatear fecha
function formatDate(dateString) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-MX', options);
}