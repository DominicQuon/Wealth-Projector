let propertyCount = 0;

function addProperty() {
    propertyCount++;
    const propertyDiv = document.createElement('div');
    propertyDiv.className = 'property';
    propertyDiv.innerHTML = `
        <h2>Property ${propertyCount}</h2>
        <div class="summary" id="summary${propertyCount}"></div>
        <label>
            <input type="checkbox" id="includeProperty${propertyCount}" checked> Include in Calculation
        </label>

        <button class="remove-property" onclick="removeProperty(this)">Remove Property</button>
        <div class="input-group">
            <label for="initialValue${propertyCount}">Initial Value ($):</label>
            <input type="number" id="initialValue${propertyCount}" value="384000">
        </div>
        <div class="input-group">
            <label for="downPaymentPercent${propertyCount}">Down Payment (%):</label>
            <input type="number" id="downPaymentPercent${propertyCount}" value="20">
        </div>
        <div class="input-group">
            <label for="downPaymentAmount${propertyCount}">Down Payment ($):</label>
            <input type="number" id="downPaymentAmount${propertyCount}" value="76800">
        </div>
        <div class="input-group">
            <label for="amortization${propertyCount}">Amortization (years):</label>
            <input type="number" id="amortization${propertyCount}" value="25">
        </div>
        <div class="input-group">
            <label for="interestRate${propertyCount}">Interest Rate (%):</label>
            <input type="number" id="interestRate${propertyCount}" value="2.9" step="0.1">
        </div>
        <div class="input-group">
            <label for="appreciationRate${propertyCount}">Yearly Appreciation Rate (%):</label>
            <input type="number" id="appreciationRate${propertyCount}" value="2" step="0.1">
        </div>
        <div class="input-group">
            <label for="rentalIncome${propertyCount}">Monthly Rental Income ($):</label>
            <input type="number" id="rentalIncome${propertyCount}" value="2000">
        </div>
        <div class="input-group">
            <label for="prepayment${propertyCount}">Monthly Prepayment ($):</label>
            <input type="number" id="prepayment${propertyCount}" value="0">
        </div>
    `;
    document.getElementById('propertiesContainer').appendChild(propertyDiv);
    attachEventListeners(propertyCount);
    updateSummary(propertyCount);
    updateTotalSummary();
}

function removeProperty(button) {
    button.closest('.property').remove();
    renumberProperties();
    updateAllSummaries();
    updateTotalSummary();
}

function renumberProperties() {
    const properties = document.querySelectorAll('.property');
    properties.forEach((property, index) => {
        const newIndex = index + 1;
        property.querySelector('h2').textContent = `Property ${newIndex}`;
        property.querySelectorAll('[id]').forEach(element => {
            element.id = element.id.replace(/\d+$/, newIndex);
        });
        property.querySelectorAll('[for]').forEach(element => {
            element.setAttribute('for', element.getAttribute('for').replace(/\d+$/, newIndex));
        });
    });
    propertyCount = properties.length;
}

function attachEventListeners(id) {
    const inputs = document.querySelectorAll(`#initialValue${id}, #downPaymentPercent${id}, #downPaymentAmount${id}, #amortization${id}, #interestRate${id}, #appreciationRate${id}, #rentalIncome${id}, #prepayment${id}`);
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            updateSummary(id);
            updateTotalSummary();
        });
    });

    document.getElementById(`includeProperty${id}`).addEventListener('change', updateTotalSummary);

    const downPaymentPercent = document.getElementById(`downPaymentPercent${id}`);
    const downPaymentAmount = document.getElementById(`downPaymentAmount${id}`);
    const initialValue = document.getElementById(`initialValue${id}`);

    downPaymentPercent.addEventListener('input', () => {
        downPaymentAmount.value = (initialValue.value * downPaymentPercent.value / 100).toFixed(2);
        updateSummary(id);
        updateTotalSummary();
    });

    downPaymentAmount.addEventListener('input', () => {
        downPaymentPercent.value = (downPaymentAmount.value / initialValue.value * 100).toFixed(2);
        updateSummary(id);
        updateTotalSummary();
    });

    initialValue.addEventListener('input', () => {
        downPaymentAmount.value = (initialValue.value * downPaymentPercent.value / 100).toFixed(2);
        updateSummary(id);
        updateTotalSummary();
    });
}

function updateSummary(id) {
    const initialValue = parseFloat(document.getElementById(`initialValue${id}`).value) || 0;
    const downPayment = parseFloat(document.getElementById(`downPaymentAmount${id}`).value) || 0;
    const amortization = parseFloat(document.getElementById(`amortization${id}`).value) || 1;
    const interestRate = (parseFloat(document.getElementById(`interestRate${id}`).value) || 0) / 100 / 12;
    const appreciationRate = (parseFloat(document.getElementById(`appreciationRate${id}`).value) || 0) / 100;
    const rentalIncome = parseFloat(document.getElementById(`rentalIncome${id}`).value) || 0;
    const prepayment = parseFloat(document.getElementById(`prepayment${id}`).value) || 0;
    const years = parseInt(document.getElementById('yearSlider').value) || 0;

    const loanAmount = initialValue - downPayment;
    const monthlyPayment = (loanAmount * interestRate * Math.pow(1 + interestRate, amortization * 12)) / (Math.pow(1 + interestRate, amortization * 12) - 1);

    let remainingBalance = loanAmount;
    let totalInterest = 0;
    let totalRental = 0;
    let currentValue = initialValue;
    let totalEquityPaid = 0;

    if (years > 0) {
        for (let i = 0; i < years * 12; i++) {
            const interestPayment = remainingBalance * interestRate;
            let principalPayment = monthlyPayment - interestPayment;
            
            // Apply prepayment
            principalPayment += prepayment;
            
            totalInterest += interestPayment;
            totalEquityPaid += principalPayment;
            remainingBalance -= principalPayment;
            
            if (remainingBalance < 0) {
                totalEquityPaid += remainingBalance; // Adjust for overpayment
                remainingBalance = 0;
            }
            
            totalRental += rentalIncome;
            if (i % 12 === 11) currentValue *= (1 + appreciationRate);
        }
    }

    const summaryDiv = document.getElementById(`summary${id}`);
    summaryDiv.innerHTML = `
        <p>${years > 0 ? `After ${years} year${years > 1 ? 's' : ''}:` : 'Initial values:'}</p>
        <p>Property Value: $${formatNumber(currentValue)}</p>
        <p>Monthly Payment: $${formatNumber(monthlyPayment)}</p>
        ${years > 0 ? `
        <p>Total Equity Built: $${formatNumber(totalEquityPaid)}</p>
        <p>Total Interest Paid: $${formatNumber(totalInterest)}</p>
        <p>Total Rental Income: $${formatNumber(totalRental)}</p>
        ` : ''}
        <p>Remaining Debt: $${formatNumber(remainingBalance)}</p>
    `;
}

function updateTotalSummary() {
    let totalValue = 0;
    let totalEquityPaid = 0;
    let totalInterest = 0;
    let totalRental = 0;
    let totalDebt = 0;

    const years = parseInt(document.getElementById('yearSlider').value) || 0;

    document.querySelectorAll('.property').forEach((property) => {
        const checkbox = property.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            const summaryDiv = property.querySelector('.summary');
            if (summaryDiv) {
                const values = summaryDiv.innerText.match(/\$[\d,]+\.\d{2}/g);
                if (values) {
                    totalValue += parseFloat(values[0].replace(/[$,]/g, ''));
                    totalDebt += parseFloat(values[values.length - 1].replace(/[$,]/g, ''));
                    if (years > 0 && values.length > 4) {
                        totalEquityPaid += parseFloat(values[2].replace(/[$,]/g, ''));
                        totalInterest += parseFloat(values[3].replace(/[$,]/g, ''));
                        totalRental += parseFloat(values[4].replace(/[$,]/g, ''));
                    }
                }
            }
        }
    });

    const netWorth = totalValue - totalDebt + totalRental;

    const totalSummaryDiv = document.getElementById('totalSummary');
    totalSummaryDiv.innerHTML = `
        <h2>Total Summary</h2>
        <p>Total Property Value: $${formatNumber(totalValue)}</p>
        <p>Total Equity Built: $${formatNumber(totalEquityPaid)}</p>
        <p>Total Interest Paid: $${formatNumber(totalInterest)}</p>
        <p>Total Rental Income: $${formatNumber(totalRental)}</p>
        <p>Total Remaining Debt: $${formatNumber(totalDebt)}</p>
        <p>Net Worth: $${formatNumber(netWorth)}</p>
    `;
}

function updateAllSummaries() {
    document.querySelectorAll('.property').forEach((property, index) => {
        updateSummary(index + 1);
    });
}

function formatNumber(num) {
    return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

document.getElementById('addProperty').addEventListener('click', addProperty);
document.getElementById('yearSlider').addEventListener('input', function() {
    document.getElementById('yearValue').textContent = this.value;
    updateAllSummaries();
    updateTotalSummary();
});

// Add initial property and update summary
addProperty();
updateTotalSummary();
