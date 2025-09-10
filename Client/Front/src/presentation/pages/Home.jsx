//import '../../../src/App.css'; 
import '../styles/pages/home.css'; // ajuste se necessário
import landingImage from '../../assets/images/landing page.png'; // ajuste o nome conforme seu arquivo
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.feature-card, .texto-esquerda, .mockup, .card, .conteudo');
    animateElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <header className="fade-in header-container">
        <div className="logo">Moneta</div>

        <nav> 
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#planos">Planos</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="actions">
          <Link to="/login" className="btn btn-outline">Entrar</Link>
          <Link to="/cadastro" className="btn btn-primary">Cadastrar</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="badge">✨ Gestão Financeira com IA</span>
          <h1>
            Transforme sua relação com o dinheiro.<br />
            <span className="gradient-text">Conquiste sua liberdade financeira.</span>
          </h1>
          <p className="subtitle">
            Mais de <strong>10.000 usuários</strong> já descobriram como economizar até <strong>30% mais</strong> usando nossa IA que aprende seus hábitos e otimiza seus gastos automaticamente.
          </p>
          <div className="hero-buttons">
            <a href="/cadastro" className="btn-primary">🚀 Começar Grátis Agora</a>
            <a href="#funcionalidades" className="btn-outline">📊 Ver Como Funciona</a>
          </div>
          <div className="trust-indicators">
            <div className="indicator">⭐ 4.9/5 - Mais de 2.500 avaliações</div>
            <div className="indicator">🔒 Dados protegidos com criptografia bancária</div>
            <div className="indicator">📱 Integração WhatsApp em 30 segundos</div>
          </div>
        </div>
        <div className="hero-image-container">
          <img src={landingImage} alt="Mockup Moneta Card" className="hero-image" />
        </div>
      </section>

      <section className="features" id="funcionalidades">
        <div className="features-header">
          <span className="badge">🎯 Resultados Comprovados</span>
          <h2>Por que mais de 10.000 pessoas escolheram a <span className="gradient-text">Moneta?</span></h2>
          <p>
            Nossa IA analisa seus padrões de gastos e identifica oportunidades de economia que você nem sabia que existiam.<br />
            <strong>Resultado médio: R$ 847 economizados por mês.</strong>
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="icon">💬</div>
            <h3>ChatBot no WhatsApp</h3>
            <p>Registre gastos e receba insights diretamente pelo WhatsApp. Simples, rápido e sem complicações.</p>
          </div>
          <div className="feature-card">
            <div className="icon">📊</div>
            <h3>Modo viagem</h3>
            <p>Integre suas viagens e tenha o total controle sobre seus gastos.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🗂️</div>
            <h3>Categorização Automática</h3>
            <p>Nossa IA identifica e categoriza automaticamente suas transações, economizando seu tempo e mantendo tudo organizado.</p>
          </div>
          <div className="feature-card">
            <div className="icon">📈</div>
            <h3>Relatórios Personalizados</h3>
            <p>Visualize relatórios detalhados de gastos, metas e evolução financeira com gráficos interativos.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🔔</div>
            <h3>Alertas Inteligentes</h3>
            <p>Receba alertas automáticos sobre vencimentos, gastos excessivos e oportunidades de economia.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🔒</div>
            <h3>Segurança Avançada</h3>
            <p>Todos os dados são criptografados com protocolos de segurança bancária para proteger sua privacidade.</p>
          </div>
        </div>
      </section>

      <section className="whatsapp-financas">
        <div className="texto-esquerda">
          <span className="tag">ChatBot Intuitivo</span>
          <h1>Gerencie suas finanças pelo <span className="whatsapp">WhatsApp</span></h1>
          <p className="descricao">
            Sem apps complicados. A Moneta integra-se ao WhatsApp para que você possa controlar
            seus gastos e receber insights diretamente onde já está acostumado a conversar.
          </p>
          <div className="beneficios">
            <div className="item">
              <div className="icon-box">💬</div>
              <div>
                <h3>Envie mensagens simples</h3>
                <p>Apenas envie "Gastei R$25 com café" e a Moneta cuida do resto.</p>
              </div>
            </div>
            <div className="item">
              <div className="icon-box">📋</div>
              <div>
                <h3>Categoriação automática</h3>
                <p>A IA detecta e categoriza seus gastos sem que você precise fazer nada.</p>
              </div>
            </div>
            <div className="item">
              <div className="icon-box">📊</div>
              <div>
                <h3>Relatórios e insights</h3>
                <p>Receba resumos semanais e dicas personalizadas para economizar.</p>
              </div>
            </div>
          </div>
          <button className="botao-acao">Comece a usar agora</button>
        </div>
        <div className="mockup">
          <div className="notch"></div>
          <div className="chat-header">
            <div className="avatar">M</div>
            <div className="info">
              <div className="name">Moneta Assistente</div>
              <div className="status">online</div>
            </div>
          </div>
          <div className="messages">
            <div className="msg recebido">Olá! Eu sou o assistente da Moneta. Como posso ajudar?</div>
            <div className="msg enviado">Gastei R$25 com café hoje</div>
            <div className="msg recebido">Registrado! Adicionei R$25 na categoria "Alimentação: Café" para hoje.</div>
            <div className="msg recebido">Este mês você já gastou R$125 em cafés, que é 25% acima do seu orçamento mensal para esta categoria.</div>
            <div className="msg enviado">Quanto gastei com alimentação este mês?</div>
            <div className="msg recebido">Você gastou R$750 com alimentação este mês. Aqui está o detalhamento:</div>
          </div>
        </div>
      </section>

      <section className="plano-moneta" id="planos">
        <div id="particles-js"></div>
        <div className="bolha"></div>
        <div className="bolha bolha2"></div>
        <div className="conteudo-plano"></div>
        <span className="tag">Oferta Especial</span>
        <h2 className="titulo">Moneta Total</h2>
        <p className="subtitulo">Todos os recursos premium em um único plano acessível.</p>

        <div className="card">
          <div className="icone-plano efeito-icone">
            <img src="https://img.icons8.com/ios-filled/50/25d366/wallet.png" alt="ícone carteira" />
          </div>
          <div className="preco">
            R$ ?? <span>/mês</span>
          </div>
          <ul className="beneficios">
            <li><span>✅</span> ChatBot WhatsApp avançado</li>
            <li><span>✅</span> Categorização automática</li>
            <li className="destaque azul"><span>🌐</span> Modo viagem ✨</li>
            <li><span>✅</span> Relatórios semanais detalhados</li>
            <li><span>✅</span> Planejamento de orçamento</li>
            <li className="destaque roxo"><span>🛡️</span> seu controle em multi-lugares✨</li>
          </ul>
          <button className="botao-assinar animar-botao">Assinar Agora</button>
          <p className="observacao">* Sem taxas ocultas. Cancele quando quiser.</p>
        </div>
      </section>

      <section className="secao-moneta">
        <div id="fundo-particulas"></div>
        <div className="conteudo">
          <h1>Pronto para transformar sua relação com o dinheiro?</h1>
          <p>
            Junte-se a milhares de pessoas que já tomaram controle de suas finanças com a Moneta.
            Comece gratuitamente em menos de 2 minutos!
          </p>
          <div className="chamada-acao">
            <button className="botao-principal">Começar agora mesmo</button>
          </div>
          <div className="beneficios">
            <div className="beneficio"><span>⭐</span> Avaliação 4.9/5</div>
            <div className="beneficio"><span>🔒</span> Dados protegidos</div>
            <div className="beneficio"><span>🚀</span> Configuração rápida</div>
          </div>
        </div>
      </section>

      <footer className="footer" id="faq">
        <div className="footer-container">
          <div className="footer-section">
            <h2>Moneta</h2>
            <p>Seu dinheiro no controle, sua vida no comando.</p>
            <div className="social-icons">
              <a href="#"><i className="fab fa-facebook-f"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          <div className="footer-section">
            <h3>Produto</h3>
            <ul>
              <li><a href="#">Funcionalidades</a></li>
              <li><a href="#">Planos</a></li>
              <li><a href="#">Segurança</a></li>
              <li><a href="#">Roadmap</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Suporte</h3>
            <ul>
              <li><a href="#">Central de Ajuda</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Contato</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Empresa</h3>
            <ul>
              <li><a href="#">Sobre nós</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Carreiras</a></li>
              <li><a href="#">Imprensa</a></li>
            </ul>
          </div>
        </div>
        <hr />
        <div className="footer-bottom">
          <span>© 2025 Moneta. Todos os direitos reservados.</span>
          <div className="footer-links">
            <a href="#">Termos de Uso</a>
            <a href="#">Política de Privacidade</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}