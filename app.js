// Import fungsi SDK Firebase dari CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. GANTI bagian ini dengan Firebase Config dari Firebase Console kamu
const firebaseConfig = {
  apiKey: "AIzaSyC1-XjC0Hy8pqX0PLCoA3szC6N8GyLmHbU",
  authDomain: "rumah-hitam-treasury.firebaseapp.com",
  projectId: "rumah-hitam-treasury",
  storageBucket: "rumah-hitam-treasury.firebasestorage.app",
  messagingSenderId: "1067575017215",
  appId: "1:1067575017215:web:4288d92626f8d29f3996ca",
  measurementId: "G-DLLQMM05DE"
};

// Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Element DOM
const form = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
let chartInstance = null;

// 2. Simpan Data Transaksi Baru ke Firebase
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value;
  const amount = Number(document.getElementById('amount').value);
  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;

  try {
    await addDoc(collection(db, "transactions"), {
      title,
      amount,
      type,
      category,
      createdAt: new Date()
    });
    form.reset();
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
  }
});

// 3. Baca Data Real-Time dari Firestore
const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  let income = 0;
  let expense = 0;
  let tableRows = '';
  let categoryTotals = {};

  snapshot.docs.forEach(doc => {
    const item = doc.data();

    if (item.type === 'income') {
      income += item.amount;
    } else {
      expense += item.amount;
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    }

    tableRows += `
      <tr>
        <td>${item.title}</td>
        <td>${item.category}</td>
        <td>${item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
        <td style="color: ${item.type === 'income' ? '#2ecc71' : '#e74c3c'}">
          Rp ${item.amount.toLocaleString('id-ID')}
        </td>
      </tr>
    `;
  });

  // Update Total di Dashboard
  document.getElementById('total-income').innerText = `Rp ${income.toLocaleString('id-ID')}`;
  document.getElementById('total-expense').innerText = `Rp ${expense.toLocaleString('id-ID')}`;
  document.getElementById('total-balance').innerText = `Rp ${(income - expense).toLocaleString('id-ID')}`;
  
  transactionList.innerHTML = tableRows;

  // Render ulang grafik pengeluaran
  renderChart(categoryTotals);
});

// 4. Render Grafik Pengeluaran (Chart.js)
function renderChart(categoryTotals) {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#e74c3c', '#e67e22', '#f1c40f', '#9b59b6', '#34495e']
      }]
    }
  });
}
