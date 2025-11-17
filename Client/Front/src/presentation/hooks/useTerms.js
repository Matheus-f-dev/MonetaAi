import { useState, useEffect } from 'react';

export const useTerms = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('moneta_terms_accepted');
    if (accepted === 'true') {
      setTermsAccepted(true);
    }
  }, []);

  const acceptTerms = () => {
    localStorage.setItem('moneta_terms_accepted', 'true');
    setTermsAccepted(true);
    setShowTermsModal(false);
  };

  const declineTerms = () => {
    localStorage.removeItem('moneta_terms_accepted');
    setTermsAccepted(false);
    setShowTermsModal(false);
    // Redirecionar para página inicial ou mostrar mensagem
    window.location.href = '/';
  };

  const resetTerms = () => {
    localStorage.removeItem('moneta_terms_accepted');
    setTermsAccepted(false);
    setShowTermsModal(true);
  };

  const showTerms = () => {
    setShowTermsModal(true);
  };

  return {
    termsAccepted,
    showTermsModal,
    acceptTerms,
    declineTerms,
    resetTerms,
    showTerms
  };
};