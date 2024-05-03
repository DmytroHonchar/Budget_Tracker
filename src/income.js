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
    income[category].currency = currency;
}

// Card form submit event listener
document.getElementById('cardForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var amountPound = document.getElementById('amount£').value;
    var amountEuro = document.getElementById('amount€').value;

    if (isValidPositiveNumber(amountPound)) {
        addAmount('card£', amountPound, '£');
        displayIncome('card£', 'outputCard£');
    }

    if (isValidPositiveNumber(amountEuro)) {
        addAmount('card€', amountEuro, '€');
        displayIncome('card€', 'outputCard€');
    }

    document.getElementById('cardForm').reset();
});

// Cash form submit event listener
document.getElementById('cashForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var amountPound = document.getElementById('amountCash£').value;
    var amountEuro = document.getElementById('amountCash€').value;

    if (isValidPositiveNumber(amountPound)) {
        addAmount('cash£', amountPound, '£');
        displayIncome('cash£', 'outputCash£');
    }

    if (isValidPositiveNumber(amountEuro)) {
        addAmount('cash€', amountEuro, '€');
        displayIncome('cash€', 'outputCash€');
    }

    document.getElementById('cashForm').reset();
});

// Function to display income
function displayIncome(category, outputId) {
    const outputElement = document.getElementById(outputId);
    const amountsText = income[category].map(val => val.toString()).join(', ');
    outputElement.textContent = `${category}: ${amountsText}`;
    updateTotal(category);
}

// Function to update total income for a specific category
function updateTotal(category) {
    const total = income[category].reduce((acc, val) => acc + val, 0);
    document.getElementById(`total${category}`).textContent = `Total: ${income[category].currency}${total.toFixed(2)}`;

    updateOverallTotal();
}

// Function to update the overall totals in the display
function updateOverallTotal() {
    totalPound = parseTotal('totalcard£', '£') + parseTotal('totalcash£', '£');
    totalEuro = parseTotal('totalcard€', '€') + parseTotal('totalcash€', '€');

    document.getElementById('outputTotal').innerHTML = `
        Total money:<br>
        Total (£): £${totalPound.toFixed(2)}<br>
        Total (€): €${totalEuro.toFixed(2)}<br>
        Ground Total Pounds: £${groundTotalEuro.toFixed(2)}<br> 
        Ground Total Euros: €${groundTotalPound.toFixed(2)}<br> 
      
    `;
}

// Helper function to parse total from the formatted string
function parseTotal(id, currencySymbol) {
    const totalString = document.getElementById(id).textContent;
    return parseFloat(totalString.split(currencySymbol)[1]);
}

// Function to check if input is a valid positive number
function isValidPositiveNumber(input) {
    const number = parseFloat(input);
    return !isNaN(number) && number > 0;
}

// Currency conversion functions
function convertToPounds() {
    groundTotalPound = totalPound + (totalEuro * parseFloat(document.getElementById('exchangeRatePounds').value));
    updateOverallTotal();
}


function convertToEuros() {
    groundTotalEuro = totalEuro + (totalPound * parseFloat(document.getElementById('exchangeRateEuros').value));
    updateOverallTotal();
}
