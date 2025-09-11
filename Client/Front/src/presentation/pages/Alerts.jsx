import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sidebar } from '../components/system';
import '../styles/pages/Alerts.css';

export default function Alerts() {
  useTheme();
  
  const [alertName, setAlertName] = useState('');
  const [condition, setCondition] = useState('Maior que');
  const [value, setValue] = useState('');

  const handleCreateAlert = async () => {
    if (!alertName || !value) {
      alert('Preencha todos os campos');
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.uid || 'default-user';
      
      const response = await fetch('http://localhost:3000/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          nome: alertName,
          condicao: condition,
          valor: value
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Alerta criado com sucesso!');
        setAlertName('');
        setValue('');
      } else {
        alert('Erro: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      alert('Erro ao conectar com o servidor');
    }
  };

  return (
    <div className="sys-layout">
      <Sidebar />
      
      <main className="alerts-main">
        <div className="alerts-container">
          <h1 className="alerts-title">Alertas Personalizados</h1>
          
          <div className="alert-form-card">
            <h2 className="form-title">Criar Novo Alerta</h2>
            <p className="form-subtitle">Configure alertas personalizados para monitorar suas finanças</p>
            
            <div className="form-group">
              <label htmlFor="alertName">Nome do Alerta</label>
              <input
                id="alertName"
                type="text"
                placeholder="Ex: Limite de Gastos Mensal"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="condition">Condição</label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="Maior que">Maior que</option>
                <option value="Menor que">Menor que</option>
                <option value="Igual a">Igual a</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="value">Valor</label>
              <input
                id="value"
                type="text"
                placeholder="R$ 0,00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            
            <button className="create-alert-btn" onClick={handleCreateAlert}>
              + Criar Alerta
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}