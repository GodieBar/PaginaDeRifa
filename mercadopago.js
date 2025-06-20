document.addEventListener('DOMContentLoaded', function() {
  const mp = new MercadoPago('TU_PUBLIC_KEY', {
    locale: 'es-MX'
  });
  
  const continueBtn = document.getElementById('continueToPayment');
  const paymentButton = document.getElementById('payment-button');
  const raffleForm = document.getElementById('raffleForm');
  
  continueBtn.addEventListener('click', async function() {
    if(!raffleForm.checkValidity()) {
      raffleForm.reportValidity();
      return;
    }
    
    continueBtn.disabled = true;
    continueBtn.textContent = 'Procesando...';
    
    try {
      const participant = {
        name: document.getElementById('name').value.trim(),
        curp: document.getElementById('curp').value.trim().toUpperCase(),
        phone: document.getElementById('phone').value.trim(),
        number: document.getElementById('number').value.padStart(4, '0'),
        amount: document.querySelector('input[name="amount"]:checked').value,
        date: new Date().toISOString(),
        paid: false
      };

      if (!validateCURP(participant.curp)) {
        throw new Error("CURP inválida");
      }

      const docRef = await addDoc(collection(db, "participants"), participant);
      
      const response = await fetch('https://tu-backend.com/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: participant.amount,
          description: `Participación en rifa - ${participant.name}`,
          external_reference: docRef.id
        })
      });
      
      const preference = await response.json();
      
      paymentButton.classList.remove('hidden');
      continueBtn.classList.add('hidden');
      
      mp.checkout({
        preference: {
          id: preference.id
        },
        render: {
          container: '#payment-button',
          label: 'Pagar con Mercado Pago',
        },
        autoOpen: true
      });
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Ocurrió un error al procesar el pago'}`);
      continueBtn.disabled = false;
      continueBtn.textContent = 'Continuar al pago';
    }
  });
});

function validateCURP(curp) {
  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  return regex.test(curp);
}