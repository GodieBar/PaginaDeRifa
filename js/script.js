document.addEventListener('DOMContentLoaded', () => {
  // ================ ELEMENTOS DEL DOM ================
  const countdownEl = document.getElementById('countdown');
  const form = document.getElementById('raffleForm');
  const winnerList = document.getElementById('winnerList');
  const termsLink = document.getElementById('termsLink');
  const termsModal = document.getElementById('termsModal');
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = document.getElementById('modalOverlay');
  const acceptTerms = document.getElementById('acceptTerms');
  const termsCheckbox = document.getElementById('terms');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const clearFormBtn = document.getElementById('clearFormBtn');
  const formLoader = document.getElementById('formLoader');
  const notifyMeBtn = document.getElementById('notifyMe');
  const numbersProgress = document.getElementById('numbersProgress');
  const noWinnersMessage = document.getElementById('noWinnersMessage');
  const paymentModal = document.getElementById('paymentModal');
  const closePaymentModal = document.getElementById('closePaymentModal');

  // ================ ESTADO GLOBAL ================
  const state = {
    participants: JSON.parse(localStorage.getItem('participants')) || [],
    darkMode: localStorage.getItem('darkMode') === 'true',
    notificationPermission: Notification.permission
  };

  // ================ INICIALIZACIÓN ================
  initDarkMode();
  startCountdown();
  setupFormValidation();
  renderWinners(state.participants);
  checkNotificationPermission();

  // ================ EVENT LISTENERS ================
  // Radios de cantidad
  document.querySelectorAll('input[name="amount"]').forEach(radio => {
    radio.addEventListener('change', e => {
      const count = e.target.value === '20' ? 1 : 5;
      updateNumberInputs(count);
      updateNumbersProgress();
    });
  });

  // Modal términos
  if (termsLink) termsLink.addEventListener('click', showTermsModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  if (acceptTerms) acceptTerms.addEventListener('click', acceptTermsHandler);
  if (clearFormBtn) clearFormBtn.addEventListener('click', clearForm);
  if (darkModeToggle) darkModeToggle.addEventListener('click', toggleDarkMode);
  if (notifyMeBtn) notifyMeBtn.addEventListener('click', requestNotificationPermission);
  if (closePaymentModal) closePaymentModal.addEventListener('click', () => paymentModal.hidden = true);

  // Validación en tiempo real
  document.addEventListener('input', (e) => {
    if (e.target.matches('#name, #curp, #phone, .number-input')) {
      validateField(e.target);
    }
    if (e.target.classList.contains('number-input')) {
      updateNumbersProgress();
    }
  });

  // ================ FUNCIONES PRINCIPALES ================
  function initDarkMode() {
    if (state.darkMode) {
      document.body.classList.add('dark-mode');
      darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  }

  function startCountdown() {
    setInterval(() => {
      const now = new Date();
      let target = new Date();
      target.setHours(17, 0, 0, 0);
      if (now > target) target.setDate(target.getDate() + 1);
      
      const diff = target - now;
      if (diff < 0) return;

      const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const min = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
      const sec = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

      animateCountdownDigit('hours', hrs);
      animateCountdownDigit('minutes', min);
      animateCountdownDigit('seconds', sec);

      // Notificación cuando faltan 10 minutos
      if (diff <= 600000 && state.notificationPermission === 'granted') {
        showNotification('¡El sorteo está por comenzar!', { 
          body: 'Solo quedan 10 minutos para el próximo sorteo diario.' 
        });
      }
    }, 1000);
  }

  function animateCountdownDigit(id, newValue) {
    const element = document.getElementById(id);
    if (element.textContent !== newValue) {
      element.style.transform = 'rotateX(90deg)';
      setTimeout(() => {
        element.textContent = newValue;
        element.style.transform = 'rotateX(0deg)';
      }, 300);
    }
  }

  function updateNumberInputs(count) {
    const container = document.getElementById('numberInputsContainer');
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const group = document.createElement('div');
      group.className = 'form-group number-group';
      group.innerHTML = `
        <label class="form-label">Número ${i + 1}</label>
        <div class="number-input-container">
          <input type="text" name="raffleNumber" class="form-input number-input"
            pattern="\\d{4}" maxlength="4" required
            placeholder="0000" aria-label="Número de rifa ${i + 1}">
          <span class="input-icon"><i class="fas fa-hashtag"></i></span>
          <span class="input-valid-icon"><i class="fas fa-check"></i></span>
        </div>
        <div id="number-error-${i}" class="error-message">Por favor ingresa un número válido</div>
      `;
      container.appendChild(group);
    }
    
    document.getElementById('totalNumbers').textContent = count;
    numbersProgress.style.display = 'block';
  }

  function updateNumbersProgress() {
    const inputs = document.querySelectorAll('.number-input');
    const entered = Array.from(inputs).filter(input => input.value.length === 4).length;
    document.getElementById('enteredNumbers').textContent = entered;
  }

  function setupFormValidation() {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!validateForm()) return;
      
      const formData = getFormData();
      if (!formData) return;

      try {
        formLoader.style.display = 'block';
        document.getElementById('submitBtn').disabled = true;
        
        // Simular envío asíncrono
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        saveParticipant(formData);
        showSuccessModal(formData);
        resetForm();
      } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al procesar tu participación.');
      } finally {
        formLoader.style.display = 'none';
        document.getElementById('submitBtn').disabled = false;
      }
    });
  }

  function validateForm() {
    let isValid = true;
    
    // Validar campos individuales
    ['name', 'curp', 'phone'].forEach(id => {
      const element = document.getElementById(id);
      if (!validateField(element)) isValid = false;
    });
    
    // Validar números
    const numberInputs = document.querySelectorAll('.number-input');
    numberInputs.forEach((input, index) => {
      if (!input.checkValidity()) {
        input.parentElement.parentElement.classList.add('has-error');
        document.getElementById(`number-error-${index}`).style.display = 'block';
        isValid = false;
      }
    });
    
    // Validar términos
    if (!termsCheckbox.checked) {
      document.getElementById('terms-error').style.display = 'block';
      isValid = false;
    }
    
    return isValid;
  }

  function validateField(field) {
    const errorElement = document.getElementById(`${field.id}-error`);
    if (!field.checkValidity()) {
      field.parentElement.parentElement.classList.add('has-error');
      if (errorElement) errorElement.style.display = 'block';
      return false;
    } else {
      field.parentElement.parentElement.classList.remove('has-error');
      if (errorElement) errorElement.style.display = 'none';
      return true;
    }
  }

  function getFormData() {
    const name = document.getElementById('name').value.trim();
    const curp = document.getElementById('curp').value.trim().toUpperCase();
    const phone = document.getElementById('phone').value.trim();
    const amount = document.querySelector('input[name="amount"]:checked')?.value || '';
    const numberInputs = document.querySelectorAll('input[name="raffleNumber"]');
    const numbers = Array.from(numberInputs).map(input => input.value.trim());
    
    if (hasDuplicates(numbers)) {
      alert('No repitas números en tu selección.');
      return null;
    }

    return {
      name,
      curp: maskSensitiveData(curp, 4), // Enmascarar CURP
      phone: maskSensitiveData(phone, 4), // Enmascarar teléfono
      amount,
      numbers,
      date: new Date().toISOString(),
      ticketNumber: generateTicketNumber()
    };
  }

  function maskSensitiveData(str, visibleChars) {
    return str.slice(0, visibleChars) + '*'.repeat(str.length - visibleChars);
  }

  function generateTicketNumber() {
    const date = new Date();
    return `RD-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function saveParticipant(data) {
    state.participants.push(data);
    localStorage.setItem('participants', JSON.stringify(state.participants));
    renderWinners(state.participants);
    updateStats();
  }

  function renderWinners(participants) {
    if (!winnerList) return;
    
    winnerList.innerHTML = '';
    
    if (participants.length === 0) {
      noWinnersMessage.style.display = 'block';
      return;
    }
    
    noWinnersMessage.style.display = 'none';
    
    const lastWinners = participants.slice(-5).reverse();
    
    lastWinners.forEach((p, i) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'winner-card';
        div.style.animationDelay = `${i * 0.1}s`;
        
        // Determinar si es premio grande
        const isBigPrize = Number(p.amount) > 20;
        
        div.innerHTML = `
          <div class="winner-avatar">
            <span class="winner-initials">${getInitials(p.name)}</span>
          </div>
          <div class="winner-info">
            <h3 class="winner-name">${p.name}</h3>
            <div class="winner-details">
              <span class="winner-date">${formatDate(p.date)}</span>
              <span class="winner-prize">$${p.amount * 20} MXN</span>
            </div>
            <div class="winner-numbers">
              ${p.numbers.map(n => `<span class="number-badge">${n}</span>`).join('')}
            </div>
          </div>
          ${isBigPrize ? '<span class="badge-vip">VIP</span>' : ''}
        `;
        
        if (isBigPrize) div.classList.add('big-prize');
        winnerList.appendChild(div);
      }, i * 100);
    });
  }

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  function formatDate(dateString) {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  }

  function updateStats() {
    const totalParticipants = state.participants.length;
    const totalAmount = state.participants.reduce((sum, p) => sum + Number(p.amount), 0) * 20;
    
    document.getElementById('participantsCount').textContent = totalParticipants.toLocaleString();
    document.querySelector('.total-prize strong').textContent = `$${totalAmount.toLocaleString()} MXN`;
  }

  function showSuccessModal(data) {
    document.getElementById('ticketNumber').textContent = data.ticketNumber;
    document.getElementById('playedNumbers').textContent = data.numbers.join(', ');
    document.getElementById('drawDate').textContent = formatDate(data.date) + ' - 17:00 hrs';
    document.getElementById('totalAmount').textContent = `$${data.amount} MXN`;
    
    showConfetti();
    paymentModal.hidden = false;
  }

  function showConfetti() {
    const confetti = document.getElementById('confetti');
    confetti.style.display = 'block';
    
    // Configuración básica del confeti
    const ctx = confetti.getContext('2d');
    confetti.width = window.innerWidth;
    confetti.height = window.innerHeight;
    
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * confetti.width,
      y: Math.random() * confetti.height - confetti.height,
      size: Math.random() * 10 + 5,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      speed: Math.random() * 3 + 2,
      angle: Math.random() * Math.PI * 2
    }));
    
    function animate() {
      ctx.clearRect(0, 0, confetti.width, confetti.height);
      
      let stillActive = false;
      particles.forEach(p => {
        p.y += p.speed;
        p.x += Math.sin(p.angle) * 1.5;
        p.angle += 0.01;
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (p.y < confetti.height) stillActive = true;
      });
      
      if (stillActive) {
        requestAnimationFrame(animate);
      } else {
        confetti.style.display = 'none';
      }
    }
    
    animate();
    setTimeout(() => confetti.style.display = 'none', 5000);
  }

  function resetForm() {
    form.reset();
    updateNumberInputs(1);
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
  }

  function clearForm() {
    if (!confirm('¿Estás seguro de que quieres limpiar el formulario?')) return;
    resetForm();
  }

  function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', state.darkMode);
    darkModeToggle.innerHTML = state.darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  function showTermsModal(e) {
    e.preventDefault();
    termsModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    termsModal.hidden = true;
    document.body.style.overflow = '';
  }

  function acceptTermsHandler() {
    termsCheckbox.checked = true;
    document.getElementById('terms-error').style.display = 'none';
    closeModal();
  }

  function checkNotificationPermission() {
    state.notificationPermission = Notification.permission;
    if (state.notificationPermission === 'granted') {
      notifyMeBtn.textContent = 'Notificaciones activas';
      notifyMeBtn.disabled = true;
    }
  }

  function requestNotificationPermission() {
    if (state.notificationPermission === 'denied') {
      alert('Has bloqueado las notificaciones. Por favor, habilítalas manualmente en la configuración de tu navegador.');
      return;
    }
    
    Notification.requestPermission().then(permission => {
      state.notificationPermission = permission;
      if (permission === 'granted') {
        notifyMeBtn.textContent = 'Notificaciones activas';
        notifyMeBtn.disabled = true;
        showNotification('Notificaciones activadas', {
          body: 'Recibirás avisos importantes sobre los sorteos.'
        });
      }
    });
  }

  function showNotification(title, options) {
    if (state.notificationPermission !== 'granted') return;
    
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return;
    }
    
    new Notification(title, options);
  }

  function hasDuplicates(arr) {
    return new Set(arr).size !== arr.length;
  }

  // ================ INICIALIZACIÓN FINAL ================
  updateStats();
});

// ================ FUNCIONES DE UTILIDAD ================
// (Podrían moverse a un archivo aparte utils.js)
function validateCURP(curp) {
  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]{2}$/;
  return regex.test(curp);
}

function validatePhone(phone) {
  return /^\d{10}$/.test(phone);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN' 
  }).format(amount);
}