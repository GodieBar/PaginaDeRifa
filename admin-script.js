import { 
  db, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc 
} from './firebase.js';

// Elementos del DOM
const drawWinnerBtn = document.getElementById('drawWinner');
const exportDataBtn = document.getElementById('exportData');
const markAsPaidBtn = document.getElementById('markAsPaid');
const winnersTable = document.getElementById('winnersTable').getElementsByTagName('tbody')[0];

// Variables
let selectedWinnerId = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadWinners();
});

// Eventos
drawWinnerBtn.addEventListener('click', drawWinner);
exportDataBtn.addEventListener('click', exportData);
markAsPaidBtn.addEventListener('click', markAsPaid);

// Cargar estadísticas
async function loadStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Participantes de hoy
  const qParticipants = query(
    collection(db, "participants"),
    where("date", ">=", today.toISOString())
  );
  const participantsSnapshot = await getDocs(qParticipants);
  document.getElementById('todayParticipants').textContent = participantsSnapshot.size;

  // Premio acumulado
  const qWinners = query(collection(db, "winners"));
  const winnersSnapshot = await getDocs(qWinners);
  let total = 0;
  winnersSnapshot.forEach(doc => {
    total += parseInt(doc.data().prize) || 0;
  });
  document.getElementById('totalPrize').textContent = `${total} MXN`;
}

// Cargar ganadores
async function loadWinners() {
  const q = query(collection(db, "winners"), orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);

  winnersTable.innerHTML = '';
  querySnapshot.forEach(doc => {
    const data = doc.data();
    const row = winnersTable.insertRow();
    row.dataset.id = doc.id;
    row.addEventListener('click', () => selectWinner(doc.id));
    
    row.insertCell(0).textContent = formatDate(data.date);
    row.insertCell(1).textContent = data.name;
    row.insertCell(2).textContent = data.curp || data.phone;
    row.insertCell(3).textContent = `${data.prize} MXN`;
    
    const paidCell = row.insertCell(4);
    paidCell.textContent = data.paid ? "✅" : "❌";
    paidCell.className = data.paid ? "paid" : "unpaid";
  });
}

// Seleccionar ganador
function selectWinner(id) {
  const rows = winnersTable.getElementsByTagName('tr');
  for (let row of rows) {
    row.classList.remove('selected');
  }
  
  event.currentTarget.classList.add('selected');
  selectedWinnerId = id;
  markAsPaidBtn.disabled = false;
}

// Marcar como pagado
async function markAsPaid() {
  if (!selectedWinnerId) return;
  
  try {
    await updateDoc(doc(db, "winners", selectedWinnerId), {
      paid: true
    });
    alert("Premio marcado como pagado");
    loadWinners();
  } catch (error) {
    console.error("Error al actualizar:", error);
    alert("Error al marcar como pagado");
  }
}

// Realizar sorteo
async function drawWinner() {
  if (!confirm("¿Estás seguro de realizar el sorteo ahora?")) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Verificar si ya hay ganador hoy
  const qCheck = query(
    collection(db, "winners"),
    where("date", ">=", today.toISOString()),
    limit(1)
  );
  const checkSnapshot = await getDocs(qCheck);
  if (!checkSnapshot.empty) {
    alert("Ya se realizó el sorteo hoy");
    return;
  }

  // Obtener participantes
  const qParticipants = query(
    collection(db, "participants"),
    where("date", ">=", today.toISOString())
  );
  const participantsSnapshot = await getDocs(qParticipants);
  
  if (participantsSnapshot.empty) {
    alert("No hay participantes hoy");
    return;
  }

  // Seleccionar ganador
  const participants = participantsSnapshot.docs.map(doc => doc.data());
  const winner = participants[Math.floor(Math.random() * participants.length)];
  const prize = Math.floor(Math.random() * 2001) + 3000; // 3000-5000 MXN

  // Registrar ganador
  await addDoc(collection(db, "winners"), {
    ...winner,
    prize,
    date: new Date().toISOString(),
    paid: false
  });

  alert(`¡Ganador seleccionado!\n${winner.name}\nPremio: ${prize} MXN`);
  loadStats();
  loadWinners();
}

// Exportar datos
async function exportData() {
  const [participantsSnapshot, winnersSnapshot] = await Promise.all([
    getDocs(collection(db, "participants")),
    getDocs(collection(db, "winners"))
  ]);

  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Participantes
  csvContent += "Participantes\nNombre,CURP,Teléfono,Número,Fecha\n";
  participantsSnapshot.forEach(doc => {
    const data = doc.data();
    csvContent += `${data.name},${data.curp},${data.phone},${data.number},${data.date}\n`;
  });
  
  // Ganadores
  csvContent += "\nGanadores\nNombre,CURP,Teléfono,Premio,Fecha,Pagado\n";
  winnersSnapshot.forEach(doc => {
    const data = doc.data();
    csvContent += `${data.name},${data.curp},${data.phone},${data.prize},${data.date},${data.paid ? "Sí" : "No"}\n`;
  });

  // Descargar
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `rifa_datos_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
}

function formatDate(dateString) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('es-MX', options);
}
// En admin-script.js, función drawWinner:
const winningNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');