const API_BASE_URL = 'http://localhost:3000/api';

export const authApi = {
  async login(email, senha) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro no login');
    }

    return data;
  },

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/cadastro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro no cadastro');
    }

    return data;
  },

  async getUserTransactions(userId, token) {
    const response = await fetch(`${API_BASE_URL}/transactions/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar transações');
    }

    return data;
  },

  async getUserBalance(userId, token) {
    const response = await fetch(`${API_BASE_URL}/balance/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar saldo');
    }

    return data;
  },

  async createTransaction(transactionData, token) {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(transactionData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar transação');
    }

    return data;
  }
};