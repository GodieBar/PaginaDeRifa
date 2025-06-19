const express = require('express');
const mercadopago = require('mercadopago');
const admin = require('firebase-admin');
const cors = require('cors');
const app = express();

// Configura CORS para desarrollo
app.use(cors({
  origin: ['http://localhost:5500', 'https://tudominio.com']
}));

// Configura Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Configura Mercado Pago
mercadopago.configure({
  access_token: 'TEST-123456789012345678901234567890-123456'
});

// Middleware para parsear JSON
app.use(express.json());

// Endpoint para crear preferencias
app.post('/create-preference', async (req, res) => {
  try {
    const { amount, description, external_reference } = req.body;
    
    // Validar datos básicos
    if (!amount || !description || !external_reference) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Crear preferencia
    const preference = {
      items: [{
        title: description,
        unit_price: parseFloat(amount),
        quantity: 1,
        currency_id: 'MXN'
      }],
      external_reference,
      back_urls: {
        success: 'https://tudominio.com/success.html',
        failure: 'https://tudominio.com/error.html',
        pending: 'https://tudominio.com/pending.html'
      },
      auto_return: 'approved',
      notification_url: 'https://tudominio.com/webhook'
    };

    const response = await mercadopago.preferences.create(preference);
    
    // Guardar ID de preferencia en Firebase
    await db.collection('payments').doc(external_reference).set({
      preferenceId: response.body.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    res.json({ id: response.body.id });
    
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    res.status(500).json({ error: 'Error al crear preferencia de pago' });
  }
});

// Webhook para notificaciones de pago
app.post('/webhook', async (req, res) => {
  try {
    const paymentId = req.query.id || req.body.data.id;
    if (!paymentId) return res.status(400).send('ID de pago requerido');

    // Obtener información del pago
    const payment = await mercadopago.payment.findById(paymentId);
    const paymentData = payment.body;
    
    // Actualizar Firebase si el pago fue aprobado
    if (paymentData.status === 'approved') {
      const externalRef = paymentData.external_reference;
      
      await db.collection('participants').doc(externalRef).update({
        paid: true,
        paymentId: paymentId,
        paymentDate: new Date().toISOString(),
        paymentStatus: 'approved'
      });
      
      await db.collection('payments').doc(externalRef).update({
        status: 'approved',
        updatedAt: new Date().toISOString()
      });
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).send('Error procesando notificación');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});