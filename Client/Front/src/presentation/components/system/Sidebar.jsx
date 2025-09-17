import { SideItem } from './SideItem';
import { 
  HomeIcon, BagIcon, WalletIcon, ChartIcon, DocIcon, 
  PlanIcon, BellIcon, PlaneIcon, BotIcon, GearIcon, 
  UserIcon, ExitIcon 
} from './Icons';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };
  
  return (
    <aside className="sys-sidebar">
      <div className="sys-brand">MonetaAi</div>

      <div className="sys-side-group">
        <div className="sys-side-title">Menu Principal</div>
        <nav className="sys-side-nav">
          <SideItem label="Início" icon={<HomeIcon />} onClick={() => navigate('/system')} />
          <SideItem label="Gastos" icon={<BagIcon />} onClick={() => navigate('/expenses')} />
          <SideItem label="Receitas" icon={<WalletIcon />} onClick={() => navigate('/incomes')} />
          <SideItem label="Análises" icon={<ChartIcon />} />
          <SideItem label="Relatórios" icon={<DocIcon />} onClick={() => navigate('/reports')} />
          <SideItem label="Planejamento" icon={<PlanIcon />} />
          <SideItem label="Alertas" icon={<BellIcon />} onClick={() => navigate('/alerts')} />
          <SideItem label="Modo Viagem" icon={<PlaneIcon />} />
          <SideItem label="Simulador Chatbot" icon={<BotIcon />} />
          <SideItem label="Perfil" icon={<UserIcon />} onClick={() => navigate('/profile')} />
          <SideItem label="Configurações" icon={<GearIcon />} />
        </nav>
      </div>

      <div className="sys-side-footer">
        <SideItem label="Sair" icon={<ExitIcon />} onClick={handleLogout} />
      </div>
    </aside>
  );
}