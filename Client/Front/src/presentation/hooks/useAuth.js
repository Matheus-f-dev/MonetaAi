import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const login = async (email, senha) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
      }
      
      setMessage(data.message || (data.success ? 'Login realizado com sucesso!' : 'Erro no login'));
      return data;
    } catch (error) {
      const errorMsg = 'Erro ao conectar com o servidor.';
      setMessage(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      setMessage(data.message || (data.success ? 'Cadastro realizado com sucesso!' : 'Erro no cadastro'));
      return data;
    } catch (error) {
      const errorMsg = 'Erro ao conectar com o servidor.';
      setMessage(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/esqueci-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setMessage(data.message || (data.success ? 'Link de redefinição enviado!' : 'Erro ao enviar link'));
      return data;
    } catch (error) {
      const errorMsg = 'Erro ao conectar com o servidor.';
      setMessage(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email) => {
    try {
      const response = await fetch(`${API_URL}/api/verificar-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      return await response.json();
    } catch (error) {
      return { exists: false };
    }
  };

  const googleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return {
    loading,
    message,
    login,
    register,
    resetPassword,
    verifyEmail,
    googleLogin
  };
};