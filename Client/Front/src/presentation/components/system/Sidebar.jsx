import { SideItem } from './SideItem';
import { 
  HomeIcon, BagIcon, WalletIcon, ChartIcon, DocIcon, 
  PlanIcon, BellIcon, PlaneIcon, BotIcon, GearIcon, 
  UserIcon, ExitIcon 
} from './Icons';

export function Sidebar() {
  return (
    <aside className="sys-sidebar">
      <div className="sys-brand">MonetaAi</div>

      <div className="sys-side-group">
        <div className="sys-side-title">Menu Principal</div>
        <nav className="sys-side-nav">
          <SideItem label="Início" active icon={<HomeIcon />} />
          <SideItem label="Gastos" icon={<BagIcon />} />
          <SideItem label="Receitas" icon={<WalletIcon />} />
          <SideItem label="Análises" icon={<ChartIcon />} />
          <SideItem label="Relatórios" icon={<DocIcon />} />
          <SideItem label="Planejamento" icon={<PlanIcon />} />
          <SideItem label="Alertas" icon={<BellIcon />} />
          <SideItem label="Modo Viagem" icon={<PlaneIcon />} />
          <SideItem label="Simulador Chatbot" icon={<BotIcon />} />
          <SideItem label="Configurações" icon={<GearIcon />} />
        </nav>
      </div>

      <div className="sys-side-footer">
        <SideItem label="Meu Perfil" icon={<UserIcon />} />
        <SideItem label="Sair" icon={<ExitIcon />} />
      </div>
    </aside>
  );
}