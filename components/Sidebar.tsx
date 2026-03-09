
import React from 'react';
import { DashboardIcon, BetsIcon, StatisticsIcon, SettingsIcon, LogoIcon } from './icons/Icons';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const { user, logout } = useAuth();
  const navItems = [
    { name: 'Dashboard', icon: <DashboardIcon /> },
    { name: 'Banca', icon: <span className="text-xl">💰</span> },
    { name: 'Apostas', icon: <BetsIcon /> },
    { name: 'Mercado', icon: <span className="text-xl">📊</span> },
    { name: 'Estatísticas', icon: <StatisticsIcon /> },
    ...(user?.role === 'admin' ? [{ name: 'Usuários', icon: <span className="text-xl">👥</span> }] : []),
    { name: 'Configurações', icon: <SettingsIcon /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 p-6 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-12">
        <LogoIcon className="h-8 w-8 text-emerald-400" />
        <h1 className="text-xl font-bold text-white">Bankroll Pro</h1>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => onPageChange(item.name)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activePage === item.name
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)] border-l-4 border-emerald-500'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
            }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
        <div className="flex items-center gap-3 px-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user?.email}</p>
            <p className="text-[10px] text-slate-500">Plano Premium</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

