/**
 * Configuración y inicialización de Firebase Firestore
 * Exporta las funciones necesarias para interactuar con la base de datos
 */

// Importación de módulos desde el CDN de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore,          // Obtener instancia de Firestore
  collection,            // Referencia a colección
  addDoc,               // Agregar documento
  getDocs,              // Obtener documentos
  query,                // Crear consulta
  where,               // Condición WHERE
  orderBy,            // Ordenar resultados
  limit,              // Limitar resultados
  updateDoc,         // Actualizar documento
  doc               // Referencia a documento
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración de Firebase (datos sensibles deben ir en variables de entorno)
const firebaseConfig = {
  apiKey: "AIzaSyDpT-6nQxRVy8OWTQYIBTV3kqbv4YoYc7Q",
  authDomain: "rifa-6.firebaseapp.com",
  projectId: "rifa-6",
  storageBucket: "rifa-6.firebasestorage.app",
  messagingSenderId: "747276157838",
  appId: "1:747276157838:web:dae9294b8391417f3f1adf",
  measurementId: "G-ZWKJ5ZNG4Q"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);

// Obtener instancia de Firestore
const db = getFirestore(app);

// Exportar funcionalidades necesarias
export { 
  db,            // Instancia de Firestore
  collection,    // Para crear referencias a colecciones
  addDoc,       // Para añadir nuevos documentos
  getDocs,      // Para leer documentos
  query,       // Para crear consultas
  where,      // Para condiciones WHERE
  orderBy,   // Para ordenar resultados
  limit,     // Para limitar cantidad de resultados
  updateDoc, // Para actualizar documentos existentes
  doc       // Para obtener referencia a documento específico
};