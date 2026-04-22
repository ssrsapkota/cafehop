/**
 * Splitwise-style Greedy Algorithm for Minimized Transactions
 * @param {Object} globalNet - { name: amount } where positive = owed money, negative = owes money
 * @returns {Array} List of optimized settlements { from, to, amount }
 */
export const simplifyDebts = (globalNet) => {
    const debtors = [];
    const creditors = [];
    
    Object.entries(globalNet).forEach(([name, amount]) => {
        if (amount <= -0.01) debtors.push({ name, amount: Math.abs(amount) });
        else if (amount >= 0.01) creditors.push({ name, amount });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    const optimizedSettlements = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
        const debtor = debtors[dIdx];
        const creditor = creditors[cIdx];
        const minSettlement = Math.min(debtor.amount, creditor.amount);

        optimizedSettlements.push({
            from: debtor.name,
            to: creditor.name,
            amount: minSettlement
        });

        debtor.amount -= minSettlement;
        creditor.amount -= minSettlement;

        if (debtor.amount < 0.01) dIdx++;
        if (creditor.amount < 0.01) cIdx++;
    }

    return optimizedSettlements;
};
