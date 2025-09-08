// --- STEP 1: Paste your Firebase configuration object here ---
const firebaseConfig = {
  apiKey: "AIzaSyBsiSdkhkAdYVqZpSRCb9zJDqv645PQpRo",
  authDomain: "my-expenses-e9b30.firebaseapp.com",
  projectId: "my-expenses-e9b30",
  storageBucket: "my-expenses-e9b30.firebasestorage.app",
  messagingSenderId: "499047046098",
  appId: "1:499047046098:web:cf143b87f3494e7658c60b",
  measurementId: "G-PS2S8SR4Z8"
};

// --- Import Firebase modules ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
    getAuth,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Page-specific Logic ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in, initialize the page
        initializeCommonUI(user);
        initializeDownloadPage(user);
    } else {
        // User is not logged in, redirect to the login page
        window.location.replace('index.html');
    }
});

// --- DOWNLOAD PAGE INITIALIZATION ---
function initializeDownloadPage(user) {
    const downloadBtn = document.getElementById('download-btn');
    const statusEl = document.getElementById('download-status');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            statusEl.textContent = 'Fetching your data...';
            statusEl.style.color = '#e0e0e0';

            try {
                // Fetch all expense documents ordered by date
                const expensesCollection = collection(db, 'users', user.uid, 'expenses');
                const q = query(expensesCollection, orderBy('date', 'desc'));
                const querySnapshot = await getDocs(q);

                const expenses = [];
                querySnapshot.forEach((doc) => {
                    expenses.push(doc.data());
                });

                if (expenses.length === 0) {
                    statusEl.textContent = 'You have no expenses to download.';
                    statusEl.style.color = 'orange';
                    return;
                }

                // Trigger the CSV export
                exportToCsv('my-expenses.csv', expenses);
                statusEl.textContent = 'Download successful!';
                statusEl.style.color = 'green';

            } catch (error) {
                console.error("Error fetching data for download: ", error);
                statusEl.textContent = 'An error occurred. Please try again.';
                statusEl.style.color = 'red';
            }
        });
    }
}

// --- CSV EXPORT FUNCTION ---
function exportToCsv(filename, data) {
    // Define the header row for the CSV file
    const header = ['Date', 'Reason', 'Amount (INR)', 'Method'];
    
    // Map the Firestore data to CSV rows
    const csvRows = data.map(expense => {
        const date = expense.date.toDate().toISOString().split('T')[0];
        // Handle potential commas in the reason by wrapping it in double quotes
        const reason = `"${expense.reason.replace(/"/g, '""')}"`;
        const amount = expense.amount.toFixed(2);
        const method = expense.method;
        return [date, reason, amount, method].join(',');
    });

    // Combine the header and data rows
    const csvString = [header.join(','), ...csvRows].join('\n');
    
    // Create a Blob (Binary Large Object) from the CSV string
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    // Create a temporary link element to trigger the download
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// --- COMMON UI LOGIC (Menu, Logout, Active Links) ---
function initializeCommonUI(user) {
    const sidenav = document.getElementById('sidenav');
    if (!sidenav) return;

    const logoutButton = document.getElementById('logout-button');
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const overlay = document.getElementById('overlay');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidenav.style.width = "250px";
            overlay.classList.remove('hidden');
        });
    }

    const closeNav = () => {
        sidenav.style.width = "0";
        overlay.classList.add('hidden');
    };
    if (closeBtn) closeBtn.addEventListener('click', closeNav);
    if (overlay) overlay.addEventListener('click', closeNav);


    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth);
        });
    }

    // Highlight the active link in the navigation menu
    const currentPagePath = window.location.pathname;
    const navLinks = sidenav.querySelectorAll('a');
    navLinks.forEach(link => {
        const linkPath = new URL(link.href, window.location.origin).pathname;
        if (currentPagePath.endsWith(linkPath.substring(linkPath.lastIndexOf('/')))) {
             link.classList.add('active');
        }
    });
}
