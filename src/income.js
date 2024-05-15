let income = {};
let totalPound = 0;
let totalEuro = 0;
let grandTotalPound = 0;
let grandTotalEuro = 0;
let exchangeRatePoundToEuro = 1.15; // Default exchange rate
let exchangeRateEuroToPound = 0.87; // Default exchange rate


// Function to add amount to income object
function addAmount(category, amount, currency) {
    amount = parseFloat(amount);
    if (!income[category]) {
        income[category] = [];
    }
    income[category].push(amount);
    income[category].currency = currency;
}

// Function to subtract amount from income object
function subtractAmount(category, amount) {
    amount = parseFloat(amount);
    if (income[category] && income[category].length > 0) {
        // Add the negative amount to the category
        income[category].push(-amount);
        displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    }
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

// Event listener for subtract form submission
document.getElementById('subtractForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var category = document.getElementById('subtractCategory').value;
    var amount = document.getElementById('subtractAmount').value;

    if (isValidPositiveNumber(amount)) {
        subtractAmount(category, amount);
    }

    document.getElementById('subtractForm').reset();
});

// Function to display income
function displayIncome(category, outputId) {
    const outputElement = document.getElementById(outputId);
    if (income[category] && income[category].length > 0) {
        const amountsText = income[category].map(val => val >= 0 ? `${val.toFixed(2)}` : `-${Math.abs(val).toFixed(2)}`).join(', ');
        outputElement.textContent = `${category}: ${amountsText}`;
    } else {
        outputElement.textContent = ''; // Keep it empty if no data
    }

    // Update total display for the category
    updateTotal(category);
}

// Function to update total income for a specific category
function updateTotal(category) {
    let total = 0;
    if (income[category] && income[category].length > 0) {
        total = income[category].reduce((acc, val) => acc + val, 0);
    }
    document.getElementById(`total${category}`).textContent = `Total ${income[category].currency || ''}${total.toFixed(2)}`;

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
        Grand Total Pounds: £${grandTotalPound.toFixed(2)}<br>
        Grand Total Euros: €${grandTotalEuro.toFixed(2)}<br>
    `;
}

// Helper function to parse total from the formatted string
function parseTotal(id, currencySymbol) {
    const totalString = document.getElementById(id).textContent;
    const total = parseFloat(totalString.split(currencySymbol)[1]);
    return isNaN(total) ? 0 : total;
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

// Event listener to fetch total amount for a category
document.getElementById('fetchTotalAmount').addEventListener('click', function(event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;

    if (income[category] && income[category].length > 0) {
        var total = income[category].reduce((acc, val) => acc + val, 0);
        alert(`Total for ${category}: ${income[category].currency}${total.toFixed(2)}`);
    } else {
        alert(`No data for ${category}`);
    }
});

// Event listener to delete total amount for a category
document.getElementById('deleteTotalAmount').addEventListener('click', function(event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;

    if (confirm(`Are you sure you want to delete all amounts for ${category}?`)) {
        income[category] = [];
        displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);

        // Refresh the overall totals
        updateOverallTotal();

        // Refresh the dropdown to reflect changes
        refreshDropdown(category);
    }
});

// Currency conversion functions
function convertToPounds() {
    grandTotalPound = totalPound + (totalEuro * parseFloat(document.getElementById('exchangeRateEuros').value));
    updateOverallTotal();
}

function convertToEuros() {
    grandTotalEuro = totalEuro + (totalPound * parseFloat(document.getElementById('exchangeRatePounds').value));
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
