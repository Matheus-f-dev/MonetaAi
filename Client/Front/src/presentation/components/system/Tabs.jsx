export function Tabs({ activeTab, onTabChange }) {
  return (
    <div className="sys-tabs">
      <button 
        className={`sys-tab ${activeTab === 'overview' ? 'sys-tab-active' : ''}`}
        onClick={() => onTabChange('overview')}
      >
        Visão Geral
      </button>
      <button 
        className={`sys-tab ${activeTab === 'future' ? 'sys-tab-active' : ''}`}
        onClick={() => onTabChange('future')}
      >
        Saldo Futuro
      </button>
      <button 
        className={`sys-tab ${activeTab === 'activities' ? 'sys-tab-active' : ''}`}
        onClick={() => onTabChange('activities')}
      >
        Atividades
      </button>
    </div>
  );
}