let income = {};
let totalPound = 0;
let totalEuro = 0;
let grandTotalPound = 0;
let grandTotalEuro = 0;
let exchangeRatePoundToEuro = 1.15; // Default exchange rate
let exchangeRateEuroToPound = 0.87; // Default exchange rate

// Function to add amount to income object and database
async function addAmount(category, amount) {
    amount = parseFloat(amount);
    if (!income[category]) {
        income[category] = [];
    }
    income[category].push(amount);

    try {
        const response = await fetch('http://localhost:3000/addAmount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category, amount }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Amount added successfully:', { category, amount });
    } catch (error) {
        console.error('Error adding amount:', error);
    }

    displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
}

// Function to subtract amount from income object and database
async function subtractAmount(category, amount) {
    amount = parseFloat(amount);
    if (income[category] && income[category].length > 0) {
        income[category].push(-amount);

        try {
            const response = await fetch('http://localhost:3000/addAmount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ category, amount: -amount }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log('Amount subtracted successfully:', { category, amount });
        } catch (error) {
            console.error('Error subtracting amount:', error);
        }

        displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    }
}

// Event listener for card form submission
document.getElementById('cardForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const amountPound = document.getElementById('amount£').value;
    const amountEuro = document.getElementById('amount€').value;

    if (isValidPositiveNumber(amountPound)) {
        await addAmount('card£', amountPound);
    }
    if (isValidPositiveNumber(amountEuro)) {
        await addAmount('card€', amountEuro);
    }

    document.getElementById('cardForm').reset();
    updateTotals();
});

// Event listener for cash form submission
document.getElementById('cashForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const amountPound = document.getElementById('amountCash£').value;
    const amountEuro = document.getElementById('amountCash€').value;

    if (isValidPositiveNumber(amountPound)) {
        await addAmount('cash£', amountPound);
    }
    if (isValidPositiveNumber(amountEuro)) {
        await addAmount('cash€', amountEuro);
    }

    document.getElementById('cashForm').reset();
    updateTotals();
});

// Event listener for subtract form submission
document.getElementById('subtractForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const category = document.getElementById('subtractCategory').value;
    const amount = document.getElementById('subtractAmount').value;

    if (isValidPositiveNumber(amount)) {
        await subtractAmount(category, amount);
    }

    document.getElementById('subtractForm').reset();
    updateTotals();
});

// Function to fetch and update totals from the database
async function updateTotals() {
    try {
        const response = await fetch('http://localhost:3000/totals');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const totals = await response.json();

        // Ensure the values are parsed as numbers
        const total_card_pounds = parseFloat(totals.total_card_pounds) || 0;
        const total_card_euro = parseFloat(totals.total_card_euro) || 0;
        const total_cash_pounds = parseFloat(totals.total_cash_pounds) || 0;
        const total_cash_euro = parseFloat(totals.total_cash_euro) || 0;

        document.getElementById('totalcard£').textContent = `Total card: £${total_card_pounds.toFixed(2)}`;
        document.getElementById('totalcard€').textContent = `Total card: €${total_card_euro.toFixed(2)}`;
        document.getElementById('totalcash£').textContent = `Total cash: £${total_cash_pounds.toFixed(2)}`;
        document.getElementById('totalcash€').textContent = `Total cash: €${total_cash_euro.toFixed(2)}`;
        document.getElementById('outputTotal').innerHTML = `
            Total money:<br>
            Total (£): £${(total_card_pounds + total_cash_pounds).toFixed(2)}<br>
            Total (€): €${(total_card_euro + total_cash_euro).toFixed(2)}<br>
            Grand Total Pounds: £${grandTotalPound.toFixed(2)}<br>
            Grand Total Euros: €${grandTotalEuro.toFixed(2)}<br>
        `;
    } catch (error) {
        console.error('Error fetching totals:', error.message);
    }
}

// Event listener to fetch and display totals on page load
document.addEventListener('DOMContentLoaded', updateTotals);

// Functions for currency conversion
function convertToPounds() {
    grandTotalPound = totalPound + (totalEuro * parseFloat(document.getElementById('exchangeRateEuros').value));
    updateTotals();
}

function convertToEuros() {
    grandTotalEuro = totalEuro + (totalPound * parseFloat(document.getElementById('exchangeRatePounds').value));
    updateTotals();
}

// Function to check if input is a valid positive number
function isValidPositiveNumber(input) {
    const number = parseFloat(input);
    return !isNaN(number) && number > 0;
}

// Function to display income
function displayIncome(category, outputId) {
    const outputElement = document.getElementById(outputId);
    if (income[category] && income[category].length > 0) {
        const amountsText = income[category].map(val => val >= 0 ? `${val.toFixed(2)}` : `-${Math.abs(val).toFixed(2)}`).join(', ');
        outputElement.textContent = `${category}: ${amountsText}`;
    } else {
        outputElement.textContent = ''; // Keep it empty if no data
    }

    updateTotal(category);
}

// Function to update total income for a specific category
function updateTotal(category) {
    let total = 0;
    if (income[category] && income[category].length > 0) {
        total = income[category].reduce((acc, val) => acc + val, 0);
    }
    document.getElementById(`total${category}`).textContent = `Total ${income[category].currency || ''}${total.toFixed(2)}`;
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

// Event listener for fetching amounts
document.getElementById('fetchAmount').addEventListener('click', function (event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;
    var selectElement = document.getElementById('amountOptions');
    var defaultOption = document.createElement('option');

    selectElement.innerHTML = '';
    defaultOption.textContent = "Select an amount";
    defaultOption.value = "";
    selectElement.appendChild(defaultOption);

    if (income[category] && income[category].length > 0) {
        income[category].forEach(function (amount, index) {
            var option = document.createElement('option');
            option.textContent = amount;
            option.value = index;
            selectElement.appendChild(option);
        });
    }
});

document.getElementById('updateAmount').addEventListener('click', function (event) {
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
    refreshDropdown(category);
    document.getElementById('amountOptions').value = "";
});

document.getElementById('deleteAmount').addEventListener('click', function (event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;
    var amountIndex = document.getElementById('amountOptions').value;

    if (amountIndex === "") {
        alert("Please select an amount to delete.");
        return;
    }

    income[category].splice(amountIndex, 1);
    displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    refreshDropdown(category);
    document.getElementById('amountOptions').value = "";
});

document.getElementById('fetchTotalAmount').addEventListener('click', function (event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;

    if (income[category] && income[category].length > 0) {
        var total = income[category].reduce((acc, val) => acc + val, 0);
        alert(`Total for ${category}: ${income[category].currency}${total.toFixed(2)}`);
    } else {
        alert(`No data for ${category}`);
    }
});

document.getElementById('deleteTotalAmount').addEventListener('click', function (event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;

    if (confirm(`Are you sure you want to delete all amounts for ${category}?`)) {
        income[category] = [];
        displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
        updateOverallTotal();
        refreshDropdown(category);
    }
});

function refreshDropdown(category) {
    var selectElement = document.getElementById('amountOptions');
    selectElement.innerHTML = '<option value="">Select an amount</option>';

    if (income[category] && income[category].length > 0) {
        income[category].forEach(function (amount, index) {
            var option = document.createElement('option');
            option.textContent = `${amount.toFixed(2)} ${income[category].currency}`;
            option.value = index;
            selectElement.appendChild(option);
        });
    }
}
