import React, { useState } from 'react';
import './TermsModal.css';

const TermsModal = ({ isOpen, onAccept, onDecline }) => {
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolled(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="terms-modal-overlay">
      <div className="terms-modal">
        <div className="terms-header">
          <h2>Termos de Uso - MonetaAi</h2>
          <p>Leia e aceite os termos para continuar</p>
        </div>
        
        <div className="terms-content" onScroll={handleScroll}>
          <div className="terms-text">
            <p>
              Este Termo de Uso ("Termo") é um acordo legal entre você, o(a) usuário(a) do sistema "MonetaAi", e os desenvolvedores do Projeto "MonetaAi" (doravante denominado "MonetaAi" ou "Nós"), um sistema pensado para gestão financeira pessoal com foco em acessibilidade, automação e integração via inteligência artificial, permitindo controle de receitas e despesas através de interface web e chatbot WhatsApp com recursos de reconhecimento de voz e imagem.
            </p>
            <p>
              Ao acessar ou utilizar o "MonetaAi", você manifesta sua concordância integral com este Termo de Uso, com a Política de Privacidade e com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018). Se você não concordar com estes termos, não deverá utilizar o sistema.
            </p>

            <h3>CLÁUSULA PRIMEIRA – DAS CONDIÇÕES GERAIS DE USO</h3>
            <p>
              O "MonetaAi" é destinado a efetuar a gestão financeira pessoal com foco em acessibilidade, automação e integração via inteligência artificial, permitindo controle de receitas e despesas através de interface web e chatbot WhatsApp com recursos de reconhecimento de voz e imagem.
            </p>

            <h3>CLÁUSULA SEGUNDA – DA COLETA E USO DE DADOS PESSOAIS</h3>
            <p>
              O usuário declara estar ciente da coleta e uso dos seguintes dados pelo "MonetaAi", que visam exclusivamente proporcionar gestão financeira pessoal automatizada e inteligente:
            </p>
            <ul>
              <li>Nome completo - para personalização da interface e identificação do usuário no sistema</li>
              <li>E-mail - para autenticação, login e recuperação de senha da conta</li>
              <li>Senha criptografada - para garantir segurança de acesso aos dados financeiros pessoais</li>
              <li>Média salarial - para cálculo de orçamentos personalizados e previsões de saldo futuro</li>
              <li>Transações (receitas e despesas) - para controle financeiro, geração de relatórios, gráficos e categorização automática de gastos</li>
              <li>Mensagens de voz - para registro automático de gastos via inteligência artificial e consultas de saldo pelo chatbot WhatsApp</li>
              <li>Fotos de comprovantes - para detecção automática de valores e estabelecimentos através de reconhecimento de texto (OCR) e registro facilitado de transações</li>
            </ul>

            <h3>CLÁUSULA QUARTA – VEDAÇÕES DO USO</h3>
            <p>
              O usuário compromete-se a não utilizar o "MonetaAi" para qualquer finalidade ilícita ou que viole este Termo de Uso, incluindo:
            </p>
            <ul>
              <li>Carregar conteúdo ilegal, difamatório, obsceno ou prejudicial.</li>
              <li>Acessar, alterar ou danificar contas de outros usuários.</li>
              <li>Violar direitos de propriedade intelectual ou outros direitos de terceiros.</li>
            </ul>

            <h3>CLÁUSULA SEXTA – DA PROTEÇÃO DOS DADOS</h3>
            <p>
              O "MonetaAi" compromete-se a adotar medidas técnicas e administrativas em conformidade com a LGPD e normas ISO/IEC 27001, 27701 e 29100:
            </p>
            <ul>
              <li>Criptografia dos arquivos armazenados.</li>
              <li>Banco de dados seguro, com autenticação robusta e acesso restrito.</li>
              <li>Políticas de segurança da informação e plano de resposta a incidentes.</li>
            </ul>

            <h3>CLÁUSULA OITAVA – DOS DIREITOS DO TITULAR DOS DADOS</h3>
            <p>
              Em conformidade com a LGPD, o sistema deve permitir ao usuário exercer seus direitos, incluindo:
            </p>
            <ul>
              <li>Exclusão da conta e dos arquivos.</li>
              <li>Revogação do consentimento a qualquer momento.</li>
              <li>Solicitação de informações sobre o uso de seus dados.</li>
            </ul>
            <p>
              Canal de contato: gpmonetaai@gmail.com.
            </p>

            <h3>CLÁUSULA NONA – DA IDENTIFICAÇÃO DO RESPONSÁVEL PELO TRATAMENTO DOS DADOS</h3>
            <p>
              O Projeto "MonetaAi" é responsável pelo tratamento dos dados e indicará formalmente o Encarregado de Dados (DPO):
            </p>
            <p>
              Matheus Freire Anacleto – Ceo – xxx.xxx.xxx-xx.
            </p>

            <h3>CLÁUSULA DÉCIMA SEGUNDA – DO TRATAMENTO DE DADOS DE CRIANÇAS E ADOLESCENTES</h3>
            <p>
              O "MonetaAi" observa as disposições do art. 14 da LGPD, quando aplicáveis, quanto ao tratamento de dados de crianças e adolescentes, adotando os seguintes princípios:
            </p>
            <ul>
              <li>tratamento de dados pessoais de crianças (menores de 12 anos) somente ocorrerá mediante consentimento específico e em destaque dado por pelo menos um dos pais ou responsável legal.</li>
              <li>tratamento de dados pessoais de adolescentes (maiores de 12 anos e menores de 18 anos) será realizado de forma prioritária no seu melhor interesse, garantindo segurança, privacidade e respeito ao desenvolvimento.</li>
              <li>sistema compromete-se a manter controles técnicos e administrativos adequados, de acordo com a LGPD e com as normas ISO/IEC 27701, para assegurar a confidencialidade, integridade e uso responsável das informações de crianças e adolescentes.</li>
              <li>consentimento dos responsáveis poderá ser verificado por mecanismos de autenticação digital, e estes poderão revogar a autorização a qualquer momento.</li>
            </ul>

            <h3>CLÁUSULA DÉCIMA TERCEIRA – DISPOSIÇÕES GERAIS</h3>
            <p>
              O presente Termo pode ser atualizado periodicamente para refletir mudanças legais ou operacionais.
            </p>
            <p>
              Este Termo é regido pela legislação brasileira e pela LGPD.
            </p>

            <h3>CLÁUSULA DÉCIMA QUARTA – DO FORO</h3>
            <p>
              Fica eleito o foro da comarca de Belo Horizonte/MG para dirimir eventuais controvérsias.
            </p>
            
            <p className="terms-footer">
              Ao aceitar, você concorda com todos os termos descritos e com nossa Política de Privacidade.
            </p>
          </div>
        </div>

        <div className="terms-actions">
          <button 
            className="terms-btn decline" 
            onClick={onDecline}
          >
            Recusar
          </button>
          <button 
            className="terms-btn accept" 
            onClick={onAccept}
            disabled={!hasScrolled}
          >
            {hasScrolled ? 'Aceitar Termos' : 'Role até o final'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;