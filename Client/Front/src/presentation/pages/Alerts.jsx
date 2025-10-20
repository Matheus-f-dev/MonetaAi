import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAlerts } from '../hooks/useAlerts';
import { Sidebar } from '../components/system';
import { useToast } from '../hooks/useToast';
import '../styles/pages/Alerts.css';

export default function Alerts() {
  useTheme();
  
  const [activeTab, setActiveTab] = useState('create');
  const [alertName, setAlertName] = useState('');
  const [condition, setCondition] = useState('Maior que');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('');
  const [editingAlert, setEditingAlert] = useState(null);
  
  const categories = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação',
    'Vestuário', 'Tecnologia', 'Assinaturas e serviços', 'Impostos e taxas',
    'Doações e caridade', 'Pets', 'Investimentos', 'Dívidas e financiamentos',
    'Presentes e comemorações', 'Casa e decoração', 'Serviços domésticos',
    'Trabalho / Renda extra', 'Salário / Provento fixo', 'Outros'
  ];
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.uid || null;
  
  const { loading, message, alerts, createAlert, updateAlert, deleteAlert } = useAlerts(userId);
  const { addToast } = useToast();

  const handleCreateAlert = async () => {
    if (!alertName || !value || !category) {
      addToast('Preencha todos os campos', 'error');
      return;
    }
    
    if (!userId) {
      addToast('Usuário não encontrado. Faça login novamente.', 'error');
      return;
    }
    
    const result = await createAlert({
      userId,
      nome: alertName,
      condicao: condition,
      valor: value,
      categoria: category
    });
    
    if (result.success) {
      setAlertName('');
      setValue('');
      setCategory('');
    }
    
    addToast(result.message || (result.success ? 'Alerta criado com sucesso!' : 'Erro ao criar alerta'), result.success ? 'success' : 'error');
  };

  const handleEditAlert = (alert) => {
    setEditingAlert(alert);
    setAlertName(alert.nome);
    setCondition(alert.condicao);
    setValue(alert.valor.toString());
    setCategory(alert.categoria || '');
    setActiveTab('create');
  };

  const handleUpdateAlert = async () => {
    if (!alertName || !value || !category) {
      addToast('Preencha todos os campos', 'error');
      return;
    }
    
    const result = await updateAlert(editingAlert.id, {
      userId,
      nome: alertName,
      condicao: condition,
      valor: value,
      categoria: category
    });
    
    if (result.success) {
      setAlertName('');
      setValue('');
      setCategory('');
      setEditingAlert(null);
    }
    
    addToast(result.message || (result.success ? 'Alerta atualizado com sucesso!' : 'Erro ao atualizar alerta'), result.success ? 'success' : 'error');
  };

  const handleDeleteAlert = async (alertId) => {
    const result = await deleteAlert(alertId);
    
    addToast(result.message || (result.success ? 'Alerta excluído com sucesso!' : 'Erro ao excluir alerta'), result.success ? 'success' : 'error');
  };

  const handleCancelEdit = () => {
    setEditingAlert(null);
    setAlertName('');
    setValue('');
    setCategory('');
    setCondition('Maior que');
  };

  return (
    <div className="sys-layout">
      <Sidebar />
      
      <main className="alerts-main">
        <div className="alerts-container">
          <h1 className="alerts-title">Alertas Personalizados</h1>
          
          <div className="alert-tabs">
            <button 
              className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              {editingAlert ? 'Editar Alerta' : 'Criar Alerta'}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              Gerenciar Alertas
            </button>
          </div>
          
          {activeTab === 'create' && (
            <div className="alert-form-card">
              <h2 className="form-title">{editingAlert ? 'Editar Alerta' : 'Criar Novo Alerta'}</h2>
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
                <label htmlFor="category">Categoria</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
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
              
              <div className="form-actions">
                <button 
                  className="create-alert-btn" 
                  onClick={editingAlert ? handleUpdateAlert : handleCreateAlert} 
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : (editingAlert ? 'Atualizar Alerta' : '+ Criar Alerta')}
                </button>
                {editingAlert && (
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'manage' && (
            <div className="alerts-list-card">
              <h2 className="form-title">Meus Alertas</h2>
              <p className="form-subtitle">Gerencie seus alertas existentes</p>
              
              {loading ? (
                <div className="loading">Carregando alertas...</div>
              ) : alerts.length === 0 ? (
                <div className="no-alerts">Nenhum alerta criado ainda</div>
              ) : (
                <div className="alerts-list">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="alert-item">
                      <div className="alert-info">
                        <h3>{alert.nome}</h3>
                        <p>{alert.condicao} R$ {alert.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="alert-category">Categoria: {alert.categoria || 'Não especificada'}</p>
                        <span className="alert-date">
                          Criado em: {new Date(alert.criadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="alert-actions">
                        <button className="edit-btn" onClick={() => handleEditAlert(alert)}>
                          Editar
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteAlert(alert.id)}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}