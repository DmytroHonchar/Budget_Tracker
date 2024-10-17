// income_guest.js

let income = {};
let totalPound = 0;
let totalEuro = 0;
let grandTotalPound = 0;
let grandTotalEuro = 0;

// Initial exchange rates
let exchangeRatePoundToEuro = 1.15;
let exchangeRateEuroToPound = 0.87;

// Totals object to hold the initial amounts
let initialTotals = {
    total_card_pounds: 0,
    total_card_euro: 0,
    total_cash_pounds: 0,
    total_cash_euro: 0,
};

// Function to format numbers with commas and two decimal places
function formatNumberWithCommas(number) {
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Function to display messages (using alert for simplicity)
function showModalMessage(message) {
    alert(message);
}

// Function to add amount to income object
function addAmount(category, amount) {
    amount = parseFloat(amount);
    if (!income[category]) {
        income[category] = [];
    }
    income[category].push(amount);

    // Update the initial totals directly
    if (category === 'card£') initialTotals.total_card_pounds += amount;
    if (category === 'card€') initialTotals.total_card_euro += amount;
    if (category === 'cash£') initialTotals.total_cash_pounds += amount;
    if (category === 'cash€') initialTotals.total_cash_euro += amount;

    displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    updateOverallTotal();
    saveTotalsToLocalStorage(); // Save to local storage
    fetchAmounts(category); // Update the dropdown options
}

// Function to subtract amount from income object
function subtractAmount(category, amount) {
    amount = parseFloat(amount);
    const totalElementId = `total${category}`;
    const currentTotal = parseTotal(totalElementId, category.includes('£') ? '£' : '€');

    if (currentTotal >= amount) {
        if (!income[category]) {
            income[category] = [];
        }
        income[category].push(-amount);

        // Update the initial totals directly
        if (category === 'card£') initialTotals.total_card_pounds -= amount;
        if (category === 'card€') initialTotals.total_card_euro -= amount;
        if (category === 'cash£') initialTotals.total_cash_pounds -= amount;
        if (category === 'cash€') initialTotals.total_cash_euro -= amount;

        displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
        updateOverallTotal();
        saveTotalsToLocalStorage(); // Save to local storage
        fetchAmounts(category); // Update the dropdown options
    } else {
        showModalMessage(`Insufficient total in ${category} to subtract ${amount}`);
    }
}

// Event listener for card form submission
document.getElementById('cardForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const amountPound = document.getElementById('amountCard£').value;
    const amountEuro = document.getElementById('amountCard€').value;

    if (isValidPositiveNumber(amountPound)) {
        addAmount('card£', amountPound);
    }
    if (isValidPositiveNumber(amountEuro)) {
        addAmount('card€', amountEuro);
    }

    document.getElementById('cardForm').reset();
});

// Event listener for cash form submission
document.getElementById('cashForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const amountPound = document.getElementById('amountCash£').value;
    const amountEuro = document.getElementById('amountCash€').value;

    if (isValidPositiveNumber(amountPound)) {
        addAmount('cash£', amountPound);
    }
    if (isValidPositiveNumber(amountEuro)) {
        addAmount('cash€', amountEuro);
    }

    document.getElementById('cashForm').reset();
});

// Event listener for category selection to fetch amounts
document.getElementById('category').addEventListener('change', function () {
    fetchAmounts(this.value);
});

// Function to fetch amounts for the selected category
function fetchAmounts(category) {
    var selectElement = document.getElementById('amountOptions');
    var defaultOption = document.createElement('option');

    selectElement.innerHTML = '';
    defaultOption.textContent = "Select an amount";
    defaultOption.value = "";
    selectElement.appendChild(defaultOption);

    if (income[category] && income[category].length > 0) {
        income[category].forEach(function (amount, index) {
            var option = document.createElement('option');
            option.textContent = formatNumberWithCommas(amount);
            option.value = index;
            selectElement.appendChild(option);
        });
    }
}

// Event listener for manage form submission
document.getElementById('manageForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var category = document.getElementById('category').value;
    var action = document.getElementById('action').value;
    var amountIndex = document.getElementById('amountOptions').value;
    var newAmount = parseFloat(document.getElementById('amount').value);

    if (action === 'update') {
        if (amountIndex === "" || isNaN(newAmount)) {
            showModalMessage("Please select a valid amount to update.");
            return;
        }

        const oldAmount = income[category][amountIndex];
        income[category][amountIndex] = newAmount;

        if (category === 'card£') initialTotals.total_card_pounds += newAmount - oldAmount;
        if (category === 'card€') initialTotals.total_card_euro += newAmount - oldAmount;
        if (category === 'cash£') initialTotals.total_cash_pounds += newAmount - oldAmount;
        if (category === 'cash€') initialTotals.total_cash_euro += newAmount - oldAmount;

        updateTotal(category);
        updateOverallTotal();
        displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
        saveTotalsToLocalStorage(); // Save to local storage
        fetchAmounts(category); // Update the dropdown options

    } else if (action === 'subtract') {
        if (isNaN(newAmount) || newAmount <= 0) {
            showModalMessage("Please enter a valid amount to subtract.");
            return;
        }
        subtractAmount(category, newAmount);

    } else if (action === 'delete') {
        if (amountIndex === "") {
            showModalMessage("Please select an amount to delete.");
            return;
        }

        const amountToDelete = income[category][amountIndex];
        income[category].splice(amountIndex, 1);

        if (category === 'card£') initialTotals.total_card_pounds -= amountToDelete;
        if (category === 'card€') initialTotals.total_card_euro -= amountToDelete;
        if (category === 'cash£') initialTotals.total_cash_pounds -= amountToDelete;
        if (category === 'cash€') initialTotals.total_cash_euro -= amountToDelete;

        displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
        updateOverallTotal();
        saveTotalsToLocalStorage(); // Save to local storage
        fetchAmounts(category); // Update the dropdown options

    } else if (action === 'deleteTotal') {
        if (!category) {
            showModalMessage("Please select a category to delete.");
            return;
        }

        if (category === 'card£') initialTotals.total_card_pounds = 0;
        if (category === 'card€') initialTotals.total_card_euro = 0;
        if (category === 'cash£') initialTotals.total_cash_pounds = 0;
        if (category === 'cash€') initialTotals.total_cash_euro = 0;

        if (income[category]) {
            income[category] = [];
        }

        fetchAmounts(category); // Update the dropdown options
        displayCurrentTotals();
        updateOverallTotal();
        saveTotalsToLocalStorage();
    }
});

// Event listener for fetching totals on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayTotals(); // Retrieve totals from local storage
    fetchAmounts(document.getElementById('category').value); // Fetch amounts for the initially selected category
});

// Function to fetch and display totals from local storage
function fetchAndDisplayTotals() {
    const storedTotals = localStorage.getItem('guestTotals');
    if (storedTotals) {
        initialTotals = JSON.parse(storedTotals);
    }
    displayCurrentTotals();
    updateOverallTotal();
}

// Function to display current totals
function displayCurrentTotals() {
    document.getElementById('totalcard£').textContent = `£${formatNumberWithCommas(initialTotals.total_card_pounds)}`;
    document.getElementById('totalcard€').textContent = `€${formatNumberWithCommas(initialTotals.total_card_euro)}`;
    document.getElementById('totalcash£').textContent = `£${formatNumberWithCommas(initialTotals.total_cash_pounds)}`;
    document.getElementById('totalcash€').textContent = `€${formatNumberWithCommas(initialTotals.total_cash_euro)}`;
}

// Function to update overall total
function updateOverallTotal() {
    totalPound = initialTotals.total_card_pounds + initialTotals.total_cash_pounds;
    totalEuro = initialTotals.total_card_euro + initialTotals.total_cash_euro;

    document.getElementById('totalPoundOutput').textContent = `£${formatNumberWithCommas(totalPound)}`;
    document.getElementById('totalEuroOutput').textContent = `€${formatNumberWithCommas(totalEuro)}`;
}

// Function to save the totals to local storage
function saveTotalsToLocalStorage() {
    localStorage.setItem('guestTotals', JSON.stringify(initialTotals));
}

// Function to convert totals to pounds
function convertToPounds() {
    const exchangeRate = parseFloat(document.getElementById('exchangeRateEuros').value);
    grandTotalPound = totalPound + (totalEuro * exchangeRate);
    document.getElementById('outputTotal2').querySelector('p:nth-child(2)').textContent = `£${formatNumberWithCommas(grandTotalPound)}`;
}

// Function to convert totals to euros
function convertToEuros() {
    const exchangeRate = parseFloat(document.getElementById('exchangeRatePounds').value);
    grandTotalEuro = totalEuro + (totalPound * exchangeRate);
    document.getElementById('outputTotal2').querySelector('p:nth-child(3)').textContent = `€${formatNumberWithCommas(grandTotalEuro)}`;
}

// Event listener for converting to pounds
document.getElementById('convertToPounds').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent form submission
    convertToPounds();
});

// Event listener for converting to euros
document.getElementById('convertToEuros').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent form submission
    convertToEuros();
});

// Helper function to parse total from the formatted string
function parseTotal(id, currencySymbol) {
    const totalString = document.getElementById(id).textContent;
    const total = parseFloat(totalString.split(currencySymbol)[1].replace(/,/g, ''));
    return isNaN(total) ? 0 : total;
}

// Function to check if input is a valid positive number
function isValidPositiveNumber(input) {
    const number = parseFloat(input);
    return !isNaN(number) && number > 0 && input.replace('.', '').length <= 15;
}

// Function to display income
function displayIncome(category, outputId) {
    const outputElement = document.getElementById(outputId);
    if (income[category] && income[category].length > 0) {
        const amountsText = income[category].map(val => val >= 0 ? formatNumberWithCommas(val) : `-${formatNumberWithCommas(Math.abs(val))}`).join(', ');
        outputElement.textContent = `${category}: ${amountsText}`;
    } else {
        outputElement.textContent = '';
    }

    updateTotal(category);
}

// Function to update total income for a specific category
function updateTotal(category) {
    let total = 0;
    if (income[category] && income[category].length > 0) {
        total = income[category].reduce((acc, val) => acc + val, 0);
    }
    const currencySymbol = category.includes('£') ? '£' : '€';
    document.getElementById(`total${category}`).textContent = `${currencySymbol}${formatNumberWithCommas(total)}`;
}
