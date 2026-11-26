// ========================================
// MONEYTRACK - EXPENSE TRACKER VERSION 2.0
// ========================================


// 1. GET HTML ELEMENTS

const form = document.getElementById("transaction-form");

const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");
const editIdInput = document.getElementById("edit-id");

const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expenseDisplay = document.getElementById("expense");
const savingsDisplay = document.getElementById("savings");

const transactionList = document.getElementById("transaction-list");
const recentList = document.getElementById("recent-list");

const searchInput = document.getElementById("search");
const filterType = document.getElementById("filter-type");
const filterCategory = document.getElementById("filter-category");
const filterMonth = document.getElementById("filter-month");

const reportMonth = document.getElementById("report-month");


// 2. DATE SETTINGS

function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const currentMonth = getToday().slice(0, 7);

dateInput.value = getToday();
reportMonth.value = currentMonth;

document.getElementById("today-date").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });


// 3. LOAD TRANSACTIONS FROM LOCAL STORAGE

let transactions = [];

try {
    transactions = JSON.parse(
        localStorage.getItem("transactions")
    ) || [];
} catch (error) {
    transactions = [];
}


// 4. SAVE TRANSACTIONS

function saveData() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}


// 5. FORMAT MONEY

function formatMoney(value) {
    return "₹" + value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// 6. NAVIGATION BETWEEN PAGES

const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");

function showPage(pageName) {

    pages.forEach(function(page) {
        page.classList.remove("active");
    });

    navLinks.forEach(function(link) {
        link.classList.remove("active");
    });

    document.getElementById(pageName).classList.add("active");

    document.querySelector(
        `[data-page="${pageName}"]`
    ).classList.add("active");

    const titles = {
        dashboard: "Dashboard",
        transactions: "Transactions",
        reports: "Reports & Analytics"
    };

    document.getElementById("page-title").textContent =
        titles[pageName];

    if (pageName === "reports") {
        updateMonthlyReport();
    }
}

navLinks.forEach(function(link) {

    link.addEventListener("click", function() {
        showPage(link.dataset.page);
    });

});

document.querySelectorAll("[data-go]").forEach(function(button) {

    button.addEventListener("click", function() {
        showPage(button.dataset.go);
    });

});


// 7. ADD OR UPDATE TRANSACTION

form.addEventListener("submit", function(event) {

    event.preventDefault();

    const amount = Number(amountInput.value);
    const description = descriptionInput.value.trim();
    const date = dateInput.value;

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !description ||
        !date ||
        date > getToday()
    ) {
        alert("Please enter valid transaction details. Future dates are not allowed.");
        return;
    }

    const id = editIdInput.value;

    if (id) {

        // EDIT EXISTING TRANSACTION

        const index = transactions.findIndex(function(item) {
            return String(item.id) === id;
        });

        if (index !== -1) {

            transactions[index] = {
                ...transactions[index],
                type: typeInput.value,
                amount: amount,
                category: categoryInput.value,
                description: description,
                date: date
            };

        }

        alert("Transaction updated successfully!");

    } else {

        // ADD NEW TRANSACTION

        const transaction = {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            type: typeInput.value,
            amount: amount,
            category: categoryInput.value,
            description: description,
            date: date
        };

        transactions.push(transaction);

        alert("Transaction added successfully!");

    }

    saveData();

    resetForm();

    updateDashboard();

});


// 8. RESET FORM

function resetForm() {

    form.reset();

    editIdInput.value = "";

    dateInput.value = getToday();

    document.getElementById("form-heading").textContent =
        "Add New Transaction";

    document.getElementById("submit-btn").textContent =
        "+ Add Transaction";

    document.getElementById("cancel-edit").classList.add("hidden");

}


// CANCEL EDIT BUTTON

document.getElementById("cancel-edit").addEventListener("click", resetForm);


// 9. EDIT TRANSACTION

function editTransaction(id) {

    const item = transactions.find(function(transaction) {
        return String(transaction.id) === String(id);
    });

    if (!item) return;

    showPage("dashboard");

    editIdInput.value = item.id;
    typeInput.value = item.type;
    amountInput.value = item.amount;
    categoryInput.value = item.category;
    descriptionInput.value = item.description;
    dateInput.value = item.date;

    document.getElementById("form-heading").textContent =
        "Edit Transaction";

    document.getElementById("submit-btn").textContent =
        "Save Changes";

    document.getElementById("cancel-edit").classList.remove("hidden");

    document.querySelector(".form-card").scrollIntoView({
        behavior: "smooth"
    });

}


// 10. DELETE TRANSACTION

function deleteTransaction(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) return;

    transactions = transactions.filter(function(item) {
        return String(item.id) !== String(id);
    });

    saveData();

    if (String(editIdInput.value) === String(id)) {
        resetForm();
    }

    updateDashboard();

}


// 11. UPDATE DASHBOARD

function updateDashboard() {

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(function(item) {

        if (item.type === "income") {
            totalIncome += item.amount;
        } else {
            totalExpense += item.amount;
        }

    });

    const balance = totalIncome - totalExpense;

    balanceDisplay.textContent = formatMoney(balance);
    incomeDisplay.textContent = formatMoney(totalIncome);
    expenseDisplay.textContent = formatMoney(totalExpense);
    savingsDisplay.textContent = formatMoney(balance);

    savingsDisplay.style.color =
        balance >= 0 ? "#239b70" : "#dc5b63";

    displayTransactions();
    displayRecentTransactions();

    updateCharts();
    updateMonthlyReport();

}


// 12. CREATE TRANSACTION ELEMENT

function createTransactionElement(item, showActions = true) {

    const row = document.createElement("div");
    row.className = "transaction-item";

    const info = document.createElement("div");
    info.className = "transaction-info";

    const heading = document.createElement("h4");
    heading.textContent = item.description;

    const details = document.createElement("p");

    details.textContent =
        item.category + " | " +
        item.date + " | " +
        (item.type === "income" ? "Income" : "Expense");

    info.appendChild(heading);
    info.appendChild(details);

    const actions = document.createElement("div");
    actions.className = "transaction-actions";

    const amount = document.createElement("span");

    amount.className =
        "transaction-amount " +
        (item.type === "income" ? "positive" : "negative");

    amount.textContent =
        (item.type === "income" ? "+" : "-") +
        formatMoney(item.amount);

    actions.appendChild(amount);

    if (showActions) {

        const editButton = document.createElement("button");

        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editTransaction(item.id);
        });

        const deleteButton = document.createElement("button");

        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteTransaction(item.id);
        });

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

    }

    row.appendChild(info);
    row.appendChild(actions);

    return row;

}


// 13. DISPLAY ALL TRANSACTIONS

function displayTransactions() {

    transactionList.innerHTML = "";

    const search = searchInput.value.toLowerCase().trim();
    const selectedType = filterType.value;
    const selectedCategory = filterCategory.value;
    const selectedMonth = filterMonth.value;

    const filtered = [...transactions]
        .filter(function(item) {

            const matchesSearch =
                item.description.toLowerCase().includes(search) ||
                item.category.toLowerCase().includes(search);

            const matchesType =
                selectedType === "all" ||
                item.type === selectedType;

            const matchesCategory =
                selectedCategory === "all" ||
                item.category === selectedCategory;

            const matchesMonth =
                !selectedMonth ||
                item.date.startsWith(selectedMonth);

            return (
                matchesSearch &&
                matchesType &&
                matchesCategory &&
                matchesMonth
            );

        })
        .sort(function(a, b) {
            return b.date.localeCompare(a.date) ||
                String(b.id).localeCompare(String(a.id));
        });

    if (filtered.length === 0) {

        transactionList.innerHTML =
            '<p class="empty">No matching transactions found.</p>';

        return;

    }

    filtered.forEach(function(item) {

        transactionList.appendChild(
            createTransactionElement(item)
        );

    });

}


// 14. DISPLAY RECENT TRANSACTIONS

function displayRecentTransactions() {

    recentList.innerHTML = "";

    const recent = [...transactions]
        .sort(function(a, b) {
            return b.date.localeCompare(a.date) ||
                String(b.id).localeCompare(String(a.id));
        })
        .slice(0, 5);

    if (recent.length === 0) {

        recentList.innerHTML =
            '<p class="empty">No transactions added yet.</p>';

        return;

    }

    recent.forEach(function(item) {

        recentList.appendChild(
            createTransactionElement(item, false)
        );

    });

}


// 15. SEARCH AND FILTER EVENTS

searchInput.addEventListener("input", displayTransactions);

filterType.addEventListener("change", displayTransactions);

filterCategory.addEventListener("change", displayTransactions);

filterMonth.addEventListener("change", displayTransactions);


// 16. CHART VARIABLES

let expenseChart = null;
let overviewChart = null;
let monthlyChart = null;
let monthlyPieChart = null;


// 17. UPDATE DASHBOARD CHARTS

function updateCharts() {

    if (typeof Chart === "undefined") {
        console.error("Chart.js could not be loaded.");
        return;
    }

    // EXPENSE PIE CHART

    const categoryTotals = {};

    transactions.forEach(function(item) {

        if (item.type === "expense") {

            categoryTotals[item.category] =
                (categoryTotals[item.category] || 0) + item.amount;

        }

    });

    const categories = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(
        document.getElementById("expenseChart"),
        {
            type: "doughnut",

            data: {
                labels: categories.length ? categories : ["No expenses"],

                datasets: [{
                    data: values.length ? values : [1],

                    backgroundColor: [
                        "#263f65",
                        "#4776b8",
                        "#239b70",
                        "#dc5b63",
                        "#9273c7",
                        "#e6a44c",
                        "#46a5a0",
                        "#8291a8",
                        "#d17d9b",
                        "#a7a65a",
                        "#697b91"
                    ],

                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );


    // MONTHLY INCOME VS EXPENSES CHART

    const monthlyData = {};

    transactions.forEach(function(item) {

        const month = item.date.slice(0, 7);

        if (!monthlyData[month]) {
            monthlyData[month] = {
                income: 0,
                expense: 0
            };
        }

        if (item.type === "income") {
            monthlyData[month].income += item.amount;
        } else {
            monthlyData[month].expense += item.amount;
        }

    });

    const months = Object.keys(monthlyData).sort().slice(-6);

    const labels = months.map(function(month) {

        const [year, monthNumber] = month.split("-");

        return new Date(
            Number(year),
            Number(monthNumber) - 1
        ).toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit"
        });

    });

    if (overviewChart) {
        overviewChart.destroy();
    }

    overviewChart = new Chart(
        document.getElementById("overviewChart"),
        {
            type: "bar",

            data: {
                labels: labels,

                datasets: [
                    {
                        label: "Income",
                        data: months.map(m => monthlyData[m].income),
                        backgroundColor: "#239b70",
                        borderRadius: 5
                    },
                    {
                        label: "Expenses",
                        data: months.map(m => monthlyData[m].expense),
                        backgroundColor: "#dc5b63",
                        borderRadius: 5
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true
                    }
                },

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );

}


// 18. MONTHLY REPORT

function updateMonthlyReport() {

    const selectedMonth =
        reportMonth.value || currentMonth;

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    const monthlyCategories = {};

    transactions.forEach(function(item) {

        if (!item.date.startsWith(selectedMonth)) {
            return;
        }

        if (item.type === "income") {

            monthlyIncome += item.amount;

        } else {

            monthlyExpense += item.amount;

            monthlyCategories[item.category] =
                (monthlyCategories[item.category] || 0) + item.amount;

        }

    });

    const monthlySavings = monthlyIncome - monthlyExpense;

    document.getElementById("monthly-income").textContent =
        formatMoney(monthlyIncome);

    document.getElementById("monthly-expense").textContent =
        formatMoney(monthlyExpense);

    const savingsElement =
        document.getElementById("monthly-savings");

    savingsElement.textContent = formatMoney(monthlySavings);

    savingsElement.style.color =
        monthlySavings >= 0 ? "#239b70" : "#dc5b63";


    if (typeof Chart === "undefined") return;


    // MONTHLY COMPARISON CHART

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(
        document.getElementById("monthlyChart"),
        {
            type: "bar",

            data: {
                labels: ["Selected Month"],

                datasets: [
                    {
                        label: "Income",
                        data: [monthlyIncome],
                        backgroundColor: "#239b70",
                        borderRadius: 6
                    },
                    {
                        label: "Expenses",
                        data: [monthlyExpense],
                        backgroundColor: "#dc5b63",
                        borderRadius: 6
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );


    // MONTHLY CATEGORY PIE CHART

    const labels = Object.keys(monthlyCategories);
    const values = Object.values(monthlyCategories);

    if (monthlyPieChart) {
        monthlyPieChart.destroy();
    }

    monthlyPieChart = new Chart(
        document.getElementById("monthlyPieChart"),
        {
            type: "pie",

            data: {
                labels: labels.length ? labels : ["No expenses"],

                datasets: [{
                    data: values.length ? values : [1],

                    backgroundColor: [
                        "#263f65",
                        "#4776b8",
                        "#239b70",
                        "#dc5b63",
                        "#9273c7",
                        "#e6a44c",
                        "#46a5a0",
                        "#8291a8",
                        "#d17d9b",
                        "#a7a65a",
                        "#697b91"
                    ],

                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );

}


// UPDATE REPORT WHEN MONTH CHANGES

reportMonth.addEventListener("change", updateMonthlyReport);


// 19. EXPORT TRANSACTIONS TO CSV

document.getElementById("export-btn").addEventListener(
    "click",
    function() {

        if (transactions.length === 0) {
            alert("No transactions available to export.");
            return;
        }

        const headers = [
            "Date",
            "Description",
            "Type",
            "Category",
            "Amount"
        ];

        const rows = transactions.map(function(item) {

            return [
                item.date,
                item.description,
                item.type,
                item.category,
                item.amount
            ];

        });

        function escapeCSV(value) {

            let text = String(value);

            // Prevent spreadsheet formula injection
            if (/^[=+\-@\t\r]/.test(text)) {
                text = "'" + text;
            }

            return '"' + text.replace(/"/g, '""') + '"';

        }

        const csvContent = [
            headers,
            ...rows
        ]
            .map(row => row.map(escapeCSV).join(","))
            .join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "MoneyTrack_Transactions.csv";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        alert("CSV file exported successfully!");

    }
);


// 20. INITIALIZE PROJECT

updateDashboard();