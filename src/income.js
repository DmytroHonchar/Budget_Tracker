
let income = {};

// Function to add amount to income object
function addAmount(category, amount) {
    amount = parseFloat(amount);
    if (!income[category]) {
        income[category] = [];
    }
    income[category].push(amount);
}

// Card form submit event listener
document.getElementById('cardForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var amountPound = document.getElementById('amount£').value;
    var amountEuro = document.getElementById('amount€').value;

    if (isValidPositiveNumber(amountPound)) {
        addAmount('card£', amountPound);
        displayIncome('card£', amountPound, 'outputCard£');
    }

    if (isValidPositiveNumber(amountEuro)) {
        addAmount('card€', amountEuro);
        displayIncome('card€', amountEuro, 'outputCard€');
    }
});

// Cash form submit event listener
document.getElementById('cashForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var amountPound = document.getElementById('amountCash£').value;
    var amountEuro = document.getElementById('amountCash€').value;

    if (isValidPositiveNumber(amountPound)) {
        addAmount('cash£', amountPound);
        displayIncome('cash£', amountPound, 'outputCash£');
    }

    if (isValidPositiveNumber(amountEuro)) {
        addAmount('cash€', amountEuro);
        displayIncome('cash€', amountEuro, 'outputCash€');
    }
});

// Function to display income
function displayIncome(category, amount, outputId) {
    document.getElementById(outputId).innerHTML = `<p>${category}: £${amount}</p>`;
}

// Function to check if input is a valid positive number
function isValidPositiveNumber(input) {
    const number = Number(input);
    return !isNaN(number) && number >= 0 && number.toString() === input.trim();
}
