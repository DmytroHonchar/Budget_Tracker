var form = document.getElementById('dataForm');
let outcome = {};

function addAmount(category, amount) {
    amount = parseFloat(amount);
    if (!outcome[category]) {
        outcome[category] = [];
    }
    outcome[category].push(amount);
}

function sumAmount(category) {
    return outcome[category].reduce((acc, val) => acc + val, 0);
}

function sumTotal() {
    let total = 0;
    for (let cat in outcome) {
        total += sumAmount(cat);
    }
    return total;
}

function displayOutcome() {
    let htmlOutput = "<ul class='category-list'>";
    for (let cat in outcome) {
        let categoryTotal = sumAmount(cat);
        htmlOutput += `<li class='category-item'><span class='category-title'>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>`;
        htmlOutput += "<ul class='amount-list'>"; // Start a new list for the amounts
        for (let amount of outcome[cat]) {
            htmlOutput += `<li class='amount-item'>${amount.toFixed(2)}</li>`; // List each amount as a list item
        }
        htmlOutput += `</ul> <span class='category-total'>(Total: ${categoryTotal.toFixed(2)})</span></li>`;
    }
    htmlOutput += `<li class='grand-total'><strong>Grand Total: ${sumTotal().toFixed(2)}</strong></li>`;
    htmlOutput += "</ul>";

    document.getElementById('output').innerHTML = htmlOutput;
}

function isValidPositiveNumber(input) {
    const number = Number(input);
    return !isNaN(number) && number >= 0 && number.toString() === input.trim();
}

form.addEventListener('submit', function(event) {
    event.preventDefault();
    var category = document.getElementById('category').value;
    var amount = document.getElementById('amount').value;

    if (!isValidPositiveNumber(amount)) {
        alert("Please enter a positive number. Negative values or operators are not allowed.");
        return;
    }

    addAmount(category, parseFloat(amount));
    displayOutcome();
});

document.getElementById('fetchAmount').addEventListener('click', function(event) {
    var category = document.getElementById('updateCategory').value;
    var selectElement = document.getElementById('amountOptions');

    selectElement.innerHTML = '';
    var defaultOption = document.createElement('option');
    defaultOption.textContent = "Select an amount";
    defaultOption.value = "";
    selectElement.appendChild(defaultOption);

    if (outcome[category]) {
        outcome[category].forEach(function(amount, index) {
            var option = document.createElement('option');
            option.textContent = amount;
            option.value = index; // Store the index of the amount in the value attribute
            selectElement.appendChild(option);
        });
    }
});

document.getElementById('updateAmount').addEventListener('click', function(event) {
    var category = document.getElementById('updateCategory').value;
    var amountIndex = document.getElementById('amountOptions').value;
    var newAmount = document.getElementById('newAmount').value;

    if (amountIndex === "") {
        alert("Please select an amount to update.");
        return;
    }

    if (!isValidPositiveNumber(newAmount)) {
        alert("Please enter a positive number for the new amount.");
        return;
    }

    outcome[category][amountIndex] = parseFloat(newAmount);
    displayOutcome();
});

document.getElementById('deleteAmount').addEventListener('click', function(event) {
    var category = document.getElementById('updateCategory').value;
    var amountIndex = document.getElementById('amountOptions').value;

    if (amountIndex === "") {
        alert("Please select an amount to delete.");
        return;
    }

    outcome[category].splice(amountIndex, 1);
    displayOutcome();
});


