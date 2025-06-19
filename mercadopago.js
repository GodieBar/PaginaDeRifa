// Configuración de Mercado Pago
document.addEventListener('DOMContentLoaded', function() {
  // Reemplaza con tu public key de Mercado Pago
  const mp = new MercadoPago('TU_PUBLIC_KEY', {
    locale: 'es-MX' // Puedes cambiar según el país
  });
  
  const continueBtn = document.getElementById('continueToPayment');
  const paymentButton = document.getElementById('payment-button');
  const raffleForm = document.getElementById('raffleForm');
  
  continueBtn.addEventListener('click', async function() {
    if(!raffleForm.checkValidity()) {
      raffleForm.reportValidity();
      return;
    }
    
    // Obtener datos del formulario
    const formData = new FormData(raffleForm);
    const amount = formData.get('amount');
    const name = formData.get('name');
    
    // Mostrar botón de pago y ocultar continuar
    continueBtn.classList.add('hidden');
    
    // Crear preferencia de pago (esto normalmente se haría en tu backend)
    try {
      const response = await fetch('https://tu-backend.com/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          description: `Participación en rifa diaria - ${name}`,
          quantity: amount === '20' ? 1 : 5
        })
      });
      
      const preference = await response.json();
      
      // Crear botón de pago
      paymentButton.classList.remove('hidden');
      mp.checkout({
        preference: {
          id: preference.id
        },
        render: {
          container: '#payment-button',
          label: 'Pagar con Mercado Pago',
        }
      });
      
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al procesar el pago');
      continueBtn.classList.remove('hidden');
    }
  });
});