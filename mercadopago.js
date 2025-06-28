/**
 * Integración mejorada con MercadoPago
 * Cambios realizados:
 * - Manejo de errores robusto
 * - Estados de carga mejorados
 * - Validación de datos
 * - Compatibilidad con backend real
 */

// Configuración global
const MP_CONFIG = {
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || 'TEST-12345678-1234-1234-1234-123456789012',
  locale: 'es-MX',
  currency: 'MXN',
  autoOpen: true,
  theme: {
    elementsColor: '#3498db',
    headerColor: '#3498db'
  }
};

/**
 * Inicializa el pago con MercadoPago
 * @param {Object} participant - Datos del participante
 * @param {Function} onSuccess - Callback para éxito
 * @param {Function} onError - Callback para error
 */
export async function initMercadoPagoPayment(participant, onSuccess, onError) {
  try {
    // Validar datos del participante
    if (!participant || typeof participant !== 'object') {
      throw new Error('Datos del participante inválidos');
    }
    
    const requiredFields = ['name', 'amount', 'id'];
    for (const field of requiredFields) {
      if (!participant[field]) {
        throw new Error(`Campo requerido faltante: ${field}`);
      }
    }
    
    // Configurar elementos del DOM
    const paymentButton = document.getElementById('payment-button');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!paymentButton || !submitBtn) {
      throw new Error('Elementos del DOM no encontrados');
    }
    
    // Mostrar estado de carga
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';
    paymentButton.innerHTML = '<div class="loading"></div>';
    
    // Obtener preferencia de pago del backend
    const preference = await createPaymentPreference(participant);
    
    // Inicializar checkout de MercadoPago
    const mp = new MercadoPago(MP_CONFIG.publicKey, {
      locale: MP_CONFIG.locale
    });
    
    // Renderizar botón de pago
    const checkout = mp.checkout({
      preference: {
        id: preference.id
      },
      render: {
        container: '#payment-button',
        label: 'Pagar con Mercado Pago',
      },
      theme: MP_CONFIG.theme,
      autoOpen: MP_CONFIG.autoOpen
    });
    
    // Manejar eventos del checkout
    checkout.on('onReady', () => {
      submitBtn.style.display = 'none';
      paymentButton.style.display = 'block';
    });
    
    checkout.on('onError', error => {
      console.error('Error en MercadoPago:', error);
      if (onError) onError(error);
      resetPaymentButton(submitBtn, paymentButton);
    });
    
  } catch (error) {
    console.error('Error al inicializar pago:', error);
    if (onError) onError(error);
    resetPaymentButton(submitBtn, paymentButton);
  }
}

/**
 * Crear preferencia de pago (conexión con backend)
 * @param {Object} participant - Datos del participante
 * @returns {Promise<Object>} - Preferencia de pago
 */
async function createPaymentPreference(participant) {
  try {
    const response = await fetch('/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: participant.amount,
        description: `Participación en rifa - ${participant.name}`,
        external_reference: participant.id
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear preferencia de pago');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    throw error;
  }
}

/**
 * Restablecer botón de pago a estado inicial
 */
function resetPaymentButton(submitBtn, paymentButton) {
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Participar';
    submitBtn.style.display = 'block';
  }
  
  if (paymentButton) {
    paymentButton.style.display = 'none';
    paymentButton.innerHTML = '';
  }
}

/**
 * Verificar estado de pago (para uso después de redirección)
 */
export async function verifyPaymentStatus(paymentId) {
  try {
    const response = await fetch(`/verify-payment?id=${paymentId}`);
    
    if (!response.ok) {
      throw new Error('Error al verificar pago');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error verificando pago:', error);
    throw error;
  }
}

// Estilos para el loading (pueden ir en CSS)
const style = document.createElement('style');
style.textContent = `
  .loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(0,0,0,.1);
    border-radius: 50%;
    border-top-color: #3498db;
    animation: spin 1s ease-in-out infinite;
    margin: 0 auto;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);