import { 
  db, collection, addDoc, getDocs, query, where, orderBy, limit 
} from './firebase.js';

// Elementos del DOM
const form = document.getElementById('raffleForm');
const winnerSection = document.getElementById('winnerSection');
const winnerInfo = document.getElementById('winnerInfo');
const winnerList = document.getElementById('winnerList');
const countdownElement = document.getElementById('countdown');
const termsCheckbox = document.getElementById('terms');
const termsModal = document.getElementById('termsModal');
const closeModal = document.querySelector('.close');
const showNumbersBtn = document.getElementById('showNumbersBtn');

// Mostrar modal de términos
termsCheckbox.addEventListener('click', (e) => {
  if (!termsCheckbox.checked) {
    termsModal.classList.remove('hidden');
  }
});

// Cerrar modal
closeModal.addEventListener('click', () => {
  termsModal.classList.add('hidden');
});

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
  if (e.target === termsModal) {
    termsModal.classList.add('hidden');
  }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  loadPreviousWinners();
  checkDailyWinner();
  startCountdown();
});

// Manejo del formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!termsCheckbox.checked) {
    alert("Debes aceptar los términos y condiciones");
    termsModal.classList.remove('hidden');
    return;
  }

  // Obtener y formatear el número
  let numberInput = document.getElementById('number').value;
  const number = numberInput.padStart(4, '0');
  
  const participant = {
    name: document.getElementById('name').value.trim(),
    curp: document.getElementById('curp').value.trim().toUpperCase(),
    phone: document.getElementById('phone').value.trim(),
    number: number,
    amount: document.querySelector('input[name="amount"]:checked').value,
    date: new Date().toISOString(),
    paid: false
  };

  // Validación de CURP
  if (!validateCURP(participant.curp)) {
    alert("Por favor ingresa una CURP válida");
    return;
  }

  // Validación de número único
  if (!await isNumberAvailable(number, new Date())) {
    alert("Este número ya ha sido seleccionado hoy. Por favor elija otro.");
    return;
  }

  try {
    await addDoc(collection(db, "participants"), participant);
    alert("¡Participación registrada! Ahora procede al pago.");
    initMercadoPagoPayment(participant);
  } catch (error) {
    console.error("Error al registrar participación:", error);
    alert("Ocurrió un error al registrar tu participación");
  }
});

// Función de validación de CURP
function validateCURP(curp) {
  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  if (!regex.test(curp)) {
    alert("Formato de CURP inválido. Debe tener 18 caracteres alfanuméricos.");
    return false;
  }
  return true;
}

// Verificar disponibilidad de número
async function isNumberAvailable(number, date) {
  try {
    const q = query(
      collection(db, "participants"), 
      where("number", "==", number),
      where("date", ">=", new Date(date).toISOString().split('T')[0])
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.error("Error verificando número:", error);
    return false;
  }
}

// Mostrar números disponibles
showNumbersBtn.addEventListener('click', async function() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, "participants"),
      where("date", ">=", today)
    );
    const snapshot = await getDocs(q);
    
    const takenNumbers = snapshot.docs.map(doc => doc.data().number);
    const availableCount = 10000 - takenNumbers.length;
    
    let message = `Hay ${availableCount} números disponibles de 10000.`;
    
    // Mostrar 5 números aleatorios disponibles
    if (availableCount > 0) {
      let suggestions = [];
      while (suggestions.length < Math.min(5, availableCount)) {
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        if (!takenNumbers.includes(randomNum) && !suggestions.includes(randomNum)) {
          suggestions.push(randomNum);
        }
      }
      message += "\n\nNúmeros sugeridos: " + suggestions.join(", ");
    }
    
    alert(message);
  } catch (error) {
    console.error("Error obteniendo números disponibles:", error);
    alert("Ocurrió un error al obtener los números disponibles");
  }
});

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
  winnerInfo.textContent = `${winner.name} - ${winner.prize} MXN - Número: ${winner.number}`;
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