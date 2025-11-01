class FilterContext {
    constructor(strategy) {
        this.strategy = strategy;
    }
    
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    
    filter(transactions, criteria) {
        return this.strategy.filter(transactions, criteria);
    }
}

class DateRangeFilter {
    filter(transactions, { startDate, endDate }) {
        if (!startDate || !endDate) return transactions;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return transactions.filter(transaction => {
            const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
            if (!dateField) return false;
            
            let transactionDate;
            if (typeof dateField === 'string' && dateField.includes('/')) {
                const [datePart] = dateField.split(', ');
                const [day, month, year] = datePart.split('/');
                transactionDate = new Date(year, month - 1, day);
            } else {
                transactionDate = new Date(dateField);
            }
            
            return transactionDate >= start && transactionDate <= end;
        });
    }
}

class CategoryFilter {
    filter(transactions, { category }) {
        if (!category) return transactions;
        return transactions.filter(t => t.categoria === category);
    }
}

class TypeFilter {
    filter(transactions, { type }) {
        if (!type) return transactions;
        return transactions.filter(t => t.tipo?.toLowerCase() === type.toLowerCase());
    }
}

class PeriodFilter {
    filter(transactions, { period }) {
        if (!period) return transactions;
        
        const now = new Date();
        let filterDate;
        
        switch (period) {
            case 'week':
                filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                filterDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'year':
                filterDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return transactions;
        }
        
        return transactions.filter(transaction => {
            const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
            if (!dateField) return false;
            
            let transactionDate;
            if (typeof dateField === 'string' && dateField.includes('/')) {
                const [datePart] = dateField.split(', ');
                const [day, month, year] = datePart.split('/');
                transactionDate = new Date(year, month - 1, day);
            } else {
                transactionDate = new Date(dateField);
            }
            
            return transactionDate >= filterDate;
        });
    }
}

export { FilterContext, DateRangeFilter, CategoryFilter, TypeFilter, PeriodFilter };