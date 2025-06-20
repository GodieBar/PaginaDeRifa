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
    return;
  }

  const participant = {
    name: document.getElementById('name').value.trim(),
    curp: document.getElementById('curp').value.trim().toUpperCase(),
    phone: document.getElementById('phone').value.trim(),
    number: document.getElementById('number').value.padStart(4, '0'),
    amount: document.querySelector('input[name="amount"]:checked').value,
    date: new Date().toISOString(),
    paid: false // Inicialmente no pagado
  };

  // Validación de CURP mejorada
  if (!validateCURP(participant.curp)) {
    alert("Por favor ingresa una CURP válida");
    return;
  }

  // Validación de número único (opcional)
  try {
    const q = query(collection(db, "participants"), 
      where("number", "==", participant.number),
      where("date", ">=", new Date().toISOString().split('T')[0])
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      alert("Este número ya ha sido seleccionado hoy");
      return;
    }
  } catch (error) {
    console.error("Error verificando número:", error);
  }

  try {
    await addDoc(collection(db, "participants"), participant);
    alert("¡Participación registrada! Ahora procede al pago.");
    document.getElementById('continueToPayment').click();
  } catch (error) {
    console.error("Error al registrar participación:", error);
    alert("Ocurrió un error al registrar tu participación");
  }
});

// Función mejorada de validación de CURP
function validateCURP(curp) {
  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  if (!regex.test(curp)) {
    alert("Formato de CURP inválido. Debe tener 18 caracteres alfanuméricos.");
    return false;
  }

  // Validación básica de fecha
  const year = parseInt(curp.substr(4, 2));
  const month = parseInt(curp.substr(6, 2));
  const day = parseInt(curp.substr(8, 2));
  
  if (month < 1 || month > 12) {
    alert("Mes inválido en la CURP");
    return false;
  }
  
  if (day < 1 || day > 31) {
    alert("Día inválido en la CURP");
    return false;
  }
  
  return true;
}
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

// Y modifica el submit del formulario para usarla:
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // ... código anterior ...
  
  // Verificar disponibilidad del número
  if (!await isNumberAvailable(number, new Date())) {
    alert("Este número ya ha sido seleccionado hoy. Por favor elija otro.");
    return;
  }

  // ... resto del código ...
});
async function showAvailableNumbers() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, "participants"),
      where("date", ">=", today)
    );
    const snapshot = await getDocs(q);
    
    const takenNumbers = snapshot.docs.map(doc => doc.data().number);
    const availableCount = 10000 - takenNumbers.length;
    
    alert(`Hay ${availableCount} números disponibles de 10000.`);
    
    // Opcional: Mostrar 5 números aleatorios disponibles
    if (availableCount > 0) {
      let suggestions = [];
      while (suggestions.length < Math.min(5, availableCount)) {
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        if (!takenNumbers.includes(randomNum) && !suggestions.includes(randomNum)) {
          suggestions.push(randomNum);
        }
      }
      console.log("Sugerencias de números disponibles:", suggestions);
    }
  } catch (error) {
    console.error("Error obteniendo números disponibles:", error);
  }
}

// Agrega un botón para esta función en tu HTML
<button type="button" onclick="showAvailableNumbers()">Ver números disponibles</button>

// Resto del código permanece igual...
// [Las funciones loadPreviousWinners, checkDailyWinner, etc. del código original]