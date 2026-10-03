import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { ContentPage } from '../../types';
import {
  formatCurrency,
  formatFollowerCount,
  getCurrentMonthSP,
  getPreviousMonthSP,
} from '../../utils/dateUtils';
import {
  Layers,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  TrendingUp,
  DollarSign,
  Wallet,
  Calendar,
  BarChart3,
  LayoutGrid,
  ListFilter,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { PageModal } from './PageModal';
import { PageProfitModal, PagePeriodFilter } from './PageProfitModal';

interface PagesViewProps {
  onOpenNewPage: () => void;
  onSelectPageGrowth: (pageId: string) => void;
  onOpenFollowerModalForPage: (pageId: string) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const PagesView: React.FC<PagesViewProps> = ({
  onOpenNewPage,
  onSelectPageGrowth,
  onOpenFollowerModalForPage,
  onToast,
}) => {
  const { pages, earnings, expenses, deletePage, followerHistory } = useData();
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [profitModalPage, setProfitModalPage] = useState<ContentPage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PagePeriodFilter>('month');
  const [viewMode, setViewMode] = useState<'cards' | 'ranking'>('cards');

  const curMonth = getCurrentMonthSP();
  const prevMonth = getPreviousMonthSP();
  const currentYear = new Date().getFullYear().toString();

  const matchesPeriod = (dateStr: string) => {
    if (period === 'month') return dateStr.startsWith(curMonth);
    if (period === 'prev_month') return dateStr.startsWith(prevMonth);
    if (period === 'year') return dateStr.startsWith(currentYear);
    if (period === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return dateStr >= d.toISOString().split('T')[0];
    }
    if (period === '90d') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      return dateStr >= d.toISOString().split('T')[0];
    }
    return true;
  };

  // Financial stats per page for the selected period
  const pageFinancialsMap = useMemo(() => {
    const map: Record<
      string,
      {
        receita: number;
        despesas: number;
        lucro: number;
        margem: number;
        qtdGanhos: number;
        qtdDespesas: number;
      }
    > = {};

    pages.forEach((p) => {
      map[p.id] = {
        receita: 0,
        despesas: 0,
        lucro: 0,
        margem: 0,
        qtdGanhos: 0,
        qtdDespesas: 0,
      };
    });

    earnings.forEach((e) => {
      if (e.page_id && e.origem !== 'geral' && map[e.page_id] && matchesPeriod(e.data)) {
        map[e.page_id].receita += Number(e.valor || 0);
        map[e.page_id].qtdGanhos += 1;
      }
    });

    expenses.forEach((ex) => {
      if (ex.page_id && map[ex.page_id] && matchesPeriod(ex.data)) {
        map[ex.page_id].despesas += Number(ex.valor || 0);
        map[ex.page_id].qtdDespesas += 1;
      }
    });

    Object.keys(map).forEach((pageId) => {
      const item = map[pageId];
      item.lucro = item.receita - item.despesas;
      item.margem = item.receita > 0 ? (item.lucro / item.receita) * 100 : 0;
    });

    return map;
  }, [pages, earnings, expenses, period, curMonth, prevMonth, currentYear]);

  // Overall pages summary in selected period
  const pagesSummary = useMemo(() => {
    let totalReceita = 0;
    let totalDespesas = 0;
    let bestPage: { page: ContentPage; lucro: number } | null = null;

    pages.forEach((p) => {
      const fin = pageFinancialsMap[p.id];
      if (!fin) return;
      totalReceita += fin.receita;
      totalDespesas += fin.despesas;
      if (!bestPage || fin.lucro > bestPage.lucro) {
        bestPage = { page: p, lucro: fin.lucro };
      }
    });

    const totalLucro = totalReceita - totalDespesas;
    const margemGeral = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;

    return {
      totalReceita,
      totalDespesas,
      totalLucro,
      margemGeral,
      bestPage: bestPage && (bestPage as { page: ContentPage; lucro: number }).lucro > 0 ? bestPage : null,
    };
  }, [pages, pageFinancialsMap]);

  // Sorted pages by profit for the ranking table
  const sortedPagesByProfit = useMemo(() => {
    return [...pages].sort((a, b) => {
      const lucroA = pageFinancialsMap[a.id]?.lucro || 0;
      const lucroB = pageFinancialsMap[b.id]?.lucro || 0;
      return lucroB - lucroA;
    });
  }, [pages, pageFinancialsMap]);

  const getLatestFollowers = (pageId: string): number => {
    const pageHistory = followerHistory
      .filter((f) => f.page_id === pageId)
      .sort((a, b) => a.data.localeCompare(b.data));
    if (pageHistory.length === 0) return 0;
    return pageHistory[pageHistory.length - 1].quantidade_seguidores;
  };

  const handleDelete = async (page: ContentPage) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a página "${page.nome}"? Os lançamentos associados se tornarão gerais.`
      )
    ) {
      setDeletingId(page.id);
      const res = await deletePage(page.id);
      setDeletingId(null);
      if (res.success) {
        onToast('Página excluída com sucesso.');
      } else {
        onToast(res.error || 'Erro ao excluir página.', 'error');
      }
    }
  };

  const platformBadge = (plataforma: string) => {
    const colors: Record<string, string> = {
      Instagram: 'bg-rose-50 text-rose-700 border-rose-200',
      TikTok: 'bg-neutral-900 text-white border-neutral-800 dark:bg-white dark:text-neutral-950',
      YouTube: 'bg-red-50 text-red-700 border-red-200',
      Facebook: 'bg-blue-50 text-blue-700 border-blue-200',
      Outra: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    };
    return (
      <span
        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
          colors[plataforma] || colors.Outra
        }`}
      >
        {plataforma}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Minhas Páginas & Lucratividade
          </h2>
          <p className="text-xs text-neutral-500">
            Acompanhe separadamente quanto cada página está gerando de receita, despesa e lucro líquido
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewPage}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition shadow-xs active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nova Página
        </button>
      </div>

      {pages.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Você ainda não cadastrou nenhuma página."
          description="Cadastre sua primeira página ou canal para atribuir receitas, despesas e visualizar o lucro individual de cada página."
          actionLabel="+ Adicionar página"
          onAction={onOpenNewPage}
        />
      ) : (
        <>
          {/* Filter & View Switcher Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 mr-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Período do Lucro:</span>
              </div>
              {(
                [
                  { id: 'month', label: 'Este mês' },
                  { id: 'prev_month', label: 'Mês anterior' },
                  { id: '30d', label: '30 dias' },
                  { id: '90d', label: '90 dias' },
                  { id: 'year', label: 'Este ano' },
                  { id: 'all', label: 'Todo o período' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    period === p.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-2xs'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle: Cards vs Ranking Table */}
            <div className="inline-flex rounded-xl border border-neutral-200 dark:border-[#262c38] p-0.5 bg-neutral-50 dark:bg-[#101318] self-start md:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-[#1c2028] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Cartões
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ranking')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  viewMode === 'ranking'
                    ? 'bg-white dark:bg-[#1c2028] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Comparativo de Lucro
              </button>
            </div>
          </div>

          {/* Consolidated Pages Profit KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Receita das Páginas
              </span>
              <span className="mt-1.5 text-lg sm:text-xl font-bold text-neutral-900 block">
                {formatCurrency(pagesSummary.totalReceita)}
              </span>
              <span className="text-[11px] text-neutral-400">
                Soma atribuída às páginas
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Despesas das Páginas
              </span>
              <span className="mt-1.5 text-lg sm:text-xl font-bold text-rose-600 block">
                {formatCurrency(pagesSummary.totalDespesas)}
              </span>
              <span className="text-[11px] text-neutral-400">
                Custos vinculados às páginas
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Lucro Líquido (Páginas)
              </span>
              <span
                className={`mt-1.5 text-lg sm:text-xl font-bold block ${
                  pagesSummary.totalLucro >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {pagesSummary.totalLucro > 0 ? '+' : ''}
                {formatCurrency(pagesSummary.totalLucro)}
              </span>
              <span className="text-[11px] text-neutral-400">
                Margem: {pagesSummary.margemGeral.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Página Mais Lucrativa
              </span>
              {pagesSummary.bestPage ? (
                <>
                  <span className="mt-1.5 text-base sm:text-lg font-bold text-emerald-600 truncate block">
                    {pagesSummary.bestPage.page.nome}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium">
                    Lucro: {formatCurrency(pagesSummary.bestPage.lucro)}
                  </span>
                </>
              ) : (
                <>
                  <span className="mt-1.5 text-base font-bold text-neutral-400 block">
                    Sem lucro no período
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Registre ganhos nas páginas
                  </span>
                </>
              )}
            </div>
          </div>

          {viewMode === 'ranking' ? (
            /* Ranking Table View: See separately how much profit each page is making */
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Ranking de Lucro Individual por Página
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Comparativo detalhado de faturamento, custos e lucro líquido de cada página separadamente
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-100">
                    <tr>
                      <th className="px-6 py-3.5">#</th>
                      <th className="px-6 py-3.5">Página</th>
                      <th className="px-6 py-3.5">Plataforma</th>
                      <th className="px-6 py-3.5 text-right">Receita Bruta</th>
                      <th className="px-6 py-3.5 text-right">Despesas</th>
                      <th className="px-6 py-3.5 text-right">Lucro Líquido</th>
                      <th className="px-6 py-3.5 text-right">Margem</th>
                      <th className="px-6 py-3.5 text-right">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {sortedPagesByProfit.map((page, idx) => {
                      const fin = pageFinancialsMap[page.id] || {
                        receita: 0,
                        despesas: 0,
                        lucro: 0,
                        margem: 0,
                        qtdGanhos: 0,
                        qtdDespesas: 0,
                      };
                      return (
                        <tr key={page.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="px-6 py-4 font-bold text-neutral-400">
                            {idx + 1}º
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-neutral-900">{page.nome}</div>
                            {page.username && (
                              <div className="text-[11px] text-neutral-400 font-mono">
                                {page.username}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {platformBadge(page.plataforma)}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap font-semibold text-neutral-900">
                            {formatCurrency(fin.receita)}
                            <span className="block text-[10px] text-neutral-400 font-normal">
                              {fin.qtdGanhos} {fin.qtdGanhos === 1 ? 'ganho' : 'ganhos'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap font-semibold text-rose-600">
                            {formatCurrency(fin.despesas)}
                            <span className="block text-[10px] text-neutral-400 font-normal">
                              {fin.qtdDespesas} {fin.qtdDespesas === 1 ? 'despesa' : 'despesas'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span
                              className={`text-sm font-bold ${
                                fin.lucro > 0
                                  ? 'text-emerald-600'
                                  : fin.lucro < 0
                                  ? 'text-rose-600'
                                  : 'text-neutral-700'
                              }`}
                            >
                              {fin.lucro > 0 ? '+' : ''}
                              {formatCurrency(fin.lucro)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                fin.receita === 0 && fin.despesas === 0
                                  ? 'bg-neutral-100 text-neutral-500'
                                  : fin.lucro >= 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {fin.margem.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setProfitModalPage(page)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition cursor-pointer"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              Extrato do Lucro
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View with Individual Profit Box inside each Page Card */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages.map((page) => {
                const followers = getLatestFollowers(page.id);
                const isYouTube = page.plataforma === 'YouTube';
                const audienceTerm = isYouTube ? 'inscritos' : 'seguidores';
                const fin = pageFinancialsMap[page.id] || {
                  receita: 0,
                  despesas: 0,
                  lucro: 0,
                  margem: 0,
                  qtdGanhos: 0,
                  qtdDespesas: 0,
                };

                return (
                  <div
                    key={page.id}
                    className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-5 flex flex-col justify-between hover:border-neutral-300 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-neutral-900 leading-tight">
                              {page.nome}
                            </h3>
                            {platformBadge(page.plataforma)}
                          </div>
                          {page.username && (
                            <p className="text-xs text-neutral-500 font-mono">
                              {page.username}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            page.status === 'Ativa'
                              ? 'bg-emerald-50 text-emerald-700'
                              : page.status === 'Pausada'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {page.status}
                        </span>
                      </div>

                      {/* Financial Profit Box for this Page */}
                      <div className="mt-4 p-3.5 rounded-xl bg-neutral-50 dark:bg-[#101318] border border-neutral-200/70 dark:border-[#262c38] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                            Lucro Líquido da Página
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              fin.receita === 0 && fin.despesas === 0
                                ? 'bg-neutral-200/70 text-neutral-600'
                                : fin.lucro >= 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            Margem: {fin.margem.toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <span
                            className={`text-xl font-bold tracking-tight ${
                              fin.lucro > 0
                                ? 'text-emerald-600'
                                : fin.lucro < 0
                                ? 'text-rose-600'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {fin.lucro > 0 ? '+' : ''}
                            {formatCurrency(fin.lucro)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setProfitModalPage(page)}
                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 cursor-pointer"
                          >
                            Ver extrato
                          </button>
                        </div>

                        <div className="pt-2 border-t border-neutral-200/70 dark:border-[#222631] grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">
                              Receita ({fin.qtdGanhos})
                            </span>
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {formatCurrency(fin.receita)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-400 block">
                              Despesas ({fin.qtdDespesas})
                            </span>
                            <span className="font-semibold text-rose-600">
                              {formatCurrency(fin.despesas)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Niche & Audience Details */}
                      <div className="mt-3 pt-2.5 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[11px] text-neutral-400 block">Nicho</span>
                          <span className="font-medium text-neutral-700">
                            {page.nicho || 'Não especificado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-400 block">Audiência Atual</span>
                          <span className="font-bold text-neutral-900">
                            {followers > 0
                              ? `${formatFollowerCount(followers)} ${audienceTerm}`
                              : `0 ${audienceTerm}`}
                          </span>
                        </div>
                      </div>

                      {page.observacoes && (
                        <p className="mt-3 text-xs text-neutral-500 line-clamp-2 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                          {page.observacoes}
                        </p>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {page.url && (
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Visitar página"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingPage(page)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar página"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === page.id}
                          onClick={() => handleDelete(page)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir página"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenFollowerModalForPage(page.id)}
                          className="text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          + {isYouTube ? 'Inscritos' : 'Seguidores'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectPageGrowth(page.id)}
                          className="text-xs font-semibold text-neutral-900 hover:text-black flex items-center gap-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          Crescimento
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Edit Page Modal */}
      {editingPage && (
        <PageModal
          isOpen={Boolean(editingPage)}
          onClose={() => setEditingPage(null)}
          pageToEdit={editingPage}
          onSuccess={(msg) => onToast(msg, 'success')}
        />
      )}

      {/* Page Profit Detail Modal */}
      {profitModalPage && (
        <PageProfitModal
          isOpen={Boolean(profitModalPage)}
          onClose={() => setProfitModalPage(null)}
          page={profitModalPage}
          initialPeriod={period}
        />
      )}
    </div>
  );
};
