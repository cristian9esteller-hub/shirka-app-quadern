
import React from 'react';
import { Screen, UserProfile } from '../types';
import Icon from './Icon';

interface SidebarProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
  onLogout: () => void;
  user: UserProfile | null;
  onOpenSettings: () => void;
  isOpen?: boolean;
}

const NavItem: React.FC<{
  screen: Screen;
  icon: string;
  label: string;
  activeScreen: Screen;
  onClick: (screen: Screen) => void;
  badge?: number;
}> = ({ screen, icon, label, activeScreen, onClick, badge }) => {
  const isActive = activeScreen === screen;
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick(screen);
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors group ${
        isActive
          ? 'bg-primary/20 text-green-800 dark:text-primary'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <Icon name={icon} className={isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'} />
      <span className="flex-1">{label}</span>
      {badge && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{badge}</span>}
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, setActiveScreen, onLogout, user, isOpen, onOpenSettings }) => {
  return (
    <aside className={`
      w-64 bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 
      flex flex-col fixed h-screen z-50 transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
          S
        </div>
        <span className="font-bold text-lg tracking-tight">SHIRKA <span className="font-normal opacity-70">quadern</span></span>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        <NavItem screen={Screen.Dashboard} icon="dashboard" label="Tauler" activeScreen={activeScreen} onClick={setActiveScreen} />
        <NavItem screen={Screen.Alumnes} icon="school" label="Alumnes" activeScreen={activeScreen} onClick={setActiveScreen} />
        <NavItem screen={Screen.Avaluacio} icon="assignment" label="Avaluació" activeScreen={activeScreen} onClick={setActiveScreen} />
        <NavItem screen={Screen.Calendari} icon="calendar_month" label="Calendari" activeScreen={activeScreen} onClick={setActiveScreen} />
        <NavItem screen={Screen.Assistencia} icon="fact_check" label="Assistència" activeScreen={activeScreen} onClick={setActiveScreen} />
        <NavItem screen={Screen.Reunions} icon="groups_3" label="Reunions" activeScreen={activeScreen} onClick={setActiveScreen} />
        <NavItem screen={Screen.Missatgeria} icon="forum" label="Missatgeria" activeScreen={activeScreen} onClick={setActiveScreen} badge={3} />
      </nav>

      <div className="p-4 mt-auto space-y-3">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm"
        >
          <Icon name="logout" className="text-red-500 text-lg" />
          Tancar Sessió
        </button>
        <button 
          onClick={onOpenSettings}
          className="w-full text-left bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        >
          <img
            alt="Perfil"
            className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
            src={user?.avatar || "https://picsum.photos/id/1027/100/100"}
          />
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate leading-tight text-slate-800 dark:text-slate-100">{user?.name || 'Usuari'}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight">{user?.role || 'Sense rol'}</p>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
