import React, { useState, useMemo } from 'react';
import { ContentPage } from '../../types';
import { useData } from '../../context/DataContext';
import {
  formatCurrency,
  formatDateBR,
  getCurrentMonthSP,
  getPreviousMonthSP,
} from '../../utils/dateUtils';
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  ArrowDownCircle,
  Tag,
  Calendar,
} from 'lucide-react';

interface PageProfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: ContentPage | null;
  initialPeriod?: PagePeriodFilter;
}

export type PagePeriodFilter = 'month' | 'prev_month' | '30d' | '90d' | 'year' | 'all';

export const PageProfitModal: React.FC<PageProfitModalProps> = ({
  isOpen,
  onClose,
  page,
  initialPeriod = 'month',
}) => {
  const { earnings, expenses } = useData();
  const [period, setPeriod] = useState<PagePeriodFilter>(initialPeriod);
  const [activeListTab, setActiveListTab] = useState<'all' | 'earnings' | 'expenses'>('all');

  if (!isOpen || !page) return null;

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

  const pageEarnings = earnings.filter(
    (e) => e.page_id === page.id && e.origem !== 'geral' && matchesPeriod(e.data)
  );

  const pageExpenses = expenses.filter(
    (ex) => ex.page_id === page.id && matchesPeriod(ex.data)
  );

  const totalReceita = pageEarnings.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const totalDespesas = pageExpenses.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  const lucroLiquido = totalReceita - totalDespesas;
  const margem = totalReceita > 0 ? (lucroLiquido / totalReceita) * 100 : 0;
  const roi = totalDespesas > 0 ? ((totalReceita - totalDespesas) / totalDespesas) * 100 : null;

  // Breakdown by revenue source
  const revenueBySource = Object.entries(
    pageEarnings.reduce((acc, curr) => {
      const src = curr.fonte_receita || 'Outros';
      acc[src] = (acc[src] || 0) + Number(curr.valor || 0);
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, valor]) => ({
      name,
      valor,
      pct: totalReceita > 0 ? (valor / totalReceita) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  // Breakdown by expense category
  const expenseByCategory = Object.entries(
    pageExpenses.reduce((acc, curr) => {
      const cat = curr.categoria || 'Outros';
      acc[cat] = (acc[cat] || 0) + Number(curr.valor || 0);
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, valor]) => ({
      name,
      valor,
      pct: totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  // Combined transactions
  const transactions = [
    ...pageEarnings.map((e) => ({
      id: `e-${e.id}`,
      type: 'earning' as const,
      data: e.data,
      label: e.fonte_receita,
      descricao: e.descricao,
      valor: Number(e.valor || 0),
    })),
    ...pageExpenses.map((ex) => ({
      id: `ex-${ex.id}`,
      type: 'expense' as const,
      data: ex.data,
      label: ex.categoria,
      descricao: ex.descricao,
      valor: Number(ex.valor || 0),
    })),
  ]
    .filter((t) => {
      if (activeListTab === 'earnings') return t.type === 'earning';
      if (activeListTab === 'expenses') return t.type === 'expense';
      return true;
    })
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#15181e] rounded-2xl border border-neutral-200 dark:border-[#262c38] shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-[#262c38] flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Lucratividade: {page.nome}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1c2028] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#2c3342]">
                {page.plataforma}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Demonstrativo exclusivo de receitas, despesas e lucro líquido desta página
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1c2028] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Period Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-[#101318] p-3 rounded-xl border border-neutral-200/70 dark:border-[#262c38]">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Período de análise:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'month', label: 'Este mês' },
                  { id: 'prev_month', label: 'Mês passado' },
                  { id: '30d', label: '30 dias' },
                  { id: '90d', label: '90 dias' },
                  { id: 'year', label: 'Este ano' },
                  { id: 'all', label: 'Tudo' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    period === p.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-[#1c2028]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-[#262c38] bg-white dark:bg-[#15181e]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Receita Bruta
              </span>
              <span className="mt-1.5 text-lg font-bold text-neutral-900 dark:text-neutral-100 block">
                {formatCurrency(totalReceita)}
              </span>
              <span className="text-[11px] text-neutral-400">
                {pageEarnings.length} {pageEarnings.length === 1 ? 'ganho' : 'ganhos'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-[#262c38] bg-white dark:bg-[#15181e]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Custos / Despesas
              </span>
              <span className="mt-1.5 text-lg font-bold text-rose-600 block">
                {formatCurrency(totalDespesas)}
              </span>
              <span className="text-[11px] text-neutral-400">
                {pageExpenses.length} {pageExpenses.length === 1 ? 'despesa' : 'despesas'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-[#262c38] bg-white dark:bg-[#15181e]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Lucro Líquido
              </span>
              <span
                className={`mt-1.5 text-lg font-bold block ${
                  lucroLiquido > 0
                    ? 'text-emerald-600'
                    : lucroLiquido < 0
                    ? 'text-rose-600'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {lucroLiquido > 0 ? '+' : ''}
                {formatCurrency(lucroLiquido)}
              </span>
              <span className="text-[11px] text-neutral-400">
                {lucroLiquido >= 0 ? 'Operação no azul' : 'Operação no prejuízo'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-[#262c38] bg-white dark:bg-[#15181e]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Margem / ROI
              </span>
              <span
                className={`mt-1.5 text-lg font-bold block ${
                  margem >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {margem.toFixed(1)}%
              </span>
              <span className="text-[11px] text-neutral-400">
                {roi !== null ? `ROI: ${roi.toFixed(0)}%` : 'Sem custos no período'}
              </span>
            </div>
          </div>

          {/* Breakdown Columns: Fontes de Receita vs Categorias de Despesa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Sources */}
            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-[#262c38] bg-neutral-50/50 dark:bg-[#101318]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                Fontes de Ganhos da Página
              </h4>
              {revenueBySource.length === 0 ? (
                <p className="text-xs text-neutral-400 py-4 text-center">
                  Nenhum ganho registrado nesta página no período.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {revenueBySource.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {item.name}
                        </span>
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(item.valor)} ({item.pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-[#222834] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense Categories */}
            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-[#262c38] bg-neutral-50/50 dark:bg-[#101318]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-1.5">
                <ArrowDownCircle className="w-3.5 h-3.5 text-rose-600" />
                Despesas da Página
              </h4>
              {expenseByCategory.length === 0 ? (
                <p className="text-xs text-neutral-400 py-4 text-center">
                  Nenhuma despesa vinculada a esta página no período.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {expenseByCategory.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {item.name}
                        </span>
                        <span className="font-bold text-rose-600">
                          {formatCurrency(item.valor)} ({item.pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-[#222834] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transactions History for this Page */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Extrato da Página ({transactions.length})
              </h4>
              <div className="inline-flex rounded-lg border border-neutral-200 dark:border-[#262c38] p-0.5 bg-neutral-50 dark:bg-[#101318] text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveListTab('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    activeListTab === 'all'
                      ? 'bg-white dark:bg-[#1c2028] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                      : 'text-neutral-500'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveListTab('earnings')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    activeListTab === 'earnings'
                      ? 'bg-white dark:bg-[#1c2028] text-emerald-600 shadow-2xs font-semibold'
                      : 'text-neutral-500'
                  }`}
                >
                  Ganhos ({pageEarnings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveListTab('expenses')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    activeListTab === 'expenses'
                      ? 'bg-white dark:bg-[#1c2028] text-rose-600 shadow-2xs font-semibold'
                      : 'text-neutral-500'
                  }`}
                >
                  Despesas ({pageExpenses.length})
                </button>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-neutral-200 dark:border-[#262c38] rounded-xl text-xs text-neutral-400">
                Nenhuma movimentação registrada para este filtro.
              </div>
            ) : (
              <div className="border border-neutral-200/80 dark:border-[#262c38] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-[#101318] text-neutral-500 font-semibold border-b border-neutral-100 dark:border-[#262c38]">
                    <tr>
                      <th className="px-4 py-2.5">Data</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Fonte / Categoria</th>
                      <th className="px-4 py-2.5">Descrição</th>
                      <th className="px-4 py-2.5 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-[#222631]">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-neutral-50/60 dark:hover:bg-[#191d24]">
                        <td className="px-4 py-2.5 whitespace-nowrap font-medium">
                          {formatDateBR(t.data)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {t.type === 'earning' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                              Receita
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700">
                              Despesa
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap font-medium">
                          {t.label}
                        </td>
                        <td className="px-4 py-2.5 truncate max-w-[180px] text-neutral-500">
                          {t.descricao || '—'}
                        </td>
                        <td
                          className={`px-4 py-2.5 whitespace-nowrap text-right font-bold ${
                            t.type === 'earning' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {t.type === 'earning' ? '+' : '-'}
                          {formatCurrency(t.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-100 dark:border-[#262c38] bg-neutral-50 dark:bg-[#101318] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-[#1c2028] border border-neutral-300 dark:border-[#2c3342] rounded-lg hover:bg-neutral-50 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
