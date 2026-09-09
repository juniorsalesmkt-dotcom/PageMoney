import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  Layers,
  TrendingUp,
  Receipt,
  ArrowDownCircle,
  BarChart3,
  Target,
  Settings,
  LogOut,
  X,
  Database,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pages', label: 'Minhas Páginas', icon: Layers },
  { id: 'growth', label: 'Crescimento', icon: TrendingUp },
  { id: 'earnings', label: 'Lançamentos', icon: Receipt },
  { id: 'expenses', label: 'Despesas', icon: ArrowDownCircle },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'goals', label: 'Metas', icon: Target },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { user, profile, signOut, isConfigured } = useAuth();

  const handleSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#15181e] border-r border-neutral-200/80 dark:border-[#262c38] w-64 select-none">
      {/* Brand logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-[#262c38]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-emerald-600 flex items-center justify-center shadow-xs">
            <span className="text-white font-black text-sm tracking-tight">PM</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-tight tracking-tight">
              PageMoney
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-semibold tracking-wider">
              Finanças & Páginas
            </span>
          </div>
        </div>
        {isOpenMobile && (
          <button
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#1c2028] hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 stroke-[1.8] ${
                  isActive ? 'text-white dark:text-neutral-950' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Supabase connection indicator */}
      <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-neutral-50 border border-neutral-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-[11px] font-semibold text-neutral-700">Supabase</span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              isConfigured ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
            }`}
          />
        </div>
        <p className="text-[10px] text-neutral-500 mt-1 leading-tight">
          {isConfigured ? 'PostgreSQL Ativo & RLS' : 'Configuração pendente'}
        </p>
      </div>

      {/* User info & Logout */}
      <div className="p-3 border-t border-neutral-100 space-y-2">
        <div className="px-2 pt-1 flex items-center justify-between">
          <span className="text-[11px] font-medium text-neutral-500">Aparência</span>
          <ThemeToggle showLabel={false} className="py-1 px-2" />
        </div>

        <div className="flex items-center justify-between px-2 py-1.5 bg-neutral-50 rounded-xl">
          <div className="flex flex-col truncate pr-2">
            <span className="text-xs font-semibold text-neutral-900 truncate">
              {profile?.nome || user?.email?.split('@')[0] || 'Usuário'}
            </span>
            <span className="text-[11px] text-neutral-500 truncate">{user?.email}</span>
          </div>
          <button
            onClick={() => signOut()}
            title="Sair da conta"
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0 z-30">
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative z-50 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
