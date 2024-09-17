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

// Function to format numbers with commas
function formatNumberWithCommas(number) {
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Function to show modal messages
function showModalMessage(message) {
    const messageModal = document.getElementById('messageModal');
    const messageContent = document.getElementById('messageContent');
    messageContent.textContent = message;
    messageModal.style.display = 'block';
}

// Function to close modal messages
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
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
    saveTotalsToDatabase(); // Save to database after updating totals
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
        saveTotalsToDatabase(); // Save to database after updating totals
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
        saveTotalsToDatabase(); // Save to database after updating totals
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
        saveTotalsToDatabase(); // Save to database after updating totals
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
        saveTotalsToDatabase();
    }
});

// Event listener for fetching totals on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayTotals();
    fetchAmounts(document.getElementById('category').value); // Fetch amounts for the initially selected category
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
    document.getElementById('totalcard£').textContent = `£${formatNumberWithCommas(initialTotals.total_card_pounds)}`;
    document.getElementById('totalcard€').textContent = `€${formatNumberWithCommas(initialTotals.total_card_euro)}`;
    document.getElementById('totalcash£').textContent = `£${formatNumberWithCommas(initialTotals.total_cash_pounds)}`;
    document.getElementById('totalcash€').textContent = `€${formatNumberWithCommas(initialTotals.total_cash_euro)}`;
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

// Function to update the overall totals in the display
function updateOverallTotal() {
    totalPound = initialTotals.total_card_pounds + initialTotals.total_cash_pounds;
    totalEuro = initialTotals.total_card_euro + initialTotals.total_cash_euro;

    document.getElementById('outputTotal').innerHTML = `
        Totals:<br>
        £${formatNumberWithCommas(totalPound)}<br>
        €${formatNumberWithCommas(totalEuro)}
    `;
}

// Function to convert totals to pounds
function convertToPounds() {
    grandTotalPound = totalPound + (totalEuro * parseFloat(document.getElementById('exchangeRateEuros').value));
    document.getElementById('outputTotal2').querySelector('p:nth-child(2)').textContent = `£${formatNumberWithCommas(grandTotalPound)}
    `;
    console.log('Grand Total in Pounds updated:', { grandTotalPound });
}

// Function to convert totals to euros
function convertToEuros() {
    grandTotalEuro = totalEuro + (totalPound * parseFloat(document.getElementById('exchangeRatePounds').value));
    document.getElementById('outputTotal2').querySelector('p:nth-child(3)').textContent = `€${formatNumberWithCommas(grandTotalEuro)}`;
    console.log('Grand Total in Euros updated:', { grandTotalEuro });
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
    const categoryText = category.includes('card') ? 'card' : 'cash';
    const currencySymbol = category.includes('£') ? '£' : '€';
    document.getElementById(`total${category}`).textContent = `Total ${categoryText}: ${currencySymbol}${formatNumberWithCommas(total)}`;
}

// Event listener for logout
document.getElementById('logout').addEventListener('click', function(event) {
    event.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html'; // Redirect to login page after logout
});

// JavaScript for account actions
document.getElementById('account-icon').addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent the click event from bubbling up to the window
    this.classList.toggle('open');
});

// Close the menu when clicking outside of it
window.addEventListener('click', function(event) {
    var dropdowns = document.getElementsByClassName('account-icon');
    for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('open')) {
            openDropdown.classList.remove('open');
        }
    }
});

document.getElementById('update-email').addEventListener('click', function() {
    openModal('updateEmailModal');
});

document.getElementById('change-password').addEventListener('click', function() {
    openModal('changePasswordModal');
});

document.getElementById('delete-account').addEventListener('click', function() {
    openModal('deleteAccountModal');
});

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    const modals = ['updateEmailModal', 'changePasswordModal', 'deleteAccountModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target == modal) {
            closeModal(modalId);
        }
    });
};

// Handle form submissions
document.getElementById('updateEmailForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const newEmail = document.getElementById('newEmail').value;
    try {
        const response = await fetch('http://localhost:3000/update-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ newEmail })
        });
        if (response.ok) {
            showModalMessage('Email updated successfully');
            closeModal('updateEmailModal');
        } else {
            showModalMessage('Error updating email');
        }
    } catch (error) {
        console.error('Error:', error);
        showModalMessage('Error updating email');
    }
});

document.getElementById('changePasswordForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    try {
        const response = await fetch('http://localhost:3000/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        if (response.ok) {
            showModalMessage('Password changed successfully');
            closeModal('changePasswordModal');
        } else {
            showModalMessage('Error changing password');
        }
    } catch (error) {
        console.error('Error:', error);
        showModalMessage('Error changing password');
    }
});

document.getElementById('deleteAccountForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    console.log('Delete account form submitted');
    try {
        const response = await fetch('http://localhost:3000/delete-account', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            showModalMessage('Account deleted successfully');
            closeModal('deleteAccountModal');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        } else {
            const errorText = await response.text();
            console.error('Error deleting account:', errorText);
            showModalMessage(`Error deleting account: ${errorText}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showModalMessage('Error deleting account');
    }
});
