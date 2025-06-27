function initMercadoPagoPayment(participant) {
  const mp = new MercadoPago('TU_PUBLIC_KEY', {
    locale: 'es-MX'
  });
  
  const paymentButton = document.getElementById('payment-button');
  const submitBtn = document.getElementById('submitBtn');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Procesando...';

  // En producción, reemplazar con llamada a tu backend
  createPreference(participant)
    .then(preference => {
      paymentButton.classList.remove('hidden');
      submitBtn.classList.add('hidden');
      
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
    })
    .catch(error => {
      console.error('Error:', error);
      alert(`Error: ${error.message || 'Ocurrió un error al procesar el pago'}`);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Participar';
    });
}

// Esta función simula la creación de la preferencia
// En producción, deberías hacer una llamada a tu backend
async function createPreference(participant) {
  // Simulamos un ID de documento
  const docId = 'simulatedDocId_' + Date.now();
  
  return {
    id: 'simulatedPrefId_' + Date.now(),
    items: [{
      title: `Participación en rifa - ${participant.name}`,
      unit_price: parseFloat(participant.amount),
      quantity: 1,
      currency_id: 'MXN'
    }],
    external_reference: docId,
    back_urls: {
      success: window.location.href,
      failure: window.location.href,
      pending: window.location.href
    },
    auto_return: 'approved'
  };
}