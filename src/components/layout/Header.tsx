import React from 'react';
import { NavigationTab } from '../../types';
import { formatDateBR, getTodaySP } from '../../utils/dateUtils';
import { Menu, Plus, TrendingUp, DollarSign } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface HeaderProps {
  activeTab: NavigationTab;
  onOpenMobileNav: () => void;
  onOpenNewEarning: () => void;
  onOpenRecordFollowers: () => void;
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Financeiro',
    subtitle: 'Visão consolidada do faturamento, despesas e lucro',
  },
  pages: {
    title: 'Minhas Páginas',
    subtitle: 'Gerenciamento de canais e perfis de conteúdo',
  },
  growth: {
    title: 'Crescimento de Audiência',
    subtitle: 'Acompanhamento de seguidores e inscritos por página',
  },
  earnings: {
    title: 'Lançamentos de Receita',
    subtitle: 'Histórico completo de ganhos gerais e específicos',
  },
  expenses: {
    title: 'Despesas & Custos',
    subtitle: 'Controle de gastos com anúncios, ferramentas e produção',
  },
  reports: {
    title: 'Relatórios & Exportação',
    subtitle: 'Análises detalhadas por período e fontes com download CSV',
  },
  goals: {
    title: 'Metas Mensais',
    subtitle: 'Definição e acompanhamento de metas financeiras',
  },
  settings: {
    title: 'Configurações do Sistema',
    subtitle: 'Conexão Supabase, banco de dados e perfil',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileNav,
  onOpenNewEarning,
  onOpenRecordFollowers,
}) => {
  const currentTabInfo = TAB_TITLES[activeTab] || {
    title: 'PageMoney',
    subtitle: 'Sistema financeiro',
  };

  const todaySP = getTodaySP();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 -ml-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-tight">
            {currentTabInfo.title}
          </h1>
          <p className="hidden sm:block text-xs text-neutral-500 leading-tight">
            {currentTabInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden lg:inline-flex items-center text-xs text-neutral-400 font-medium px-2.5 py-1 bg-neutral-100 rounded-lg">
          {formatDateBR(todaySP)} (São Paulo)
        </span>

        <ThemeToggle />

        {activeTab === 'growth' && (
          <button
            onClick={onOpenRecordFollowers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors shadow-2xs"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Registrar Seguidores</span>
            <span className="xs:hidden">Seguidores</span>
          </button>
        )}

        <button
          onClick={onOpenNewEarning}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-all shadow-xs active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Novo Ganho</span>
        </button>
      </div>
    </header>
  );
};
