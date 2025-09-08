//--This page is the sript for the main page

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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  limit,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Page Router ---
const pathname = window.location.pathname;
let unsubscribeExpenses = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is logged in
    initializeCommonUI(user);

    if (pathname.endsWith("/") || pathname.endsWith("index.html")) {
      window.location.replace("main.html");
    } else if (pathname.endsWith("main.html")) {
      initializeMainApp(user);
    } else if (pathname.endsWith("expenses.html")) {
      initializeExpensesPage(user);
    }
  } else {
    // User is not logged in
    if (
      pathname.endsWith("main.html") ||
      pathname.endsWith("expenses.html") ||
      pathname.endsWith("viewer.html")
    ) {
      window.location.replace("index.html");
    } else if (pathname.endsWith("/") || pathname.endsWith("index.html")) {
      setupAuthPage();
    }
  }
});

// --- AUTHENTICATION PAGE LOGIC ---
function setupAuthPage() {
  const loginView = document.getElementById("login-view");
  const signupView = document.getElementById("signup-view");
  const showSignupLink = document.getElementById("show-signup-link");
  const showLoginLink = document.getElementById("show-login-link");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  if (showSignupLink) {
    showSignupLink.addEventListener("click", (e) => {
      e.preventDefault();
      loginView.classList.add("hidden");
      signupView.classList.remove("hidden");
    });
  }

  if (showLoginLink) {
    showLoginLink.addEventListener("click", (e) => {
      e.preventDefault();
      signupView.classList.add("hidden");
      loginView.classList.remove("hidden");
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm["login-email"].value;
      const password = loginForm["login-password"].value;
      signInWithEmailAndPassword(auth, email, password).catch((err) => {
        console.error("Login Failed:", err.message);
        const errorElement = document.getElementById("login-error");
        if (errorElement) errorElement.textContent = err.message;
      });
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = signupForm["signup-email"].value;
      const password = signupForm["signup-password"].value;
      createUserWithEmailAndPassword(auth, email, password).catch((err) => {
        console.error("Signup Failed:", err.message);
        const errorElement = document.getElementById("signup-error");
        if (errorElement) errorElement.textContent = err.message;
      });
    });
  }
}

// --- DATA MODIFICATION ---
async function deleteExpense(userId, expenseId) {
  try {
    const expenseDocRef = doc(db, "users", userId, "expenses", expenseId);
    await deleteDoc(expenseDocRef);
  } catch (error) {
    console.error("Error deleting expense: ", error);
  }
}

// --- MAIN APP PAGE (main.html) ---
function initializeMainApp(user) {
  const expenseForm = document.getElementById("expense-form");
  const timeFilter = document.getElementById("time-filter");
  const fab = document.getElementById("add-expense-fab");
  const recentExpenseList = document.getElementById("expense-list");

  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  if (expenseForm) {
    expenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addExpense(user.uid);
    });
  }

  if (timeFilter) {
    timeFilter.addEventListener("change", () =>
      fetchAndRenderDashboard(user.uid)
    );
  }

  if (fab && expenseForm) {
    fab.addEventListener("click", (e) => {
      e.preventDefault();
      expenseForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  if (recentExpenseList) {
    recentExpenseList.addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("delete-btn")) {
        const expenseIdToDelete = e.target.getAttribute("data-id");
        deleteExpense(user.uid, expenseIdToDelete);
      }
    });
  }

  fetchAndRenderDashboard(user.uid);
  fetchAndRenderRecentExpenses(user.uid);
}

async function addExpense(userId) {
  const amount = parseFloat(document.getElementById("amount").value);
  const reason = document.getElementById("reason").value;
  const method = document.getElementById("method").value;
  const date = new Date(document.getElementById("date").value);
  const formMessage = document.getElementById("form-message");

  if (!amount || !reason || !date) {
    formMessage.textContent = "Please fill out all fields.";
    formMessage.style.color = "red";
    return;
  }

  try {
    const expensesCollection = collection(db, "users", userId, "expenses");
    await addDoc(expensesCollection, {
      amount: amount,
      reason: reason,
      method: method,
      date: Timestamp.fromDate(date),
    });
    formMessage.textContent = "Expense added successfully!";
    formMessage.style.color = "green";
    document.getElementById("expense-form").reset();
    document.getElementById("date").value = new Date()
      .toISOString()
      .split("T")[0];
  } catch (error) {
    console.error("Error adding document: ", error);
    formMessage.textContent = "Error adding expense.";
    formMessage.style.color = "red";
  }
}

function fetchAndRenderDashboard(userId) {
  const days = parseInt(document.getElementById("time-filter").value);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const expensesCollection = collection(db, "users", userId, "expenses");
  const q = query(expensesCollection, where("date", ">=", startDate));

  if (unsubscribeExpenses) unsubscribeExpenses();

  unsubscribeExpenses = onSnapshot(q, (snapshot) => {
    if (!window.location.pathname.endsWith("main.html")) return;

    let total = 0;
    const dailyExpenses = {};

    snapshot.forEach((doc) => {
      const expense = doc.data();
      total += expense.amount;
      const dateStr = expense.date.toDate().toISOString().split("T")[0];
      dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + expense.amount;
    });

    const totalSpentEl = document.getElementById("total-spent");
    if (totalSpentEl) totalSpentEl.textContent = `₹${total.toFixed(2)}`;

    const chartContainer = document.getElementById("chart-container");
    if (chartContainer) renderChart(dailyExpenses);
  });
}

function renderChart(dailyExpenses) {
  const chartContainer = document.getElementById("chart-container");
  if (!chartContainer) return;

  chartContainer.innerHTML = "";
  const maxAmount = Math.max(...Object.values(dailyExpenses), 1);

  for (const [date, amount] of Object.entries(dailyExpenses).sort()) {
    const chartEntry = document.createElement("div");
    chartEntry.className = "chart-entry";

    const amountLabel = document.createElement("div");
    amountLabel.className = "chart-amount";
    // Use toFixed(0) for a cleaner look, removing decimals
    amountLabel.textContent = `₹${amount.toFixed(0)}`;

    const bar = document.createElement("div");
    bar.className = "chart-bar";
    // Use 70% of the container height for the bar to leave space for labels
    bar.style.height = `${(amount / maxAmount) * 70}%`;

    const dateLabel = document.createElement("div");
    dateLabel.className = "chart-label";
    dateLabel.textContent = new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    chartEntry.appendChild(amountLabel);
    chartEntry.appendChild(bar);
    chartEntry.appendChild(dateLabel);
    chartContainer.appendChild(chartEntry);
  }
}

function fetchAndRenderRecentExpenses(userId) {
  const expensesCollection = collection(db, "users", userId, "expenses");
  const q = query(expensesCollection, orderBy("date", "desc"), limit(5));

  onSnapshot(q, (snapshot) => {
    if (!window.location.pathname.endsWith("main.html")) return;

    const expenseList = document.getElementById("expense-list");
    if (!expenseList) return;

    expenseList.innerHTML = "";
    if (snapshot.empty) {
      expenseList.innerHTML = "<li>No recent expenses.</li>";
      return;
    }
    snapshot.forEach((doc) => {
      const expense = doc.data();
      const expenseId = doc.id;
      const li = document.createElement("li");
      li.innerHTML = `
                <span class="reason">${expense.reason}</span>
                <div>
                    <span class="amount">₹${expense.amount.toFixed(2)}</span>
                    <button class="delete-btn" data-id="${expenseId}">Delete</button>
                </div>
            `;
      expenseList.appendChild(li);
    });
  });
}

// --- ALL EXPENSES PAGE (expenses.html) ---
function initializeExpensesPage(user) {
  const expenseList = document.getElementById("full-expense-list");
  const expensesCollection = collection(db, "users", user.uid, "expenses");
  const q = query(expensesCollection, orderBy("date", "desc"));

  if (expenseList) {
    expenseList.addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("delete-btn")) {
        const expenseIdToDelete = e.target.getAttribute("data-id");
        deleteExpense(user.uid, expenseIdToDelete);
      }
    });
  }

  onSnapshot(q, (snapshot) => {
    if (!window.location.pathname.endsWith("expenses.html")) return;
    if (!expenseList) return;

    expenseList.innerHTML = "";
    if (snapshot.empty) {
      expenseList.innerHTML = "<li>No expenses recorded yet.</li>";
      return;
    }
    snapshot.forEach((doc) => {
      const expense = doc.data();
      const expenseId = doc.id;
      const li = document.createElement("li");
      const date = expense.date.toDate().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      li.innerHTML = `
                <div>
                    <span class="reason">${expense.reason}</span>
                    <span class="meta">${date} - ${expense.method}</span>
                </div>
                <div>
                    <span class="amount">₹${expense.amount.toFixed(2)}</span>
                    <button class="delete-btn" data-id="${expenseId}">Delete</button>
                </div>
            `;
      expenseList.appendChild(li);
    });
  });
}

// --- COMMON UI LOGIC (Menu, Logout, Active Links) ---
function initializeCommonUI(user) {
  const sidenav = document.getElementById("sidenav");
  // If there is no sidenav on the page, don't run the rest of the function
  if (!sidenav) {
    return;
  }

  const logoutButton = document.getElementById("logout-button");
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-btn");
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
