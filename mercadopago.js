document.addEventListener('DOMContentLoaded', function() {
  // Configuración de Mercado Pago (usa tu public key)
  const mp = new MercadoPago('APP_USR-12345678-1234-1234-1234-123456789012', {
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
    
    // Deshabilitar botón para evitar múltiples clics
    continueBtn.disabled = true;
    continueBtn.textContent = 'Procesando...';
    
    try {
      // 1. Obtener datos del formulario
      const participant = {
        name: document.getElementById('name').value.trim(),
        curp: document.getElementById('curp').value.trim().toUpperCase(),
        phone: document.getElementById('phone').value.trim(),
        number: document.getElementById('number').value.padStart(4, '0'),
        amount: document.querySelector('input[name="amount"]:checked').value,
        date: new Date().toISOString(),
        paid: false
      };

      // 2. Validación adicional de CURP
      if (!validateCURP(participant.curp)) {
        throw new Error("CURP inválida");
      }

      // 3. Guardar en Firebase (primero sin pago)
      const docRef = await addDoc(collection(db, "participants"), participant);
      
      // 4. Crear preferencia de pago (simulado - en producción usa tu backend)
      const preference = {
        items: [
          {
            title: `Participación en rifa - ${participant.name}`,
            unit_price: parseFloat(participant.amount),
            quantity: 1,
            currency_id: "MXN"
          }
        ],
        external_reference: docRef.id, // ID del documento en Firebase
        notification_url: "https://tusitio.com/webhook", // Configura esto en producción
        back_urls: {
          success: "https://tusitio.com/success",
          failure: "https://tusitio.com/failure",
          pending: "https://tusitio.com/pending"
        },
        auto_return: "approved"
      };

      // 5. Mostrar botón de pago
      paymentButton.classList.remove('hidden');
      continueBtn.classList.add('hidden');
      
      // 6. Crear botón de Mercado Pago
      mp.checkout({
        preference: preference,
        render: {
          container: '#payment-button',
          label: 'Pagar con Mercado Pago',
        },
        autoOpen: true // Abre directamente el checkout
      });
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Ocurrió un error al procesar el pago'}`);
      continueBtn.disabled = false;
      continueBtn.textContent = 'Continuar al pago';
    }
  });
});

// Función de validación de CURP (repetida por si acaso)
function validateCURP(curp) {
  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  return regex.test(curp);
}