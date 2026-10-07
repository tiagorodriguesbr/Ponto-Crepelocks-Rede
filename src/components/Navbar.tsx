import React from 'react';
import {
  Building2,
  Bell,
  LogOut,
  UserCheck,
  Shield,
  Layers,
  ChevronDown,
  Clock,
  Sparkles,
  Users,
  Cloud
} from 'lucide-react';
import { UserAccount, Store, ThemeStyle } from '../types';
import { ThemeSelector } from './ThemeSelector';

interface NavbarProps {
  currentUser: UserAccount;
  stores: Store[];
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentTheme: ThemeStyle;
  onThemeChange: (theme: ThemeStyle) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  stores,
  selectedStoreId,
  onStoreChange,
  activeTab,
  onTabChange,
  currentTheme,
  onThemeChange,
  unreadNotificationsCount,
  onOpenNotifications,
  onLogout
}) => {
  const isEmployee = currentUser.role === 'atendente';

  const adminTabs = [
    { id: 'dashboard', label: 'Visão Geral' },
    { id: 'aderencia', label: 'Aderência à Escala' },
    { id: 'escalas', label: 'Escalas (6x1 / 12x36)' },
    { id: 'ocorrencias', label: 'Ocorrências & Prontuário' },
    { id: 'lojas', label: 'Lojas & Unidades' },
    { id: 'colaboradores', label: 'Colaboradores & Acessos' },
    { id: 'relatorios', label: 'Relatórios & Folha' }
  ];

  const employeeTabs = [
    { id: 'bater_ponto', label: 'Meu Ponto Eletrônico' },
    { id: 'minha_aderencia', label: 'Minha Escala & Aderência' },
    { id: 'meu_historico', label: 'Meus Comprovantes Digitais' }
  ];

  const tabs = isEmployee ? employeeTabs : adminTabs;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md transition-colors">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Store filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange(tabs[0].id)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-950/40">
              C
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-foreground block leading-tight">
                CREPELOCKS
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
                Ponto & Gestão RH
              </span>
            </div>
          </div>

          {/* Store switcher for Admin / Gerente */}
          {!isEmployee && (
            <div className="hidden md:flex items-center gap-1.5 ml-2 pl-3 border-l border-border">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={selectedStoreId}
                onChange={(e) => onStoreChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer py-1 pr-2"
              >
                <option value="all" className="bg-zinc-900 text-white">Todas as Lojas Crepelocks</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right actions: Theme selector, Notifications, User profile */}
        <div className="flex items-center gap-2.5">
          {/* Cloud Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold" title="Sincronização em tempo real ativa no Firebase Firestore">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nuvem Firestore</span>
          </div>

          {/* Theme selector */}
          <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Alertas e Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User profile & Logout button */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-border">
            <div className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-border bg-card/60 text-xs">
              <div
                className={`w-6 h-6 rounded-lg bg-gradient-to-br ${
                  currentUser.avatarColor || 'from-emerald-500 to-teal-700'
                } flex items-center justify-center text-white font-bold text-[11px] shadow-sm`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="font-bold text-foreground text-xs leading-tight truncate max-w-[120px]">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold uppercase">
                  {currentUser.role}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-xs font-semibold flex items-center gap-1"
              title="Encerrar sessão (Logout)"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline text-[11px]">Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border/60 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
