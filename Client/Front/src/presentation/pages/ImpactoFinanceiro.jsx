import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useImpactoFinanceiro } from '../hooks/useImpactoFinanceiro';
import { Sidebar } from '../components/system';
import ProjecaoEconomiaChart from '../components/ProjecaoEconomiaChart';
import '../styles/pages/ImpactoFinanceiro.css';

export default function ImpactoFinanceiro() {
  useTheme();
  
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');
  const { loading, analise, error, calcularImpacto, limparAnalise } = useImpactoFinanceiro();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!produto.trim() || !valor.trim()) {
      return;
    }

    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      return;
    }

    calcularImpacto(produto.trim(), valorNum);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getRecomendacaoClass = (tipo) => {
    switch (tipo) {
      case 'alerta': return 'recomendacao-alerta';
      case 'cuidado': return 'recomendacao-cuidado';
      case 'atencao': return 'recomendacao-atencao';
      case 'positivo': return 'recomendacao-positivo';
      default: return 'recomendacao-dica';
    }
  };

  return (
    <div className="sys-layout">
      <Sidebar />
      
      <main className="impacto-main">
        <div className="impacto-container">
          <h1 className="impacto-title">Análise de Impacto Financeiro</h1>
          <p className="impacto-subtitle">
            Descubra o impacto de uma compra no seu orçamento
          </p>

          <div className="impacto-form-card">
            <form onSubmit={handleSubmit} className="impacto-form">
              <div className="form-group">
                <label htmlFor="produto">Produto/Serviço</label>
                <input
                  id="produto"
                  type="text"
                  placeholder="Ex: iPhone 15, Viagem para Europa..."
                  value={produto}
                  onChange={(e) => setProduto(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="valor">Valor (R$)</label>
                <input
                  id="valor"
                  type="text"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="analisar-btn"
                  disabled={loading || !produto.trim() || !valor.trim()}
                >
                  {loading ? 'Analisando...' : 'Analisar Impacto'}
                </button>
                
                {analise && (
                  <button 
                    type="button" 
                    className="limpar-btn"
                    onClick={limparAnalise}
                  >
                    Nova Análise
                  </button>
                )}
              </div>
            </form>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>

          {analise && (
            <div className="analise-resultado">
              <div className="resultado-header">
                <h2>Análise: {analise.produto}</h2>
                <span className="valor-produto">{formatarMoeda(analise.valor)}</span>
              </div>

              <div className="metricas-grid">
                <div className="metrica-card tempo">
                  <div className="metrica-icone">📅</div>
                  <div className="metrica-label">Tempo Necessário</div>
                  <div className="metrica-valor-principal">
                    {analise.analise.tempoParaJuntar || 0}
                  </div>
                  <div className="metrica-sublabel">mês para economizar</div>
                </div>

                <div className="metrica-card impacto">
                  <div className="metrica-icone">📈</div>
                  <div className="metrica-label">Impacto no Orçamento</div>
                  <div className="metrica-valor-principal">
                    {Math.round((analise.valor / analise.analise.receitaMedia) * 100)}%
                  </div>
                  <div className="metrica-sublabel">da sua renda mensal</div>
                </div>

                <div className="metrica-card parcelas">
                  <div className="metrica-icone">ℹ️</div>
                  <div className="metrica-label">Parcelas Sugeridas</div>
                  <div className="metrica-valor-principal">
                    {Math.ceil(analise.valor / analise.analise.economiaMedia)}x
                  </div>
                  <div className="metrica-sublabel">de {formatarMoeda(Math.ceil(analise.valor / Math.ceil(analise.valor / analise.analise.economiaMedia)))}</div>
                </div>
              </div>

              <div className="recomendacoes">
                <h3>Recomendações</h3>
                <div className="recomendacoes-lista">
                  {analise.recomendacoes.map((rec, index) => (
                    <div key={index} className={`recomendacao ${getRecomendacaoClass(rec.tipo)}`}>
                      <span className="recomendacao-texto">{rec.mensagem}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {analise && (
            <ProjecaoEconomiaChart analise={analise} />
          )}
        </div>
      </main>
    </div>
  );
}