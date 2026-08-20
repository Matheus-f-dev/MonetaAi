import '../styles/pages/home.css';
import { useEffect } from 'react';
import { useSecureNavigation } from '../hooks/useSecureNavigation';
import CoinScene from '../components/CoinScene';
import {
  BagIcon, WalletIcon, CardIcon, RepeatIcon, PeopleIcon, ChartIcon, BellIcon, BotIcon
} from '../components/system/Icons';

const LEDGER_ROWS = [
  { data: '03/03', desc: 'mercado', cat: 'alimentação', valor: '42,90' },
  { data: '03/03', desc: 'uber', cat: '', valor: '18,50' },
  { data: '04/03', desc: 'netflix', cat: 'lazer', valor: '#REF!', broken: true },
  { data: '05/03', desc: 'almoço', cat: 'alimentação', valor: '=D4+D2', broken: true },
  { data: '—', desc: '—', cat: '', valor: '' },
];

const FEATURES = [
  { Icon: CardIcon, title: 'Cartões', desc: 'Fatura, limite e parcelamento calculados sozinhos — compra em 10x já vira 10 lançamentos, um por mês.' },
  { Icon: RepeatIcon, title: 'Gastos fixos', desc: 'Aluguel, streaming, academia: cadastra uma vez, o sistema avisa quando vence e lança com um clique.' },
  { Icon: WalletIcon, title: 'Contas e carteiras', desc: 'Corrente, poupança, carteira física — cada real tem endereço, e o saldo consolidado é sempre real.' },
  { Icon: PeopleIcon, title: 'Divisão com pessoas', desc: 'Rachou a pizza em 6? Divide o valor, marca quem já te pagou e para de fazer conta de cabeça.' },
  { Icon: BellIcon, title: 'Alertas por categoria', desc: 'Defina um limite de gasto e receba aviso antes de estourar — não depois.' },
  { Icon: ChartIcon, title: 'Análises e projeção', desc: 'Tendência, sazonalidade e previsão de saldo futuro, calculados a partir do seu histórico real.' },
];

const STEPS = [
  { n: '01', title: 'Registre onde já está', desc: 'Pelo WhatsApp — texto, foto do comprovante ou áudio — ou direto pelo site.' },
  { n: '02', title: 'A categoria se resolve sozinha', desc: 'A Moneta AI lê a mensagem, identifica a categoria e organiza o lançamento.' },
  { n: '03', title: 'O painel fica sempre atual', desc: 'Sem fórmula pra arrastar, sem coluna pra corrigir. O saldo já está certo quando você abre.' },
];

const TRUST_POINTS = [
  { q: 'Acesso aos dados', h: 'Cada conta é uma ilha', p: 'Seu histórico fica isolado por usuário no banco — ninguém, nem outro usuário, enxerga o extrato de ninguém.' },
  { q: 'Integração', h: 'Um motor só, três portas', p: 'Site, WhatsApp e e-mail conversam com a mesma lógica de negócio por trás — não é gambiarra separada por canal.' },
  { q: 'Controle de acesso', h: 'Sessão com validade', p: 'Login gera um token que expira. Sem token válido, sem rota protegida — nem digitando a URL na mão.' },
  { q: 'Auditoria', h: 'Toda transferência deixa rastro', p: 'Mover dinheiro entre contas grava quem, quando, de onde pra onde e quanto — não é só um número que muda.' },
  { q: 'Falha', h: 'Reenviar não duplica', p: 'Se a internet cair no meio de uma transferência e você reenviar, o sistema reconhece e ignora — nunca lança duas vezes.' },
  { q: 'Segurança', h: 'Senha nunca em texto puro', p: 'Autenticação passa pelo Firebase Auth — a Moneta nunca guarda sua senha, só um hash que nem ela consegue reverter.' },
];

const FAQS = [
  { q: 'É de graça mesmo?', a: 'Sim. Sem plano pago, sem cartão de crédito pra cadastrar, sem limite de lançamentos.' },
  { q: 'Preciso instalar algo?', a: 'Não. O WhatsApp você já tem instalado. Pelo navegador, é só criar a conta.' },
  { q: 'Funciona sem WhatsApp?', a: 'Funciona — todo lançamento, cartão, conta e relatório também está disponível direto pelo site.' },
  { q: 'Dá pra importar minha planilha atual?', a: 'Essa é a próxima peça que estamos construindo. Por enquanto, o histórico começa do zero com você.' },
];

export default function LandingPage() {
  const { secureNavigate } = useSecureNavigation();

  useEffect(() => {
    const ro = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.r').forEach((el) => ro.observe(el));

    const hdr = document.querySelector('.site-header');
    const onScroll = () => hdr?.classList.toggle('solid', window.scrollY > 60);
    window.addEventListener('scroll', onScroll);

    return () => { ro.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <div className="site">
      {/* ═══ HEADER ═══ */}
      <header className="site-header">
        <div className="hdr-inner">
          <a className="brand" href="/">
            <span className="brand-mark">M</span>
            <span>Moneta</span>
          </a>

          <nav className="hdr-nav">
            <a href="#features">Funcionalidades</a>
            <a href="#how">Como funciona</a>
            <a href="#faq">Perguntas</a>
          </nav>

          <div className="hdr-ctas">
            <button className="ghost-btn" onClick={() => secureNavigate('/login')}>Entrar</button>
            <button className="pill-btn" onClick={() => secureNavigate('/cadastro')}>Criar conta grátis</button>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <CoinScene />
        <div className="hero-wrap">
          <div className="hero-copy">
            <div className="eyebrow r">Substitui sua planilha financeira</div>

            <h1 className="hero-h1 r">
              A última linha que você<br />vai digitar numa <span className="strike">planilha</span>.
            </h1>

            <p className="hero-p r">
              A Moneta registra o gasto quando você manda uma mensagem no WhatsApp — categoriza
              sozinha, calcula o saldo por conta e por cartão, e não deixa fórmula quebrar.
            </p>

            <div className="hero-actions r">
              <button className="cta-main" onClick={() => secureNavigate('/cadastro')}>
                Criar conta grátis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
              <a className="cta-ghost" href="#how">Ver como funciona</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ANTES/DEPOIS — assinatura da página ═══ */}
      <section className="transform-sec">
        <div className="transform-demo r">
          <div className="td-panel td-before">
            <span className="td-label">a planilha</span>
            <div className="ledger">
              <div className="ledger-row ledger-head">
                <span>data</span><span>descrição</span><span>cat</span><span>valor</span>
              </div>
              {LEDGER_ROWS.map((row, i) => (
                <div className="ledger-row" key={i}>
                  <span>{row.data}</span>
                  <span>{row.desc}</span>
                  <span className={!row.cat ? 'empty' : ''}>{row.cat || '—'}</span>
                  <span className={row.broken ? 'broken' : ''}>{row.valor || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="td-arrow">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M13 5l7 7-7 7" /></svg>
          </div>

          <div className="td-panel td-after">
            <span className="td-label">a moneta</span>
            <div className="chat-demo">
              <div className="bubble out">Gastei 42,90 no mercado</div>
              <div className="bubble in">
                Beleza! Registrei em <b>Alimentação</b>, saiu da Conta Principal.
                <span className="bubble-tag">Alimentação · R$ 42,90</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROVA HONESTA ═══ */}
      <section className="proof">
        <div className="proof-inner r">
          <div className="proof-item"><span className="proof-num">9</span><span className="proof-label">áreas do produto</span></div>
          <div className="proof-item"><span className="proof-num">50+</span><span className="proof-label">funcionalidades reais</span></div>
          <div className="proof-item"><span className="proof-num">3</span><span className="proof-label">canais — WhatsApp, site e e-mail</span></div>
          <div className="proof-item"><span className="proof-num">R$ 0</span><span className="proof-label">custo pra usar</span></div>
        </div>
      </section>

      {/* ═══ FUNCIONALIDADES ═══ */}
      <section className="features" id="features">
        <div className="sec-head r">
          <div className="tag">Funcionalidades</div>
          <h2>Cada coisa que sua planilha<br />fazia mal, feita direito</h2>
        </div>

        <div className="feat-grid r">
          {FEATURES.map((f, i) => (
            <div className="feat-card" key={i}>
              <div className="feat-ico"><f.Icon /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ COMO FUNCIONA ═══ */}
      <section className="how" id="how">
        <div className="sec-head r">
          <div className="tag">Como funciona</div>
          <h2>Três passos, nenhuma fórmula</h2>
        </div>

        <div className="steps r">
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ RIGOR / CONFIANÇA ═══ */}
      <section className="trust-sec">
        <div className="trust-inner">
          <div className="trust-head r">
            <div className="tag">Por baixo do capô</div>
            <h2>Prova de conceito é fácil. Isso aqui foi feito pra aguentar uso real.</h2>
            <p>
              Todo produto financeiro tem que responder as mesmas perguntas chatas antes de
              qualquer coisa bonita: de onde vêm os dados, quem pode acessar, o que fica registrado
              e o que acontece quando algo falha. Aqui está o que a Moneta responde hoje.
            </p>
          </div>

          <div className="trust-grid r">
            {TRUST_POINTS.map((t, i) => (
              <div className="trust-item" key={i}>
                <span className="trust-q">{t.q}</span>
                <h4>{t.h}</h4>
                <p>{t.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHATSAPP ═══ */}
      <section className="wpp-sec">
        <div className="wpp-wrap">
          <div className="wpp-copy r">
            <div className="tag">Integração WhatsApp</div>
            <h2>A Moneta vive onde<br />você já vive</h2>
            <p className="wpp-lead">
              Manda texto, foto do comprovante ou um áudio contando o que gastou.
              A Moneta AI lê, categoriza e responde — sem abrir outro app.
            </p>

            <div className="wpp-list">
              <div className="wpp-item"><BotIcon /><div><h4>Entende linguagem natural</h4><p>"Gastei 40 no mercado" já vira lançamento certo.</p></div></div>
              <div className="wpp-item"><CardIcon /><div><h4>Lê foto de comprovante</h4><p>Manda a nota fiscal, ela extrai o valor sozinha.</p></div></div>
              <div className="wpp-item"><ChartIcon /><div><h4>Manda relatório no chat</h4><p>Pede um resumo do mês e recebe o gráfico ali mesmo.</p></div></div>
            </div>

            <button className="cta-main" onClick={() => secureNavigate('/cadastro')}>Conectar WhatsApp agora</button>
          </div>

          <div className="wpp-phone r">
            <div className="phone">
              <div className="ph-bar" />
              <div className="ph-screen">
                <div className="ph-hdr">
                  <div className="ph-av">M</div>
                  <div>
                    <div className="ph-name">Moneta AI</div>
                    <div className="ph-status"><span className="green-dot" />online</div>
                  </div>
                </div>
                <div className="ph-msgs">
                  <div className="ph-msg in">Oi! Sou a Moneta. Me conta o que você gastou.</div>
                  <div className="ph-msg out">Gastei R$85 no mercado</div>
                  <div className="ph-msg in">Registrado em Alimentação. Você já usou 68% do que costuma gastar nessa categoria esse mês.</div>
                  <div className="ph-msg out">Qual meu saldo na conta corrente?</div>
                  <div className="ph-msg in">R$ 1.240,00 disponíveis, considerando o boleto que vence sexta.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="faq-sec" id="faq">
        <div className="sec-head r">
          <div className="tag">Perguntas</div>
          <h2>Antes de você perguntar</h2>
        </div>
        <div className="faq-list r">
          {FAQS.map((f, i) => (
            <details className="faq-item" key={i}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="cta-sec">
        <div className="cta-box r">
          <h2>Sua próxima planilha<br />é a última que você não vai abrir.</h2>
          <p>Cria a conta em menos de 2 minutos. Sem cartão, sem cobrança escondida.</p>
          <button className="cta-main cta-xl" onClick={() => secureNavigate('/cadastro')}>
            Criar minha conta grátis
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="site-footer">
        <div className="ft-inner">
          <div className="ft-brand">
            <div className="brand"><span className="brand-mark">M</span><span>Moneta</span></div>
            <p>Controle financeiro pessoal, sem planilha.</p>
          </div>
          <div className="ft-legal">
            <button className="ft-link" onClick={() => secureNavigate('/terms-of-service')}>Termos de Uso</button>
            <button className="ft-link" onClick={() => secureNavigate('/privacy-policy')}>Política de Privacidade</button>
          </div>
        </div>
        <div className="ft-bottom">© 2026 Moneta. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}
