import { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/components/ObserverLog.css';

export function ObserverLog() {
  const [activityLog, setActivityLog] = useState([]);
  const [categorySpending, setCategorySpending] = useState({});
  const { applyTheme } = useTheme();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedColorScheme = localStorage.getItem('colorScheme') || 'purple';
    const savedFont = localStorage.getItem('font') || 'Roboto';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    
    applyTheme(savedTheme, savedColorScheme, savedFont, savedFontSize);
  }, [applyTheme]);

  useEffect(() => {
    // Carregar logs do Observer
    const loadLogs = () => {
      const logs = JSON.parse(localStorage.getItem('activityLog') || '[]');
      const spending = JSON.parse(localStorage.getItem('categorySpending') || '{}');
      
      setActivityLog(logs);
      setCategorySpending(spending);
    };

    loadLogs();

    // Atualizar a cada 2 segundos para capturar novos logs
    const interval = setInterval(loadLogs, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const clearLogs = () => {
    localStorage.removeItem('activityLog');
    localStorage.removeItem('categorySpending');
    setActivityLog([]);
    setCategorySpending({});
  };

  const savedTheme = localStorage.getItem('theme') || 'light';
  const savedColorScheme = localStorage.getItem('colorScheme') || 'purple';
  const savedFont = localStorage.getItem('font') || 'Roboto';
  const savedFontSize = localStorage.getItem('fontSize') || 'medium';

  return (
    <div 
      className="observer-log"
      data-theme={savedTheme}
      data-color-scheme={savedColorScheme}
      data-font={savedFont}
      data-font-size={savedFontSize}
    >
      <div className="observer-header">
        <h3> Logs de Atividade</h3>
        <button onClick={clearLogs} className="clear-btn">
          Limpar Logs
        </button>
      </div>

      <div className="observer-content">
        {/* Gastos por Categoria */}
        <div className="category-spending">
          <h4>💰 Gastos por Categoria (Mês Atual)</h4>
          {Object.keys(categorySpending).length > 0 ? (
            <div className="spending-list">
              {Object.entries(categorySpending).map(([categoria, valor]) => (
                <div key={categoria} className="spending-item">
                  <span className="category-name">{categoria}</span>
                  <span className={`category-value ${valor > 1000 ? 'high-spending' : ''}`}>
                    R$ {valor.toFixed(2)}
                    {valor > 1000 && <span className="warning"> ⚠️</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Nenhum gasto registrado ainda</p>
          )}
        </div>

        {/* Log de Atividades */}
        <div className="activity-log">
          <h4>📝 Histórico de Atividades</h4>
          {activityLog.length > 0 ? (
            <div className="log-list">
              {activityLog.slice(0, 10).map((log) => (
                <div key={log.id} className="log-item">
                  <div className="log-timestamp">{log.timestamp}</div>
                  <div className="log-action">{log.action}</div>
                  <div className="log-description">{log.description}</div>
                  <div className="log-category">{log.category}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Nenhuma atividade registrada ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}