/**
 * Backend mejorado para la Rifa Diaria
 * Cambios realizados:
 * - Validaciones más robustas
 * - Manejo de errores mejorado
 * - Variables de entorno para datos sensibles
 * - Documentación más clara
 */

require('dotenv').config(); // Para variables de entorno
const express = require('express');
const mercadopago = require('mercadopago');
const admin = require('firebase-admin');
const cors = require('cors');
const app = express();

// Configuración mejorada de CORS
const allowedOrigins = [
  'http://localhost:5500',
  'https://tudominio.com',
  'https://www.tudominio.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Configuración segura de Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!serviceAccount.project_id) {
  console.error('Error: Configuración de Firebase no encontrada');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

// Configuración segura de MercadoPago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-1234567890123456-123456-123456789012345678901234567890'
});

// Middlewares mejorados
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * Endpoint mejorado para crear preferencias de pago
 * Validaciones adicionales y manejo de errores
 */
app.post('/create-preference', async (req, res) => {
  try {
    const { amount, description, external_reference } = req.body;
    
    // Validaciones mejoradas
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        error: 'Monto inválido o no proporcionado' 
      });
    }
    
    if (!description || description.trim().length < 5) {
      return res.status(400).json({ 
        error: 'Descripción muy corta (mínimo 5 caracteres)' 
      });
    }
    
    if (!external_reference || typeof external_reference !== 'string') {
      return res.status(400).json({ 
        error: 'Referencia externa inválida' 
      });
    }

    // Crear preferencia con más detalles
    const preference = {
      items: [{
        title: `Rifa Diaria - ${description.substring(0, 50)}`,
        description: `Participación en la rifa diaria - ${description}`,
        unit_price: parseFloat(amount),
        quantity: 1,
        currency_id: 'MXN'
      }],
      external_reference,
      back_urls: {
        success: `${process.env.BASE_URL}/success.html`,
        failure: `${process.env.BASE_URL}/error.html`,
        pending: `${process.env.BASE_URL}/pending.html`
      },
      auto_return: 'approved',
      notification_url: `${process.env.BASE_URL}/webhook`,
      payment_methods: {
        excluded_payment_types: [
          { id: 'atm' } // Excluir pagos en efectivo en terminales
        ],
        installments: 1 // Sin pagos a plazos
      }
    };

    const response = await mercadopago.preferences.create(preference);
    
    // Guardar en Firestore con más detalles
    await db.collection('payments').doc(external_reference).set({
      preferenceId: response.body.id,
      status: 'pending',
      amount: parseFloat(amount),
      description: description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      id: response.body.id,
      sandbox_init_point: response.body.sandbox_init_point,
      init_point: response.body.init_point
    });
    
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    res.status(500).json({ 
      error: 'Error al procesar el pago',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ... (resto del código del backend)