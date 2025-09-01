import { useState, useEffect } from 'react';

export function ActivityHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.uid || 'default-user';
        
        const response = await fetch(`http://localhost:3000/api/transactions/${userId}`);
        const data = await response.json();
        
        if (data.success) {
          const processedTransactions = data.transactions
            .map(transaction => {
              const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
              let processedDate = dateField;
              
              if (dateField && typeof dateField === 'string' && dateField.includes('/')) {
                const [datePart] = dateField.split(', ');
                const [day, month, year] = datePart.split('/');
                processedDate = new Date(year, month - 1, day);
              }
              
              return {
                id: transaction.id || Math.random(),
                date: processedDate,
                description: transaction.descricao || 'Sem descrição',
                category: transaction.categoria || 'Outros',
                value: transaction.valor || 0,
                type: (transaction.tipo || 'despesa').toLowerCase()
              };
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordenar por data mais recente
          
          setTransactions(processedTransactions);
        }
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);

  if (loading) {
    return <div className="activity-loading">Carregando histórico...</div>;
  }

  return (
    <div className="activity-history">
      <div className="activity-header">
        <h2>Histórico de Atividades</h2>
        <p>Todas as suas transações (receitas e despesas)</p>
      </div>

      <div className="activity-list">
        {transactions.length > 0 ? (
          transactions.map(transaction => (
            <div key={transaction.id} className={`activity-item ${transaction.type}`}>
              <div className="activity-info">
                <div className="activity-description">{transaction.description}</div>
                <div className="activity-meta">
                  <span className="activity-category">{transaction.category}</span>
                  <span className="activity-date">
                    {(() => {
                      try {
                        const date = new Date(transaction.date);
                        return isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');
                      } catch {
                        return 'Data inválida';
                      }
                    })()}
                  </span>
                </div>
              </div>
              <div className={`activity-value ${transaction.type}`}>
                {transaction.type === 'receita' ? 
                  `+R$ ${Math.abs(transaction.value).toFixed(2)}` : 
                  `-R$ ${Math.abs(transaction.value).toFixed(2)}`
                }
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            Nenhuma atividade encontrada.
          </div>
        )}
      </div>
    </div>
  );
}