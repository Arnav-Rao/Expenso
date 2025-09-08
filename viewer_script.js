//--This is the script for the expenses list page

const firebaseConfig = {
  apiKey: "AIzaSyBsiSdkhkAdYVqZpSRCb9zJDqv645PQpRo",
  authDomain: "my-expenses-e9b30.firebaseapp.com",
  projectId: "my-expenses-e9b30",
  storageBucket: "my-expenses-e9b30.firebasestorage.app",
  messagingSenderId: "499047046098",
  appId: "1:499047046098:web:cf143b87f3494e7658c60b",
  measurementId: "G-PS2S8SR4Z8",
};

// --- Import Firebase modules ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Get DOM Elements ---
const userEmailDisplay = document.getElementById("user-email-display");
const tableBody = document.getElementById("expenses-table-body");
const searchInput = document.getElementById("search-input");

// --- Global state variables ---
let unsubscribeExpenses = null;
let allExpenses = []; // To store the full list of expenses for searching

// --- Handle Authentication State ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    initializeCommonUI(user);
    userEmailDisplay.textContent = user.email;

    // Add event listener for delete actions
    tableBody.addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("delete-btn")) {
        const expenseIdToDelete = e.target.getAttribute("data-id");
        deleteExpense(user.uid, expenseIdToDelete);
      }
    });

    fetchAndDisplayExpenses(user.uid);
  } else {
    window.location.replace("index.html");
  }
});

// --- Search Functionality ---
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();

  if (!searchTerm) {
    renderExpensesTable(allExpenses); // Show all if search is empty
    return;
  }

  const filteredExpenses = allExpenses.filter((expense) => {
    const reason = expense.reason.toLowerCase();
    const method = expense.method.toLowerCase();
    return reason.includes(searchTerm) || method.includes(searchTerm);
  });

  renderExpensesTable(filteredExpenses);
});

// --- Data Modification ---
async function deleteExpense(userId, expenseId) {
  try {
    const expenseDocRef = doc(db, "users", userId, "expenses", expenseId);
    await deleteDoc(expenseDocRef);
  } catch (error) {
    console.error("Error deleting expense: ", error);
  }
}

// --- Fetch and Display Data from Firestore ---
function fetchAndDisplayExpenses(userId) {
  const expensesCollection = collection(db, "users", userId, "expenses");
  const q = query(expensesCollection, orderBy("date", "desc"));

  unsubscribeExpenses = onSnapshot(
    q,
    (snapshot) => {
      // Store the full list with IDs for searching/filtering
      allExpenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderExpensesTable(allExpenses); // Render the full list initially
    },
    (error) => {
      console.error("Error fetching expenses:", error);
      tableBody.innerHTML =
        '<tr><td colspan="5">Error loading data. See console.</td></tr>';
    }
  );
}

// --- Renders the table with a given set of expenses ---
function renderExpensesTable(expenses) {
  if (expenses.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="5">No expenses found or match your search.</td></tr>';
    return;
  }

  tableBody.innerHTML = ""; // Clear previous content
  expenses.forEach((expense) => {
    const row = document.createElement("tr");
    const formattedDate = expense.date.toDate().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedAmount = `₹${expense.amount.toFixed(2)}`;
    row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${expense.reason}</td>
            <td>${formattedAmount}</td>
            <td>${expense.method}</td>
            <td><button class="delete-btn" data-id="${expense.id}">Delete</button></td>
        `;
    tableBody.appendChild(row);
  });
}

// --- Common UI Logic (Menu and Logout) ---
function initializeCommonUI(user) {
  const logoutButton = document.getElementById("logout-button");
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-btn");
  const sidenav = document.getElementById("sidenav");
  const overlay = document.getElementById("overlay");

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      sidenav.style.width = "250px";
      overlay.classList.remove("hidden");
    });
  }

  const closeNav = () => {
    sidenav.style.width = "0";
    overlay.classList.add("hidden");
  };
  if (closeBtn) closeBtn.addEventListener("click", closeNav);
  if (overlay) overlay.addEventListener("click", closeNav);

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      if (unsubscribeExpenses) unsubscribeExpenses();
      signOut(auth);
    });
  }

  const currentPagePath = window.location.pathname;
  const navLinks = sidenav.querySelectorAll("a");
  navLinks.forEach((link) => {
    const linkPath = new URL(link.href, window.location.origin).pathname;
    if (
      currentPagePath.endsWith(linkPath.substring(linkPath.lastIndexOf("/")))
    ) {
      link.classList.add("active");
    }
  });
}
