export class AuthService {
  constructor() {
    this.baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;
  }

  async login(email, senha) {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    return await response.json();
  }

  async register(userData) {
    const response = await fetch(`${this.baseUrl}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  }

  async resetPassword(email) {
    const response = await fetch(`${this.baseUrl}/esqueci-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await response.json();
  }

  async verifyEmail(email) {
    const response = await fetch(`${this.baseUrl}/verificar-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await response.json();
  }
}