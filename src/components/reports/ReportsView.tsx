import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  formatCurrency,
  formatDateBR,
  formatPercent,
  getTodaySP,
  getYesterdaySP,
  getCurrentMonthSP,
  getPreviousMonthSP,
} from '../../utils/dateUtils';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Tag,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

type ReportPeriod = 'month' | 'prev_month' | 'year' | '30d' | '90d' | 'all' | 'custom';

export const ReportsView: React.FC = () => {
  const { earnings, expenses, pages } = useData();

  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  const curMonth = getCurrentMonthSP();
  const prevMonth = getPreviousMonthSP();
  const currentYear = new Date().getFullYear().toString();

  // Filtered earnings
  const filteredEarnings = useMemo(() => {
    return earnings.filter((e) => {
      // Period
      if (period === 'month' && !e.data.startsWith(curMonth)) return false;
      if (period === 'prev_month' && !e.data.startsWith(prevMonth)) return false;
      if (period === 'year' && !e.data.startsWith(currentYear)) return false;
      if (period === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        if (e.data < d.toISOString().split('T')[0]) return false;
      }
      if (period === '90d') {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        if (e.data < d.toISOString().split('T')[0]) return false;
      }
      if (period === 'custom') {
        if (customStart && e.data < customStart) return false;
        if (customEnd && e.data > customEnd) return false;
      }

      // Page
      if (selectedPage === 'geral' && e.origem !== 'geral') return false;
      if (selectedPage !== 'all' && selectedPage !== 'geral' && e.page_id !== selectedPage)
        return false;

      // Source
      if (selectedSource !== 'all' && e.fonte_receita !== selectedSource) return false;

      return true;
    });
  }, [
    earnings,
    period,
    curMonth,
    prevMonth,
    currentYear,
    customStart,
    customEnd,
    selectedPage,
    selectedSource,
  ]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((ex) => {
      if (period === 'month' && !ex.data.startsWith(curMonth)) return false;
      if (period === 'prev_month' && !ex.data.startsWith(prevMonth)) return false;
      if (period === 'year' && !ex.data.startsWith(currentYear)) return false;
      if (period === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        if (ex.data < d.toISOString().split('T')[0]) return false;
      }
      if (period === '90d') {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        if (ex.data < d.toISOString().split('T')[0]) return false;
      }
      if (period === 'custom') {
        if (customStart && ex.data < customStart) return false;
        if (customEnd && ex.data > customEnd) return false;
      }

      if (selectedPage === 'geral' && ex.page_id !== null) return false;
      if (selectedPage !== 'all' && selectedPage !== 'geral' && ex.page_id !== selectedPage)
        return false;

      return true;
    });
  }, [
    expenses,
    period,
    curMonth,
    prevMonth,
    currentYear,
    customStart,
    customEnd,
    selectedPage,
  ]);

  // Aggregate Metrics
  const totalFaturamento = useMemo(() => {
    return filteredEarnings.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  }, [filteredEarnings]);

  const totalDespesas = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  }, [filteredExpenses]);

  const lucroLiquido = totalFaturamento - totalDespesas;
  const margemLiquida = totalFaturamento > 0 ? (lucroLiquido / totalFaturamento) * 100 : 0;

  // Best Day
  const bestDay = useMemo(() => {
    if (filteredEarnings.length === 0) return null;
    const dayMap: Record<string, number> = {};
    filteredEarnings.forEach((e) => {
      dayMap[e.data] = (dayMap[e.data] || 0) + Number(e.valor || 0);
    });
    let best = { data: '', valor: 0 };
    Object.entries(dayMap).forEach(([d, val]) => {
      if (val > best.valor) {
        best = { data: d, valor: val };
      }
    });
    return best.valor > 0 ? best : null;
  }, [filteredEarnings]);

  // Sources breakdown
  const sourcesBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEarnings.forEach((e) => {
      map[e.fonte_receita] = (map[e.fonte_receita] || 0) + Number(e.valor || 0);
    });
    return Object.entries(map)
      .map(([name, valor]) => ({
        name,
        valor,
        percentual: totalFaturamento > 0 ? (valor / totalFaturamento) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [filteredEarnings, totalFaturamento]);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

  const getPageName = (pageId?: string | null): string => {
    if (!pageId) return 'Geral';
    const found = pages.find((p) => p.id === pageId);
    return found ? `${found.nome} (${found.plataforma})` : 'Página removida';
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredEarnings.length === 0) {
      alert('Não existem dados filtrados para exportação.');
      return;
    }

    const headers = ['ID', 'Data', 'Horario', 'Origem', 'Pagina', 'Fonte', 'Descricao', 'Valor (BRL)'];
    const rows = filteredEarnings.map((e) => {
      const isGeral = e.origem === 'geral' || !e.page_id;
      const pName = isGeral ? 'Geral' : getPageName(e.page_id);
      return [
        e.id,
        e.data,
        e.horario || '',
        e.origem,
        `"${pName.replace(/"/g, '""')}"`,
        `"${e.fonte_receita.replace(/"/g, '""')}"`,
        `"${(e.descricao || '').replace(/"/g, '""')}"`,
        Number(e.valor).toFixed(2),
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PageMoney_Relatorio_${period}_${getTodaySP()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Relatórios Financeiros
          </h2>
          <p className="text-xs text-neutral-500">
            Análises aprofundadas de receita por canal, fonte e lucratividade
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-800 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition shadow-2xs active:scale-[0.98]"
        >
          <Download className="w-4 h-4 text-neutral-600" />
          Exportar CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-neutral-600 mb-1">
              Período do Relatório
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="block w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
            >
              <option value="month">Mês atual</option>
              <option value="prev_month">Mês anterior</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="year">Este ano</option>
              <option value="all">Todo o histórico</option>
              <option value="custom">Personalizado...</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-600 mb-1">
              Filtrar por Página
            </label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="block w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
            >
              <option value="all">Todas as páginas e gerais</option>
              <option value="geral">Geral (Sem página)</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.plataforma})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-600 mb-1">
              Filtrar por Fonte
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="block w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
            >
              <option value="all">Todas as fontes</option>
              <option value="TikTok Shop">TikTok Shop</option>
              <option value="Shopee Afiliados">Shopee Afiliados</option>
              <option value="E-books">E-books</option>
              <option value="Monetização de conteúdo">Monetização de conteúdo</option>
              <option value="Afiliados">Afiliados</option>
              <option value="Publicidade">Publicidade</option>
              <option value="Produtos próprios">Produtos próprios</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>

        {period === 'custom' && (
          <div className="pt-2 border-t border-neutral-100 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium">De:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 border border-neutral-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium">Até:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 border border-neutral-300 rounded-lg text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Faturamento Bruto
          </span>
          <div className="mt-1 text-xl font-bold text-neutral-900">
            {formatCurrency(totalFaturamento)}
          </div>
          <span className="text-[11px] text-neutral-400">
            {filteredEarnings.length} lançamentos
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Despesas
          </span>
          <div className="mt-1 text-xl font-bold text-rose-600">
            {formatCurrency(totalDespesas)}
          </div>
          <span className="text-[11px] text-neutral-400">
            {filteredExpenses.length} despesas
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Lucro Líquido
          </span>
          <div
            className={`mt-1 text-xl font-bold ${
              lucroLiquido >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(lucroLiquido)}
          </div>
          <span className="text-[11px] text-neutral-400">
            Margem: {margemLiquida.toFixed(1)}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Melhor Dia
          </span>
          <div className="mt-1 text-xl font-bold text-neutral-900">
            {bestDay ? formatCurrency(bestDay.valor) : 'R$ 0,00'}
          </div>
          <span className="text-[11px] text-neutral-400">
            {bestDay ? formatDateBR(bestDay.data) : 'Nenhum lançamento'}
          </span>
        </div>
      </div>

      {/* Sources Breakdown Table & Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-5">
        <h3 className="text-sm font-bold text-neutral-900 tracking-tight mb-1">
          Distribuição de Receita por Fonte
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Participação de cada canal e produto no faturamento do período
        </p>

        {sourcesBreakdown.length === 0 ? (
          <p className="text-xs text-neutral-400 py-6 text-center">
            Nenhum ganho registrado para este período.
          </p>
        ) : (
          <div className="space-y-3">
            {sourcesBreakdown.map((src, index) => (
              <div key={src.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800">{src.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500">{src.percentual.toFixed(1)}%</span>
                    <span className="font-bold text-neutral-900">{formatCurrency(src.valor)}</span>
                  </div>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${src.percentual}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
