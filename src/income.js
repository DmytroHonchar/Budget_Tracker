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

// Event listener for card form submission
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

// Event listener for cash form submission
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
    if (income[category].length > 0) {
        const amountsText = income[category].map(val => `${val.toFixed(2)}`).join(', ');
        outputElement.textContent = `${category}: ${amountsText}`;
    } else {
        outputElement.textContent = `${category}: No data`;
    }

    // Update total display for the category
    updateTotal(category);
}


// Function to update total income for a specific category
function updateTotal(category) {
    let total = 0;
    if (income[category].length > 0) {
        total = income[category].reduce((acc, val) => acc + val, 0);
    }
    document.getElementById(`total${category}`).textContent = `Total: ${income[category].currency}${total.toFixed(2)}`;

    // Refresh overall totals as well
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

// Event listener for fetching amounts
document.getElementById('fetchAmount').addEventListener('click', function(event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;
    var selectElement = document.getElementById('amountOptions');
    var defaultOption = document.createElement('option');

    selectElement.innerHTML = '';
    defaultOption.textContent = "Select an amount";
    defaultOption.value = "";
    selectElement.appendChild(defaultOption);

    if (income[category] && income[category].length > 0) {
        income[category].forEach(function(amount, index) {
            var option = document.createElement('option');
            option.textContent = amount;
            option.value = index;
            selectElement.appendChild(option);
        });
    }
});

document.getElementById('updateAmount').addEventListener('click', function(event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;
    var amountIndex = document.getElementById('amountOptions').value;
    var newAmount = document.getElementById('newAmount').value;

    if (amountIndex === "" || !isValidPositiveNumber(newAmount)) {
        alert("Please select a valid amount to update.");
        return;
    }

    income[category][amountIndex] = parseFloat(newAmount);
    displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    
    refreshDropdown(category); // Refresh the dropdown to reflect changes
    document.getElementById('amountOptions').value = ""; // Reset selection
});

document.getElementById('deleteAmount').addEventListener('click', function(event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;
    var amountIndex = document.getElementById('amountOptions').value;

    if (amountIndex === "") {
        alert("Please select an amount to delete.");
        return;
    }

    income[category].splice(amountIndex, 1);
    displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    
    refreshDropdown(category); // Refresh the dropdown to reflect changes
    document.getElementById('amountOptions').value = ""; // Reset selection
});



// Currency conversion functions
function convertToPounds() {
    groundTotalPound = totalPound + (totalEuro * parseFloat(document.getElementById('exchangeRatePounds').value));
    updateOverallTotal();
}

function convertToEuros() {
    groundTotalEuro = totalEuro + (totalPound * parseFloat(document.getElementById('exchangeRateEuros').value));
    updateOverallTotal();
}

function refreshDropdown(category) {
    var selectElement = document.getElementById('amountOptions');
    selectElement.innerHTML = '<option value="">Select an amount</option>'; // Clear and set default option

    if (income[category] && income[category].length > 0) {
        income[category].forEach(function(amount, index) {
            var option = document.createElement('option');
            option.textContent = `${amount.toFixed(2)} ${income[category].currency}`; // Display amount with currency
            option.value = index;
            selectElement.appendChild(option);
        });
    }
}

