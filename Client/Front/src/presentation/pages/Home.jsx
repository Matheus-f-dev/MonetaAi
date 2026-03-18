import '../styles/pages/home.css';
import landingImage from '../../assets/images/landing page.png';
import { useEffect, useRef, useState } from 'react';
import { useSecureNavigation } from '../hooks/useSecureNavigation';

export default function LandingPage() {
  const { secureNavigate } = useSecureNavigation();
  const canvasRef = useRef(null);
  const countRef = useRef(false);
  const [counts, setCounts] = useState({ users: 0, saves: 0, transactions: 0 });

  /* ── Partículas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.35 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d, i) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${d.o})`;
        ctx.fill();
        d.x += d.dx; d.y += d.dy;
        if (d.x < 0 || d.x > canvas.width) d.dx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.dy *= -1;

        dots.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(d.x - b.x, d.y - b.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(139,92,246,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  /* ── Observers ── */
  useEffect(() => {
    /* Reveal */
    const ro = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.r').forEach((el) => ro.observe(el));

    /* Contadores */
    const co = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !countRef.current) {
        countRef.current = true;
        const run = (key, end, ms) => {
          const t0 = performance.now();
          const step = (now) => {
            const p = Math.min((now - t0) / ms, 1);
            const v = Math.floor((1 - Math.pow(1 - p, 3)) * end);
            setCounts((c) => ({ ...c, [key]: v }));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        };
        run('users', 10000, 2000);
        run('saves', 30, 1600);
        run('transactions', 500000, 2200);
      }
    }, { threshold: 0.5 });
    const st = document.querySelector('.stats');
    if (st) co.observe(st);

    /* Header scroll */
    const hdr = document.querySelector('.site-header');
    const onScroll = () => hdr?.classList.toggle('solid', window.scrollY > 60);
    window.addEventListener('scroll', onScroll);

    return () => { ro.disconnect(); co.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  /* ── Tilt 3D ── */
  useEffect(() => {
    const els = document.querySelectorAll('.tilt');
    const handlers = [];
    els.forEach((el) => {
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 16;
        const y = ((e.clientY - r.top) / r.height - 0.5) * -16;
        el.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) scale3d(1.02,1.02,1.02)`;
      };
      const leave = () => { el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'; };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      handlers.push({ el, move, leave });
    });
    return () => handlers.forEach(({ el, move, leave }) => {
      el.removeEventListener('mousemove', move);
      el.removeEventListener('mouseleave', leave);
    });
  }, []);

  return (
    <div className="site">
      <canvas ref={canvasRef} className="canvas" />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HEADER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="site-header">
        <div className="hdr-inner">
          <a className="brand" href="/">
            <div className="brand-mark">M</div>
            <span>Moneta</span>
          </a>

          <nav className="hdr-nav">
            <a href="#features">Funcionalidades</a>
            <a href="#how">Como funciona</a>
            <a href="#pricing">Planos</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="hdr-ctas">
            <button className="ghost-btn" onClick={() => secureNavigate('/login')}>Entrar</button>
            <button className="pill-btn" onClick={() => secureNavigate('/cadastro')}>
              Começar grátis
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="hero">
        {/* Orbes */}
        <span className="orb o1" /><span className="orb o2" /><span className="orb o3" />

        {/* Grid linha de fundo */}
        <div className="hero-grid-bg" />

        <div className="hero-wrap">
          {/* ── Coluna esquerda ── */}
          <div className="hero-copy">
            <div className="eyebrow r">
              <span className="pulse-dot" />
              Plataforma #1 de Gestão Financeira com IA
            </div>

            <h1 className="hero-h1 r">
              Controle total<br />
              do seu dinheiro<br />
              <em>sem esforço.</em>
            </h1>

            <p className="hero-p r">
              A Moneta usa Inteligência Artificial para categorizar gastos,
              prever seu futuro financeiro e te dar liberdade real —
              tudo pelo WhatsApp, em segundos.
            </p>

            <div className="hero-actions r">
              <button className="cta-main" onClick={() => secureNavigate('/cadastro')}>
                Criar conta gratuita
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
              <a className="cta-ghost" href="#how">
                <span className="play-icon">▶</span>
                Ver demo
              </a>
            </div>

            <div className="social-proof r">
              <div className="face-pile">
                {['J','M','A','C','R'].map((l, i) => (
                  <div className="face" key={i} style={{ zIndex: 5 - i, background: ['#7C3AED','#10B981','#F59E0B','#EF4444','#3B82F6'][i] }}>{l}</div>
                ))}
              </div>
              <div className="proof-text">
                <strong>+10.000 pessoas</strong> já transformaram suas finanças
                <div className="stars">{'★'.repeat(5)} <span>4.9 / 5</span></div>
              </div>
            </div>
          </div>

          {/* ── Coluna direita — Dashboard 3D ── */}
          <div className="hero-visual r">
            <div className="dash-scene">
              {/* Card principal */}
              <div className="dash-card tilt">
                <div className="dc-header">
                  <div className="dc-avatar">JS</div>
                  <div>
                    <div className="dc-name">João Silva</div>
                    <div className="dc-sub">Dashboard financeiro</div>
                  </div>
                  <div className="dc-badge live"><span />Ao vivo</div>
                </div>

                <div className="dc-balance">
                  <span className="dc-bal-label">Saldo total</span>
                  <span className="dc-bal-value">R$ 8.450,<small>00</small></span>
                  <span className="dc-bal-change up">↑ +12,4% este mês</span>
                </div>

                <div className="dc-chart">
                  {[30, 55, 40, 70, 50, 85, 65, 90, 72, 95, 80, 100].map((h, i) => (
                    <div className="dc-bar-wrap" key={i}>
                      <div className="dc-bar" style={{ height: `${h}%`, animationDelay: `${i * 0.07}s` }} />
                    </div>
                  ))}
                </div>

                <div className="dc-cats">
                  {[
                    { label: 'Alimentação', pct: 68, color: '#10B981' },
                    { label: 'Transporte', pct: 42, color: '#F59E0B' },
                    { label: 'Lazer', pct: 89, color: '#EF4444' },
                  ].map((c, i) => (
                    <div className="dc-cat" key={i}>
                      <span className="dc-cat-dot" style={{ background: c.color }} />
                      <span className="dc-cat-name">{c.label}</span>
                      <div className="dc-cat-track">
                        <div className="dc-cat-fill" style={{ width: `${c.pct}%`, background: c.color, animationDelay: `${0.5 + i * 0.2}s` }} />
                      </div>
                      <span className="dc-cat-pct" style={{ color: c.color }}>{c.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget notificação */}
              <div className="dash-widget w-notif tilt">
                <div className="dw-icon">🤖</div>
                <div>
                  <div className="dw-title">IA detectou</div>
                  <div className="dw-val violet">3 gastos evitáveis</div>
                </div>
              </div>

              {/* Widget economia */}
              <div className="dash-widget w-save tilt">
                <div className="dw-icon">💰</div>
                <div>
                  <div className="dw-title">Economizado</div>
                  <div className="dw-val green">+R$ 340,00</div>
                </div>
              </div>

              {/* Widget mini gráfico */}
              <div className="dash-widget w-mini tilt">
                <div className="mini-label">Semana</div>
                <div className="mini-bars">
                  {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                    <div className="mini-bar" key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="scroll-cue">
          <div className="scroll-track"><div className="scroll-thumb" /></div>
          <span>Role para baixo</span>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STATS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="stats">
        <div className="stats-inner">
          {[
            { val: counts.users.toLocaleString('pt-BR') + '+', label: 'Usuários ativos', w: '82%' },
            { val: counts.saves + '%', label: 'Economia média mensal', w: '58%' },
            { val: counts.transactions.toLocaleString('pt-BR') + '+', label: 'Transações processadas', w: '94%' },
          ].map((s, i) => (
            <div className="stat r" key={i}>
              <div className="stat-val">{s.val}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-track"><div className="stat-fill" style={{ width: s.w }} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FEATURES
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="features" id="features">
        <div className="sec-head r">
          <div className="tag">⚡ Funcionalidades</div>
          <h2>Tecnologia que trabalha<br /><span className="g">enquanto você vive</span></h2>
          <p>Cada recurso foi desenhado para eliminar esforço e maximizar sua inteligência financeira.</p>
        </div>

        <div className="bento r">
          {/* Card grande — IA */}
          <div className="bc bc-hero tilt">
            <div className="bc-glow" />
            <div className="bc-icon">🤖</div>
            <h3>IA Financeira Preditiva</h3>
            <p>Nossa IA analisa padrões, prevê quando você pode estourar o orçamento e sugere ajustes antes que aconteça. Um consultor financeiro 24h por dia.</p>
            <div className="bc-preview">
              {[
                { l: 'Alimentação', p: 68, c: '#10B981' },
                { l: 'Transporte',  p: 42, c: '#F59E0B' },
                { l: 'Lazer',       p: 91, c: '#EF4444' },
              ].map((row, i) => (
                <div className="pr-row" key={i}>
                  <span className="pr-lbl">{row.l}</span>
                  <div className="pr-track">
                    <div className="pr-fill" style={{ width: `${row.p}%`, background: row.c, animationDelay: `${i * 0.2}s` }} />
                  </div>
                  <span className="pr-pct" style={{ color: row.c }}>{row.p}%{row.p > 85 ? ' ⚠️' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards menores */}
          {[
            { icon: '💬', title: 'WhatsApp Nativo',      desc: 'Registre qualquer gasto em segundos sem sair do WhatsApp.' },
            { icon: '📊', title: 'Relatórios Visuais',   desc: 'Dashboards que transformam números em decisões claras.' },
            { icon: '🔔', title: 'Alertas Inteligentes', desc: 'Notificações antes que seus gastos fujam do controle.' },
            { icon: '🔒', title: 'Segurança Bancária',   desc: 'Criptografia de ponta a ponta. Zero compartilhamento.' },
            { icon: '🎯', title: 'Metas Financeiras',    desc: 'Defina objetivos e a IA traça o caminho até eles.' },
            { icon: '✈️', title: 'Modo Viagem',          desc: 'Conversão automática e controle no exterior.' },
          ].map((f, i) => (
            <div className="bc tilt r" key={i}>
              <div className="bc-glow" />
              <div className="bc-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          COMO FUNCIONA
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="how" id="how">
        <div className="sec-head r">
          <div className="tag">🚀 Como funciona</div>
          <h2>Três passos para a<br /><span className="g">liberdade financeira</span></h2>
        </div>

        <div className="steps">
          <div className="steps-connector" />
          {[
            { n: '01', icon: '📱', title: 'Conecte seu WhatsApp',  desc: 'Em menos de 30 segundos você já está conectado. Sem downloads, sem formulários.', tag: '30 segundos' },
            { n: '02', icon: '💬', title: 'Converse naturalmente',  desc: 'Diga "Gastei R$50 no mercado" e a IA registra, categoriza e analisa automaticamente.', tag: 'Zero esforço' },
            { n: '03', icon: '📈', title: 'Transforme seus hábitos', desc: 'Relatórios semanais, alertas e insights que mudam sua relação com o dinheiro.', tag: 'Resultados reais' },
          ].map((s, i) => (
            <div className="step r" key={i}>
              <div className="step-n">{s.n}</div>
              <div className="step-body tilt">
                <div className="step-ico">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <span className="step-chip">{s.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          WHATSAPP
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="wpp-sec">
        <div className="wpp-wrap">
          {/* Texto */}
          <div className="wpp-copy r">
            <div className="tag">💬 Integração WhatsApp</div>
            <h2>Fale com sua IA<br /><span className="g">pelo WhatsApp</span></h2>
            <p className="wpp-lead">Esqueça planilhas. A Moneta vive onde você já vive. Registre, consulte e receba insights sem sair da conversa.</p>

            <div className="wpp-list">
              {[
                { icon: '⚡', title: 'Registro instantâneo', desc: 'Gasto registrado em menos de 3 segundos.' },
                { icon: '🧠', title: 'IA que aprende',       desc: 'Quanto mais usa, mais precisa fica.' },
                { icon: '📊', title: 'Resumos automáticos',  desc: 'Relatórios semanais no seu WhatsApp.' },
              ].map((f, i) => (
                <div className="wpp-item r" key={i}>
                  <div className="wpp-ico">{f.icon}</div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="cta-main" onClick={() => secureNavigate('/cadastro')}>
              Conectar WhatsApp agora
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Phone mockup */}
          <div className="wpp-phone r">
            <div className="phone tilt">
              <div className="ph-bar" />
              <div className="ph-screen">
                <div className="ph-hdr">
                  <div className="ph-av">M</div>
                  <div>
                    <div className="ph-name">Moneta IA</div>
                    <div className="ph-status"><span className="green-dot" />online</div>
                  </div>
                </div>
                <div className="ph-msgs">
                  {[
                    { t: 'in',  msg: 'Olá! Sou sua assistente financeira. Como posso ajudar? 🤖' },
                    { t: 'out', msg: 'Gastei R$85 no mercado' },
                    { t: 'in',  msg: '✅ R$85 em Alimentação. Você usou 68% do orçamento mensal. Ótimo ritmo!' },
                    { t: 'out', msg: 'Qual meu saldo livre?' },
                    { t: 'in',  msg: '💰 R$ 1.240,00 disponíveis. Reduzindo R$50 em lazer você bate sua meta!' },
                  ].map((m, i) => (
                    <div className={`ph-msg ${m.t}`} key={i} style={{ animationDelay: `${0.3 + i * 0.35}s` }}>
                      {m.msg}
                    </div>
                  ))}
                </div>
                <div className="ph-input">
                  <span>Envie uma mensagem...</span>
                  <button>➤</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PRICING
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="pricing" id="pricing">
        <span className="orb o-p" />
        <div className="sec-head r">
          <div className="tag">💎 Planos</div>
          <h2>Simples e transparente<br /><span className="g">sem surpresas</span></h2>
          <p>Cancele quando quiser. Sem taxas ocultas.</p>
        </div>

        <div className="plans r">
          {/* Starter */}
          <div className="plan tilt">
            <div className="plan-tier">Starter</div>
            <div className="plan-price-wrap">
              <span className="p-cur">R$</span>
              <span className="p-num">0</span>
              <span className="p-per">/mês</span>
            </div>
            <p className="p-sub">Perfeito para começar</p>
            <ul className="p-list">
              {[
                [true,  'ChatBot WhatsApp básico'],
                [true,  'Até 50 transações/mês'],
                [true,  'Relatório mensal'],
                [false, 'IA preditiva avançada'],
                [false, 'Modo viagem'],
                [false, 'Suporte prioritário'],
              ].map(([ok, text], i) => (
                <li key={i} className={ok ? '' : 'off'}>
                  <span className={ok ? 'ck' : 'cx'}>{ok ? '✓' : '✗'}</span>{text}
                </li>
              ))}
            </ul>
            <button className="plan-ghost-btn" onClick={() => secureNavigate('/cadastro')}>Começar grátis</button>
          </div>

          {/* Pro */}
          <div className="plan plan-hot tilt">
            <div className="plan-shine" />
            <div className="plan-top-line" />
            <div className="hot-badge">⭐ Mais popular</div>
            <div className="plan-tier">Pro</div>
            <div className="plan-price-wrap">
              <span className="p-cur">R$</span>
              <span className="p-num g">??</span>
              <span className="p-per">/mês</span>
            </div>
            <p className="p-sub">Para quem leva finanças a sério</p>
            <ul className="p-list">
              {[
                [true,  'ChatBot WhatsApp avançado', false],
                [true,  'Transações ilimitadas',     false],
                [true,  'IA preditiva completa',     false],
                [true,  'Relatórios semanais',       false],
                [true,  'Alertas inteligentes',      false],
                [true,  'Modo viagem',               true],
                [true,  'Suporte prioritário',       true],
              ].map(([ok, text, gold], i) => (
                <li key={i} className={gold ? 'gold' : ''}>
                  <span className={gold ? 'ck-gold' : 'ck'}>{ok ? '✓' : '✗'}</span>{text}
                </li>
              ))}
            </ul>
            <button className="plan-main-btn" onClick={() => secureNavigate('/cadastro')}>Assinar agora →</button>
            <p className="plan-fine">Sem compromisso. Cancele quando quiser.</p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CTA FINAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="cta-sec">
        <span className="orb o-c1" /><span className="orb o-c2" />
        <div className="cta-box r">
          <div className="cta-tag">🚀 Comece hoje</div>
          <h2>Pare de perder dinheiro.<br /><span className="g">Comece a multiplicar.</span></h2>
          <p>Configure em 2 minutos e veja a diferença já no primeiro mês.</p>
          <button className="cta-main cta-xl" onClick={() => secureNavigate('/cadastro')}>
            Criar minha conta grátis
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
          <div className="trust-row">
            {['🔒 Dados criptografados','⚡ Setup em 2 min','🆓 Grátis para sempre','❌ Sem cartão'].map((t, i) => (
              <span className="trust-chip" key={i}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FOOTER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="site-footer" id="faq">
        <div className="ft-inner">
          <div className="ft-brand">
            <div className="brand">
              <div className="brand-mark">M</div>
              <span>Moneta</span>
            </div>
            <p>Inteligência financeira para pessoas reais.</p>
            <div className="ft-socials">
              {['fab fa-instagram','fab fa-twitter','fab fa-linkedin-in','fab fa-youtube'].map((ic, i) => (
                <a key={i} href="#" aria-label={ic}><i className={ic} /></a>
              ))}
            </div>
          </div>

          {[
            { h: 'Produto',  links: ['Funcionalidades','Planos','Segurança','Roadmap'] },
            { h: 'Suporte',  links: ['Central de Ajuda','FAQ','Contato','Status'] },
            { h: 'Empresa',  links: ['Sobre nós','Blog','Carreiras','Imprensa'] },
          ].map((col, i) => (
            <div className="ft-col" key={i}>
              <h4>{col.h}</h4>
              <ul>{col.links.map((l, j) => <li key={j}><a href="#">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>

        <div className="ft-bottom">
          <span>© 2026 Moneta. Todos os direitos reservados.</span>
          <div className="ft-legal">
            <button className="ft-link" onClick={() => secureNavigate('/terms-of-service')}>Termos de Uso</button>
            <button className="ft-link" onClick={() => secureNavigate('/privacy-policy')}>Política de Privacidade</button>
          </div>
        </div>
      </footer>
    </div>
  );
}