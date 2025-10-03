// Singleton Pattern - Frontend API Connection
class ApiConnection {
  static instance = null;
  
  constructor() {
    if (ApiConnection.instance) {
      return ApiConnection.instance;
    }
    
    this.baseURL = 'http://localhost:3000';
    this.headers = {
      'Content-Type': 'application/json'
    };
    
    ApiConnection.instance = this;
    return this;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.headers,
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }
  
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default ApiConnection;