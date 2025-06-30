/**
 * Lógica principal mejorada del frontend
 * Cambios realizados:
 * - Validación mejorada de formularios
 * - Manejo de estado más robusto
 * - Mejor integración con MercadoPago
 */

import { 
  db, collection, addDoc, getDocs, 
  query, where, orderBy, limit, doc, getDoc
} from './firebase.js';

// Elementos del DOM con nombres más descriptivos
const DOM = {
  form: document.getElementById('raffleForm'),
  winnerSection: document.getElementById('winnerSection'),
  winnerInfo: document.getElementById('winnerInfo'),
  winnerList: document.getElementById('winnerList'),
  countdown: document.getElementById('countdown'),
  termsCheckbox: document.getElementById('terms'),
  termsModal: document.getElementById('termsModal'),
  closeModal: document.querySelector('.close'),
  showNumbersBtn: document.getElementById('showNumbersBtn'),
  nameInput: document.getElementById('name'),
  curpInput: document.getElementById('curp'),
  phoneInput: document.getElementById('phone'),
  numberInput: document.getElementById('number'),
  amountOptions: document.querySelectorAll('input[name="amount"]'),
  submitBtn: document.getElementById('submitBtn'),
  paymentButton: document.getElementById('payment-button')
};

// Estado de la aplicación
const AppState = {
  selectedNumbers: [],
  paymentProcessing: false,
  currentParticipant: null
};

// Inicialización mejorada
async function initApp() {
  try {
    await Promise.all([
      loadPreviousWinners(),
      checkDailyWinner(),
      startCountdown()
    ]);
    
    // Verificar si hay parámetros de éxito en la URL (después de pago)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('payment_success')) {
      showPaymentSuccessMessage();
    }
    
    setupEventListeners();
  } catch (error) {
    console.error("Error inicializando la aplicación:", error);
    showErrorAlert("Error al cargar la aplicación. Por favor recarga la página.");
  }
}

// Configuración de event listeners mejorada
function setupEventListeners() {
  DOM.form.addEventListener('submit', handleFormSubmit);
  DOM.termsCheckbox.addEventListener('click', handleTermsClick);
  DOM.closeModal.addEventListener('click', closeTermsModal);
  DOM.showNumbersBtn.addEventListener('click', showAvailableNumbers);
  
  // Event listeners para los radio buttons de cantidad
  DOM.amountOptions.forEach(option => {
    option.addEventListener('change', (e) => {
      updateNumberInputs(parseInt(e.target.value));
    });
  });
  
  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === DOM.termsModal) {
      closeTermsModal();
    }
  });
}

// Manejo del formulario mejorado
async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (!DOM.termsCheckbox.checked) {
    showWarningAlert("Debes aceptar los términos y condiciones");
    DOM.termsModal.classList.remove('hidden');
    return;
  }

  const participant = collectFormData();
  
  if (!validateParticipant(participant)) {
    return;
  }

  try {
    DOM.submitBtn.disabled = true;
    DOM.submitBtn.textContent = 'Registrando...';
    
    // Verificar disponibilidad de números
    const numbersAvailable = await checkNumbersAvailability(participant);
    if (!numbersAvailable) {
      showWarningAlert("Uno o más números ya están ocupados. Por favor elige otros.");
      return;
    }
    
    // Registrar participante
    const docRef = await registerParticipant(participant);
    participant.id = docRef.id;
    AppState.currentParticipant = participant;
    
    showSuccessAlert("¡Participación registrada! Ahora procede al pago.");
    initMercadoPagoPayment(participant);
  } catch (error) {
    console.error("Error al registrar participación:", error);
    showErrorAlert("Ocurrió un error al registrar tu participación. Por favor intenta nuevamente.");
  } finally {
    if (!AppState.paymentProcessing) {
      DOM.submitBtn.disabled = false;
      DOM.submitBtn.textContent = 'Participar';
    }
  }
}

// Función mejorada para recolectar datos del formulario
function collectFormData() {
  const selectedAmount = document.querySelector('input[name="amount"]:checked').value;
  const numbers = Array.from(document.querySelectorAll('input[name="raffleNumber"]'))
    .map(input => input.value.padStart(4, '0'));
    
  return {
    name: DOM.nameInput.value.trim(),
    curp: DOM.curpInput.value.trim().toUpperCase(),
    phone: DOM.phoneInput.value.trim(),
    numbers: numbers,
    amount: parseInt(selectedAmount),
    date: new Date().toISOString(),
    paid: false,
    paymentMethod: 'pending'
  };
}

// ... (resto de las mejoras en el frontend)

