import { SideItem } from './SideItem';
import { 
  HomeIcon, BagIcon, WalletIcon, ChartIcon, DocIcon, 
  PlanIcon, BellIcon, BotIcon, GearIcon, 
  UserIcon, ExitIcon 
} from './Icons';
import { useSecureNavigation } from '../../hooks/useSecureNavigation';

export function Sidebar() {
  const { secureNavigate } = useSecureNavigation();
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };
  
  return (
    <aside className="sys-sidebar">
      <div className="sys-brand">MonetaAi</div>

      <div className="sys-side-group">
        <div className="sys-side-title">Menu Principal</div>
        <nav className="sys-side-nav">
          <SideItem label="Início" icon={<HomeIcon />} onClick={() => secureNavigate('/system')} />
          <SideItem label="Gastos" icon={<BagIcon />} onClick={() => secureNavigate('/expenses')} />
          <SideItem label="Receitas" icon={<WalletIcon />} onClick={() => secureNavigate('/incomes')} />
          <SideItem label="Análises" icon={<ChartIcon />} onClick={() => secureNavigate('/analytics')} />
          <SideItem label="Relatórios" icon={<DocIcon />} onClick={() => secureNavigate('/reports')} />
          <SideItem label="Planejamento" icon={<PlanIcon />} />
          <SideItem label="Alertas" icon={<BellIcon />} onClick={() => secureNavigate('/alerts')} />
          <SideItem label="Simulador Chatbot" icon={<BotIcon />} />
          <SideItem label="Perfil" icon={<UserIcon />} onClick={() => secureNavigate('/profile')} />
          <SideItem label="Configurações" icon={<GearIcon />} />
        </nav>
      </div>

      <div className="sys-side-footer">
        <SideItem label="Sair" icon={<ExitIcon />} onClick={handleLogout} />
      </div>
    </aside>
  );
}