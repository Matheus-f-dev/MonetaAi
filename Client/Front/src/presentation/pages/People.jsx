import { useState, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { usePeople } from '../hooks/usePeople';
import { useToast } from '../hooks/useToast';
import { Sidebar } from '../components/system';
import '../styles/pages/People.css';

export default function People() {
  useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.uid || null;

  const { loading, people, setParticipantPaid } = usePeople(userId);
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const brl = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return people;
    return people.filter(p => p.nome.toLowerCase().includes(term));
  }, [people, search]);

  const totals = useMemo(() => ({
    devido: people.reduce((sum, p) => sum + p.totalDevido, 0),
    pago: people.reduce((sum, p) => sum + p.totalPago, 0)
  }), [people]);

  const handleTogglePaid = async (item) => {
    const result = await setParticipantPaid(item.transactionId, item.participantIndex, !item.pago);
    if (!result.success) {
      addToast(result.message || 'Erro ao atualizar pagamento', 'error');
    }
  };

  return (
    <div className="sys-layout">
      <Sidebar />

      <main className="people-main">
        <div className="people-container">
          <div className="people-page-header">
            <div>
              <h1 className="people-title">Pessoas</h1>
              <p className="people-subtitle">
                {brl(totals.devido)} a receber · {brl(totals.pago)} já recebido em despesas divididas
              </p>
            </div>
          </div>

          <input
            type="text"
            className="people-search"
            placeholder="Buscar pessoa pelo nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading && people.length === 0 ? (
            <div className="people-empty">Carregando...</div>
          ) : people.length === 0 ? (
            <div className="people-empty">
              Nenhuma despesa dividida ainda. Ao lançar um gasto, marque "Dividir com outras pessoas" para começar a rastrear quem te deve.
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="people-empty">Nenhuma pessoa encontrada para "{search}".</div>
          ) : (
            <div className="people-list">
              {filteredPeople.map(person => {
                const isOpen = expanded === person.nome;
                return (
                  <div key={person.nome} className="people-card">
                    <button
                      type="button"
                      className="people-card-header"
                      onClick={() => setExpanded(isOpen ? null : person.nome)}
                    >
                      <div className="people-avatar">{person.nome.charAt(0).toUpperCase()}</div>
                      <div className="people-info">
                        <div className="people-name">{person.nome}</div>
                        <div className="people-meta">{person.itens.length} despesa(s) dividida(s)</div>
                      </div>
                      <div className="people-amounts">
                        {person.totalDevido > 0 && (
                          <span className="people-amount due">{brl(person.totalDevido)} a receber</span>
                        )}
                        {person.totalPago > 0 && (
                          <span className="people-amount paid">{brl(person.totalPago)} recebido</span>
                        )}
                      </div>
                      <span className={`people-chevron ${isOpen ? 'open' : ''}`}>▾</span>
                    </button>

                    {isOpen && (
                      <div className="people-items">
                        {person.itens.map((item, i) => (
                          <div key={i} className="people-item">
                            <div className="people-item-info">
                              <div className="people-item-desc">{item.descricao}</div>
                              <div className="people-item-date">{item.data}</div>
                            </div>
                            <div className="people-item-value">{brl(item.valor)}</div>
                            <button
                              type="button"
                              className={`people-paid-toggle ${item.pago ? 'is-paid' : ''}`}
                              onClick={() => handleTogglePaid(item)}
                            >
                              {item.pago ? '✓ Pago' : 'Marcar como pago'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
