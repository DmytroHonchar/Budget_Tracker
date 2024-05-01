let income = {};
let totalPound = 0;
let totalEuro = 0;
let groundTotalPound = 0;
let groundTotalEuro = 0;
let exchangeRate = 1.15; // Default exchange rate

// Function to add amount to income object
function addAmount(category, amount, currency) {
    amount = parseFloat(amount);
    if (!income[category]) {
        income[category] = [];
    }
    income[category].push(amount);
    if (currency) {
        income[category].currency = currency;
    }
}

// Card form submit event listener
document.getElementById('cardForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var amountPound = document.getElementById('amount£').value;
    var amountEuro = document.getElementById('amount€').value;

    if (isValidPositiveNumber(amountPound)) {
        addAmount('card£', amountPound, '£');
        displayIncome('card£', amountPound, 'outputCard£');
        updateTotal('card£');
    }

    if (isValidPositiveNumber(amountEuro)) {
        addAmount('card€', amountEuro, '€');
        displayIncome('card€', amountEuro, 'outputCard€');
        updateTotal('card€');
    }

    // Reset the form
    document.getElementById('cardForm').reset();
});

// Cash form submit event listener
document.getElementById('cashForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var amountPound = document.getElementById('amountCash£').value;
    var amountEuro = document.getElementById('amountCash€').value;

    if (isValidPositiveNumber(amountPound)) {
        addAmount('cash£', amountPound, '£');
        displayIncome('cash£', amountPound, 'outputCash£');
        updateTotal('cash£');
    }

    if (isValidPositiveNumber(amountEuro)) {
        addAmount('cash€', amountEuro, '€');
        displayIncome('cash€', amountEuro, 'outputCash€');
        updateTotal('cash€');
    }

    // Reset the form
    document.getElementById('cashForm').reset();
});

// Function to display income
function displayIncome(category, amount, outputId) {
    const outputElement = document.getElementById(outputId);
    if (!outputElement.textContent.includes(category)) {
        outputElement.textContent = `${category}: ${income[category].currency}${amount}`;
    } else {
        outputElement.textContent += `, ${amount}`;
    }
}

// Function to update total income for a specific category
function updateTotal(category) {
    const total = income[category].reduce((acc, val) => acc + val, 0);
    if (income[category].currency === '£') {
        totalPound += total;
    } else if (income[category].currency === '€') {
        totalEuro += total;
    }
    document.getElementById(`total${category}`).textContent = `Total: ${income[category].currency}${total.toFixed(2)}`;
}

// Function to calculate and display total income
function displayTotal() {
    const outputTotalElement = document.getElementById('outputTotal');
    outputTotalElement.innerHTML = `Total money:<br>Total (£): £${totalPound.toFixed(2)}<br>Total (€): €${totalEuro.toFixed(2)}<br>Ground Total Pounds: £${groundTotalPound.toFixed(2)}<br>Ground Total Euros: €${groundTotalEuro.toFixed(2)}<br>Exchange Rate: <input type="number" id="exchangeRate" value="${exchangeRate}" step="0.01"><button onclick="convertToPounds()">Convert to Pounds</button> <button onclick="convertToEuros()">Convert to Euros</button>`;
}

// Function to convert total income to pounds
function convertToPounds() {
    groundTotalPound = totalPound + (totalEuro * exchangeRate);
    groundTotalEuro = totalEuro;
    displayTotal();
}

// Function to convert total income to euros
function convertToEuros() {
    groundTotalPound = totalPound;
    groundTotalEuro = totalEuro + (totalPound / exchangeRate);
    displayTotal();
}

// Function to check if input is a valid positive number
function isValidPositiveNumber(input) {
    const number = Number(input);
    return !isNaN(number) && number >= 0 && number.toString() === input.trim();
}
