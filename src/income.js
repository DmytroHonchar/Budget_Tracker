let income = {};
let totalPound = 0;
let totalEuro = 0;
let grandTotalPound = 0;
let grandTotalEuro = 0;
let exchangeRatePoundToEuro = 1.15;
let exchangeRateEuroToPound = 0.87;

let initialTotals = {
    total_card_pounds: 0,
    total_card_euro: 0,
    total_cash_pounds: 0,
    total_cash_euro: 0,
};

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
    saveTotalsToDatabase(); // Save to database after updating totals
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
        saveTotalsToDatabase(); // Save to database after updating totals
    } else {
        alert(`Insufficient total in ${category} to subtract ${amount}`);
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

// Event listener for subtract form submission
document.getElementById('subtractForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const category = document.getElementById('subtractCategory').value;
    const amount = document.getElementById('subtractAmount').value;

    if (isValidPositiveNumber(amount)) {
        subtractAmount(category, amount);
    }

    document.getElementById('subtractForm').reset();
});

// Event listener to fetch and display totals on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayTotals();
});

// Function to fetch and display totals from the database
async function fetchAndDisplayTotals() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/totals', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const totals = await response.json();

        initialTotals.total_card_pounds = parseFloat(totals.total_card_pounds) || 0;
        initialTotals.total_card_euro = parseFloat(totals.total_card_euro) || 0;
        initialTotals.total_cash_pounds = parseFloat(totals.total_cash_pounds) || 0;
        initialTotals.total_cash_euro = parseFloat(totals.total_cash_euro) || 0;

        displayCurrentTotals();
        updateOverallTotal();
    } catch (error) {
        console.error('Error fetching totals:', error.message);
    }
}

// Function to display current totals
function displayCurrentTotals() {
    document.getElementById('totalcard£').textContent = `Total on Card: £${initialTotals.total_card_pounds.toFixed(2)}`;
    document.getElementById('totalcard€').textContent = `Total on Card: €${initialTotals.total_card_euro.toFixed(2)}`;
    document.getElementById('totalcash£').textContent = `Total in Cash: £${initialTotals.total_cash_pounds.toFixed(2)}`;
    document.getElementById('totalcash€').textContent = `Total in Cash: €${initialTotals.total_cash_euro.toFixed(2)}`;
}

// Function to save the totals to the database
async function saveTotalsToDatabase() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/updateTotals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                totalCardPounds: initialTotals.total_card_pounds,
                totalCardEuro: initialTotals.total_card_euro,
                totalCashPounds: initialTotals.total_cash_pounds,
                totalCashEuro: initialTotals.total_cash_euro
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Totals saved successfully');
        fetchAndDisplayTotals(); // Refresh the totals after saving
    } catch (error) {
        console.error('Error saving totals:', error);
    }
}

// Function to delete the totals from the database
async function deleteTotalsFromDatabase() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/deleteTotals', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Reset initial totals to zero
        initialTotals.total_card_pounds = 0;
        initialTotals.total_card_euro = 0;
        initialTotals.total_cash_pounds = 0;
        initialTotals.total_cash_euro = 0;

        // Update the display
        displayCurrentTotals();
        updateOverallTotal();
        console.log('Totals deleted successfully');
    } catch (error) {
        console.error('Error deleting totals:', error);
    }
}

// Function to update the overall totals in the display
function updateOverallTotal() {
    totalPound = initialTotals.total_card_pounds + initialTotals.total_cash_pounds;
    totalEuro = initialTotals.total_card_euro + initialTotals.total_cash_euro;

    document.getElementById('outputTotal').innerHTML = `
        Overall Totals:<br>
        Combined Total: £${totalPound.toFixed(2)}<br>
        Combined Total: €${totalEuro.toFixed(2)}<br><br>
    `;
}

// Function to convert totals to pounds
function convertToPounds() {
    grandTotalPound = totalPound + (totalEuro * parseFloat(document.getElementById('exchangeRateEuros').value));
    document.getElementById('outputTotal2').innerHTML = `
        Grand Totals:<br>
        Grand Total: £${grandTotalPound.toFixed(2)}<br>
        Grand Total: €${grandTotalEuro.toFixed(2)}<br>
    `;
    console.log('Grand Total in Pounds updated:', { grandTotalPound });
}

// Function to convert totals to euros
function convertToEuros() {
    grandTotalEuro = totalEuro + (totalPound * parseFloat(document.getElementById('exchangeRatePounds').value));
    document.getElementById('outputTotal2').innerHTML = `
        Grand Totals:<br>
        Grand Total: £${grandTotalPound.toFixed(2)}<br>
        Grand Total: €${grandTotalEuro.toFixed(2)}<br>
        
    `;
    console.log('Grand Total in Euros updated:', { grandTotalEuro });
}

// Event listener for converting to pounds
document.getElementById('convertToPounds').addEventListener('click', convertToPounds);

// Event listener for converting to euros
document.getElementById('convertToEuros').addEventListener('click', convertToEuros);

// Helper function to parse total from the formatted string
function parseTotal(id, currencySymbol) {
    const totalString = document.getElementById(id).textContent;
    const total = parseFloat(totalString.split(currencySymbol)[1]);
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
        const amountsText = income[category].map(val => val >= 0 ? `${val.toFixed(2)}` : `-${Math.abs(val).toFixed(2)}`).join(', ');
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
    const categoryText = category.includes('card') ? 'card' : 'cash';
    const currencySymbol = category.includes('£') ? '£' : '€';
    document.getElementById(`total${category}`).textContent = `Total ${categoryText}: ${currencySymbol}${total.toFixed(2)}`;
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

    if (amountIndex === "" || isNaN(parseFloat(newAmount))) {
        alert("Please select a valid amount to update.");
        return;
    }

    newAmount = parseFloat(newAmount);
    const oldAmount = income[category][amountIndex];

    // Replace the old amount with the new amount
    income[category][amountIndex] = newAmount;

    // Recalculate the totals directly by fetching the new amounts
    updateTotal(category);
    updateOverallTotal();

    displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    refreshDropdown(category);
    saveTotalsToDatabase(); // Save to database after updating totals
});

document.getElementById('deleteAmount').addEventListener('click', function (event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;
    var amountIndex = document.getElementById('amountOptions').value;

    if (amountIndex === "") {
        alert("Please select an amount to delete.");
        return;
    }

    const amountToDelete = income[category][amountIndex];
    income[category].splice(amountIndex, 1);

    // Update the initial totals directly
    if (category === 'card£') initialTotals.total_card_pounds -= amountToDelete;
    if (category === 'card€') initialTotals.total_card_euro -= amountToDelete;
    if (category === 'cash£') initialTotals.total_cash_pounds -= amountToDelete;
    if (category === 'cash€') initialTotals.total_cash_euro -= amountToDelete;

    displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    refreshDropdown(category);
    updateOverallTotal();
    saveTotalsToDatabase(); // Save to database after updating totals
});

// Event listener for deleting total amount
document.getElementById('deleteTotalAmount').addEventListener('click', function (event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;

    if (!category) {
        alert("Please select a category to delete.");
        return;
    }

    // Reset the initial totals for the selected category
    if (category === 'card£') initialTotals.total_card_pounds = 0;
    if (category === 'card€') initialTotals.total_card_euro = 0;
    if (category === 'cash£') initialTotals.total_cash_pounds = 0;
    if (category === 'cash€') initialTotals.total_cash_euro = 0;

    // Clear the income for the selected category
    if (income[category]) {
        income[category] = [];
    }

    // Update the display and save the new totals to the database
    displayCurrentTotals();
    updateOverallTotal();
    saveTotalsToDatabase();
});

function refreshDropdown(category) {
    var selectElement = document.getElementById('amountOptions');
    selectElement.innerHTML = '<option value="">Select an amount</option>';

    if (income[category] && income[category].length > 0) {
        income[category].forEach(function (amount, index) {
            var option = document.createElement('option');
            option.textContent = `${amount.toFixed(2)}`;
            option.value = index;
            selectElement.appendChild(option);
        });
    }
}

// Event listener for logout
document.getElementById('logout').addEventListener('click', function(event) {
    event.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html'; // Redirect to login page after logout
});
