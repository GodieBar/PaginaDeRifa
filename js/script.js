  document.addEventListener('DOMContentLoaded', () => {
    const countdownEl = document.getElementById('countdown');
    const form = document.getElementById('raffleForm');
    const winnerList = document.getElementById('winnerList');

    const termsLink = document.getElementById('termsLink');
    const termsModal = document.getElementById('termsModal');
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.getElementById('modalOverlay');
    const acceptTerms = document.getElementById('acceptTerms');
    const termsCheckbox = document.getElementById('terms');

    startCountdown();

    // Radios de cantidad
    document.querySelectorAll('input[name="amount"]').forEach(radio => {
      radio.addEventListener('change', e => {
        const count = e.target.value === '20' ? 1 : 5;
        updateNumberInputs(count);
      });
    });

    // Modal términos
    if (termsLink) {
      termsLink.addEventListener('click', e => {
        e.preventDefault();
        termsModal.hidden = false;
        document.body.style.overflow = 'hidden';
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', closeModal);
    }

    if (acceptTerms) {
      acceptTerms.addEventListener('click', () => {
        termsCheckbox.checked = true;
        closeModal();
      });
    }

    function closeModal() {
      termsModal.hidden = true;
      document.body.style.overflow = '';
    }

    // Generar inputs de números inicial
    updateNumberInputs(1);

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
          </div>
        `;
        container.appendChild(group);
      }
    }

    form.addEventListener('submit', e => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const curp = document.getElementById('curp').value.trim().toUpperCase();
      const phone = document.getElementById('phone').value.trim();
      const amount = document.querySelector('input[name="amount"]:checked')?.value || '';
      const numberInputs = document.querySelectorAll('input[name="raffleNumber"]');
      const numbers = Array.from(numberInputs).map(input => input.value.trim());
      const termsAccepted = termsCheckbox.checked;

      if (!name || !curp || !phone || !amount || numbers.some(n => n === '') || !termsAccepted) {
        alert('Por favor, completa todos los campos y acepta los términos.');
        return;
      }

      if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(curp)) {
        alert('CURP inválida.');
        return;
      }

      if (!/^\d{10}$/.test(phone)) {
        alert('Teléfono inválido. Deben ser 10 dígitos.');
        return;
      }

      if (hasDuplicates(numbers)) {
        alert('No repitas números en tu selección.');
        return;
      }

      saveParticipant({
        name,
        curp,
        phone,
        amount,
        numbers
      });

      form.reset();
      updateNumberInputs(1);
      alert('¡Participación registrada!');
    });

    function hasDuplicates(arr) {
      return new Set(arr).size !== arr.length;
    }

    function saveParticipant(data) {
      const participants = JSON.parse(localStorage.getItem('participants')) || [];
      participants.push(data);
      localStorage.setItem('participants', JSON.stringify(participants));
      renderWinners(participants);
    }

    function renderWinners(participants) {
      if (!winnerList) return;
      winnerList.innerHTML = '';

      const lastFive = participants.slice(-5).reverse();

      lastFive.forEach(p => {
        const div = document.createElement('div');
        div.className = 'winner-card';
        div.innerHTML = `
          <p><strong>${p.name}</strong></p>
          <p>Tel: ${p.phone}</p>
          <p>Números: ${p.numbers.join(', ')}</p>
        `;
        winnerList.appendChild(div);
      });
    }

    function startCountdown() {
      setInterval(() => {
        const now = new Date();
        let target = new Date();
        target.setHours(17, 0, 0, 0);
        if (now > target) {
          target.setDate(target.getDate() + 1);
        }
        const diff = target - now;
        if (diff < 0) return;

        const hrs = String(Math.floor(diff / 1000 / 60 / 60)).padStart(2, '0');
        const min = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
        const sec = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

        const digits = [hrs, min, sec];
        const spans = document.querySelectorAll('#countdown span');
        spans.forEach((el, i) => {
          el.textContent = digits[i] || '00';
        });
      }, 1000);
    }

    // Cargar ganadores al inicio
    const storedParticipants = JSON.parse(localStorage.getItem('participants')) || [];
    renderWinners(storedParticipants);
  });
