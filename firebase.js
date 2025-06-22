import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDpT-6nQxRVy8OWTQYIBTV3kqbv4YoYc7Q",
  authDomain: "rifa-6.firebaseapp.com",
  projectId: "rifa-6",
  storageBucket: "rifa-6.firebasestorage.app",
  messagingSenderId: "747276157838",
  appId: "1:747276157838:web:dae9294b8391417f3f1adf",
  measurementId: "G-ZWKJ5ZNG4Q",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  doc
};