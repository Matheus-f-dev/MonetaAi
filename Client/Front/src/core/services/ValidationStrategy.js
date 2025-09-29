class ValidationContext {
    constructor(strategy) {
        this.strategy = strategy;
    }
    
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    
    validate(data) {
        return this.strategy.validate(data);
    }
}

class EmailValidation {
    validate(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: emailRegex.test(email),
            message: emailRegex.test(email) ? 'Email válido' : 'Email inválido'
        };
    }
}

class PasswordValidation {
    validate(password) {
        const isValid = password && password.length >= 8;
        return {
            isValid,
            message: isValid ? 'Senha válida' : 'Senha deve ter pelo menos 8 caracteres'
        };
    }
}

class AmountValidation {
    validate(amount) {
        const numAmount = parseFloat(amount);
        const isValid = !isNaN(numAmount) && numAmount > 0;
        return {
            isValid,
            message: isValid ? 'Valor válido' : 'Valor deve ser um número positivo'
        };
    }
}

export { ValidationContext, EmailValidation, PasswordValidation, AmountValidation };