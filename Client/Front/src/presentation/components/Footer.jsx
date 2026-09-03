import React from 'react';
import './Footer.css';

const Footer = () => {
  const handleLegalLink = (route) => {
    window.open(route, '_blank');
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>MonetaAI</h4>
          <p>Gestão financeira inteligente</p>
        </div>
        
        <div className="footer-section">
          <h4>Legal</h4>
          <div className="footer-links">
            <button 
              onClick={() => handleLegalLink('/privacy-policy')}
              className="footer-link"
            >
              Política de Privacidade
            </button>
            <button 
              onClick={() => handleLegalLink('/terms-of-service')}
              className="footer-link"
            >
              Termos de Uso
            </button>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 MonetaAI. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;