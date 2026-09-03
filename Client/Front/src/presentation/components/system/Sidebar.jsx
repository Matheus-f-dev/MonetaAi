import { useNavigate } from 'react-router-dom';
import { SideItem } from './SideItem';
import {
  HomeIcon, BagIcon, WalletIcon, ChartIcon, DocIcon,
  BellIcon, BotIcon, CardIcon, RepeatIcon, PeopleIcon, BankIcon,
  UserIcon, ExitIcon
} from './Icons';

export function Sidebar() {
  const navigate = useNavigate();

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
          <SideItem label="Início" icon={<HomeIcon />} onClick={() => navigate('/system')} />
          <SideItem label="Contas" icon={<BankIcon />} onClick={() => navigate('/contas')} />
          <SideItem label="Gastos" icon={<BagIcon />} onClick={() => navigate('/expenses')} />
          <SideItem label="Receitas" icon={<WalletIcon />} onClick={() => navigate('/incomes')} />
          <SideItem label="Cartões" icon={<CardIcon />} onClick={() => navigate('/cartoes')} />
          <SideItem label="Gastos Fixos" icon={<RepeatIcon />} onClick={() => navigate('/gastos-fixos')} />
          <SideItem label="Pessoas" icon={<PeopleIcon />} onClick={() => navigate('/pessoas')} />
          <SideItem label="Análises" icon={<ChartIcon />} onClick={() => navigate('/analytics')} />
          <SideItem label="Relatórios" icon={<DocIcon />} onClick={() => navigate('/reports')} />
          <SideItem label="Alertas" icon={<BellIcon />} onClick={() => navigate('/alerts')} />
          <SideItem label="Impacto Financeiro" icon={<ChartIcon />} onClick={() => navigate('/impacto-financeiro')} />
          <SideItem label="Moneta AI" icon={<BotIcon />} onClick={() => navigate('/agent')} />
          <SideItem label="Perfil" icon={<UserIcon />} onClick={() => navigate('/profile')} />
        </nav>
      </div>

      <div className="sys-side-footer">
        <SideItem label="Sair" icon={<ExitIcon />} onClick={handleLogout} />
      </div>
    </aside>
  );
}