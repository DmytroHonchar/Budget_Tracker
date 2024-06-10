let income = {};
let totalPound = 0;
let totalEuro = 0;
let grandTotalPound = 0;
let grandTotalEuro = 0;
let exchangeRatePoundToEuro = 1.15;
let exchangeRateEuroToPound = 0.87;

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
    updateTotals();
}

// Function to subtract amount from income object and database
async function subtractAmount(category, amount) {
    amount = parseFloat(amount);
    const totalElementId = `total${category}`;
    const currentTotal = parseTotal(totalElementId, category.includes('£') ? '£' : '€');

    if (currentTotal >= amount) {
        if (!income[category]) {
            income[category] = [];
        }
        income[category].push(-amount);

        try {
            const response = await fetch('http://localhost:3000/deleteAmount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ category, amount }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log('Amount subtracted successfully:', { category, amount });
        } catch (error) {
            console.error('Error subtracting amount:', error);
        }

        displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
        updateTotals();
    } else {
        alert(`Insufficient total in ${category} to subtract ${amount}`);
    }
}

// Event listener for card form submission
document.getElementById('cardForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const amountPound = document.getElementById('amountCard£').value;
    const amountEuro = document.getElementById('amountCard€').value;

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

// Event listener to fetch and display totals on page load
document.addEventListener('DOMContentLoaded', updateTotals);

// Function to fetch and update totals from the database
async function updateTotals() {
    try {
        const response = await fetch('http://localhost:3000/totals');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const totals = await response.json();

        const total_card_pounds = parseFloat(totals.total_card_pounds) || 0;
        const total_card_euro = parseFloat(totals.total_card_euro) || 0;
        const total_cash_pounds = parseFloat(totals.total_cash_pounds) || 0;
        const total_cash_euro = parseFloat(totals.total_cash_euro) || 0;

        document.getElementById('totalcard£').textContent = `Total on Card: £${total_card_pounds.toFixed(2)}`;
        document.getElementById('totalcard€').textContent = `Total on Card: €${total_card_euro.toFixed(2)}`;
        document.getElementById('totalcash£').textContent = `Total in Cash: £${total_cash_pounds.toFixed(2)}`;
        document.getElementById('totalcash€').textContent = `Total in Cash: €${total_cash_euro.toFixed(2)}`;

        updateOverallTotal();
    } catch (error) {
        console.error('Error fetching totals:', error.message);
    }
}

// Function to update the overall totals in the display
function updateOverallTotal() {
    totalPound = parseTotal('totalcard£', '£') + parseTotal('totalcash£', '£');
    totalEuro = parseTotal('totalcard€', '€') + parseTotal('totalcash€', '€');
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
    updateOverallTotal();
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

document.getElementById('updateAmount').addEventListener('click', async function (event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;
    var amountIndex = document.getElementById('amountOptions').value;
    var newAmount = document.getElementById('newAmount').value;

    if (amountIndex === "" || !isValidPositiveNumber(newAmount)) {
        alert("Please select a valid amount to update.");
        return;
    }

    const oldAmount = income[category][amountIndex];
    income[category][amountIndex] = parseFloat(newAmount);

    try {
        const response = await fetch('http://localhost:3000/updateAmount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category, oldAmount, newAmount: parseFloat(newAmount) }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Amount updated successfully:', { category, oldAmount, newAmount });
    } catch (error) {
        console.error('Error updating amount:', error);
    }

    displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    updateTotals();
    refreshDropdown(category);
    document.getElementById('amountOptions').value = "";
});

document.getElementById('deleteAmount').addEventListener('click', async function (event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;
    var amountIndex = document.getElementById('amountOptions').value;

    if (amountIndex === "") {
        alert("Please select an amount to delete.");
        return;
    }

    const amountToDelete = income[category][amountIndex];
    income[category].splice(amountIndex, 1);
    
    try {
        const response = await fetch('http://localhost:3000/deleteAmount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ category, amount: amountToDelete }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Amount deleted successfully:', { category, amount: amountToDelete });
    } catch (error) {
        console.error('Error deleting amount:', error);
    }

    displayIncome(category, `output${category.charAt(0).toUpperCase() + category.slice(1)}`);
    updateTotals();
    refreshDropdown(category);
    document.getElementById('amountOptions').value = "";
});

document.getElementById('deleteTotalAmount').addEventListener('click', async function (event) {
    event.preventDefault();
    var category = document.getElementById('updateCategory').value;

    if (confirm(`Are you sure you want to delete all amounts for ${category}?`)) {
        income[category] = [];
        try {
            const response = await fetch('http://localhost:3000/deleteTotalAmount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ category }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log('Total amount deleted successfully:', category);
        } catch (error) {
            console.error('Error deleting total amount:', error);
        }

        const categoryText = category.includes('card') ? 'card' : 'cash';
        const currencySymbol = category.includes('£') ? '£' : '€';
        document.getElementById(`total${category}`).textContent = `Total ${categoryText}: ${currencySymbol}0.00`;

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
            option.textContent = `${amount.toFixed(2)}`;
            option.value = index;
            selectElement.appendChild(option);
        });
    }
}

// design

