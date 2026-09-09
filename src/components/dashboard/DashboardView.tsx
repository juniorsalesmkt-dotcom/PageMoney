import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  formatCurrency,
  formatPercent,
  getMonthName,
  getCurrentMonthSP,
  getPreviousMonthSP,
} from '../../utils/dateUtils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Plus,
  Receipt,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { EmptyState } from '../common/EmptyState';

interface DashboardViewProps {
  onOpenNewEarning: () => void;
}

type DateFilter = '7d' | '30d' | '90d' | 'month' | 'year';

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenNewEarning }) => {
  const { earnings, metrics } = useData();
  const [chartFilter, setChartFilter] = useState<DateFilter>('30d');

  const currentMonthStr = getCurrentMonthSP();
  const prevMonthStr = getPreviousMonthSP();
  const currentMonthName = getMonthName(currentMonthStr);
  const prevMonthName = getMonthName(prevMonthStr);

  // Prepare Daily Evolution Data based on selected filter
  const chartData = useMemo(() => {
    if (earnings.length === 0) return [];

    const now = new Date();
    let startDate = new Date();

    if (chartFilter === '7d') {
      startDate.setDate(now.getDate() - 6);
    } else if (chartFilter === '30d') {
      startDate.setDate(now.getDate() - 29);
    } else if (chartFilter === '90d') {
      startDate.setDate(now.getDate() - 89);
    } else if (chartFilter === 'month') {
      const [y, m] = currentMonthStr.split('-');
      startDate = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    } else if (chartFilter === 'year') {
      const y = now.getFullYear();
      startDate = new Date(y, 0, 1);
    }

    // Map daily earnings
    const dailyMap: Record<string, number> = {};
    earnings.forEach((e) => {
      const val = Number(e.valor) || 0;
      dailyMap[e.data] = (dailyMap[e.data] || 0) + val;
    });

    const result: { data: string; label: string; valor: number }[] = [];
    const cur = new Date(startDate);
    while (cur <= now) {
      const dStr = cur.toISOString().split('T')[0];
      const parts = dStr.split('-');
      const label = `${parts[2]}/${parts[1]}`;
      result.push({
        data: dStr,
        label,
        valor: dailyMap[dStr] || 0,
      });
      cur.setDate(cur.getDate() + 1);
    }

    return result;
  }, [earnings, chartFilter, currentMonthStr]);

  // Revenue by Source Data
  const sourcesData = useMemo(() => {
    if (earnings.length === 0) return [];

    const map: Record<string, number> = {};
    earnings.forEach((e) => {
      const src = e.fonte_receita || 'Outros';
      map[src] = (map[src] || 0) + Number(e.valor || 0);
    });

    return Object.entries(map)
      .map(([name, valor]) => ({ name, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [earnings]);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

  const hasAnyEarnings = earnings.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Main Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        {/* 1. Faturamento Hoje */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Faturamento Hoje
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              {formatCurrency(metrics.faturamentoHoje)}
            </span>
          </div>
        </div>

        {/* 2. Faturamento Ontem */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Faturamento Ontem
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-bold text-neutral-700 tracking-tight">
              {formatCurrency(metrics.faturamentoOntem)}
            </span>
          </div>
        </div>

        {/* 3. Variação Hoje x Ontem */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Variação Hoje x Ontem
          </span>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span
              className={`text-lg sm:text-xl font-bold tracking-tight ${
                metrics.variacaoHojeOntemReais > 0
                  ? 'text-emerald-600'
                  : metrics.variacaoHojeOntemReais < 0
                  ? 'text-rose-600'
                  : 'text-neutral-700'
              }`}
            >
              {metrics.variacaoHojeOntemReais > 0 ? '+' : ''}
              {formatCurrency(metrics.variacaoHojeOntemReais)}
            </span>
            <span
              className={`text-xs font-semibold ${
                metrics.variacaoHojeOntemReais > 0
                  ? 'text-emerald-600'
                  : metrics.variacaoHojeOntemReais < 0
                  ? 'text-rose-600'
                  : 'text-neutral-400'
              }`}
            >
              {metrics.variacaoHojeOntemPercentual !== null
                ? formatPercent(metrics.variacaoHojeOntemPercentual)
                : '0%'}
            </span>
          </div>
        </div>

        {/* 4. Faturamento do Mês */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Faturamento do Mês
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              {formatCurrency(metrics.faturamentoMes)}
            </span>
          </div>
        </div>

        {/* 5. Mês Anterior */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Mês Anterior
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-bold text-neutral-600 tracking-tight">
              {formatCurrency(metrics.faturamentoMesAnterior)}
            </span>
          </div>
        </div>

        {/* 6. Despesas */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Despesas do Mês
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-bold text-rose-600 tracking-tight">
              {formatCurrency(metrics.despesasMes)}
            </span>
          </div>
        </div>

        {/* 7. Lucro Líquido */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Lucro Líquido
          </span>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span
              className={`text-lg sm:text-xl font-bold tracking-tight ${
                metrics.lucroLiquidoMes >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(metrics.lucroLiquidoMes)}
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">
              ({metrics.margemLiquidaMes.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Highlights Section: Hoje x Ontem, Hoje x Média Diária, Comparativo Mensal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Destaque 1: Hoje x Ontem */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Hoje x Ontem
            </span>
            <div className="p-1.5 rounded-lg bg-neutral-50 text-neutral-600">
              {metrics.variacaoHojeOntemReais > 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : metrics.variacaoHojeOntemReais < 0 ? (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              ) : (
                <Minus className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </div>

          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Hoje</span>
              <span className="font-semibold text-neutral-900">
                {formatCurrency(metrics.faturamentoHoje)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Ontem</span>
              <span className="font-semibold text-neutral-700">
                {formatCurrency(metrics.faturamentoOntem)}
              </span>
            </div>
            <div className="pt-2 border-t border-dashed border-neutral-200 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">Resultado</span>
              <div className="text-right">
                <div
                  className={`text-sm font-bold ${
                    metrics.variacaoHojeOntemReais > 0
                      ? 'text-emerald-600'
                      : metrics.variacaoHojeOntemReais < 0
                      ? 'text-rose-600'
                      : 'text-neutral-700'
                  }`}
                >
                  {metrics.variacaoHojeOntemReais > 0 ? '+' : ''}
                  {formatCurrency(metrics.variacaoHojeOntemReais)}{' '}
                  {metrics.variacaoHojeOntemPercentual !== null && (
                    <span className="text-xs">
                      ({formatPercent(metrics.variacaoHojeOntemPercentual)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] font-medium text-neutral-500 italic">
            "{metrics.mensagemHojeOntem}"
          </div>
        </div>

        {/* Destaque 2: Hoje x Média Diária */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Hoje x Média Diária
            </span>
            <div className="p-1.5 rounded-lg bg-neutral-50 text-neutral-600">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>

          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Hoje</span>
              <span className="font-semibold text-neutral-900">
                {formatCurrency(metrics.faturamentoHoje)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Média diária ({currentMonthName})</span>
              <span className="font-semibold text-neutral-700">
                {formatCurrency(metrics.mediaDiariaMes)}
              </span>
            </div>
            <div className="pt-2 border-t border-dashed border-neutral-200 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">Diferença</span>
              <div className="text-right">
                <div
                  className={`text-sm font-bold ${
                    metrics.diferencaHojeMediaDiaria > 0
                      ? 'text-emerald-600'
                      : metrics.diferencaHojeMediaDiaria < 0
                      ? 'text-rose-600'
                      : 'text-neutral-700'
                  }`}
                >
                  {metrics.diferencaHojeMediaDiaria > 0 ? '+' : ''}
                  {formatCurrency(metrics.diferencaHojeMediaDiaria)}{' '}
                  {metrics.percentualHojeMediaDiaria !== null && (
                    <span className="text-xs">
                      ({formatPercent(metrics.percentualHojeMediaDiaria)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] font-medium text-neutral-500">
            Baseado nos dias decorridos deste mês ({currentMonthName}).
          </div>
        </div>

        {/* Destaque 3: Comparativo Mensal */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Comparativo Mensal
            </span>
            <div className="p-1.5 rounded-lg bg-neutral-50 text-neutral-600">
              <BarChart className="w-4 h-4 text-purple-600" />
            </div>
          </div>

          <div className="py-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">{currentMonthName} (atual)</span>
              <span className="font-semibold text-neutral-900">
                {formatCurrency(metrics.faturamentoMes)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">{prevMonthName} (anterior)</span>
              <span className="font-semibold text-neutral-700">
                {formatCurrency(metrics.faturamentoMesAnterior)}
              </span>
            </div>
            <div className="pt-2 border-t border-dashed border-neutral-200 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">Diferença</span>
              <div className="text-right">
                <div
                  className={`text-sm font-bold ${
                    metrics.variacaoMesReais > 0
                      ? 'text-emerald-600'
                      : metrics.variacaoMesReais < 0
                      ? 'text-rose-600'
                      : 'text-neutral-700'
                  }`}
                >
                  {metrics.variacaoMesReais > 0 ? '+' : ''}
                  {formatCurrency(metrics.variacaoMesReais)}{' '}
                  {metrics.variacaoMesPercentual !== null && (
                    <span className="text-xs">
                      ({formatPercent(metrics.variacaoMesPercentual)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] font-medium text-neutral-500">
            Evolução comparativa entre {currentMonthName} e {prevMonthName}.
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: Daily Revenue Evolution */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                Evolução Diária do Faturamento
              </h3>
              <p className="text-xs text-neutral-500">
                Acompanhe o faturamento dia a dia no período selecionado
              </p>
            </div>

            {/* Period Filters */}
            <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 text-xs">
              {(
                [
                  { id: '7d', label: '7 dias' },
                  { id: '30d', label: '30 dias' },
                  { id: '90d', label: '90 dias' },
                  { id: 'month', label: 'Este mês' },
                  { id: 'year', label: 'Este ano' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setChartFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    chartFilter === f.id
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {!hasAnyEarnings ? (
            <div className="py-16 text-center">
              <p className="text-sm font-semibold text-neutral-700">
                Ainda não existem ganhos registrados.
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                Registre seu primeiro ganho para visualizar a evolução do seu faturamento em gráfico.
              </p>
              <button
                type="button"
                onClick={onOpenNewEarning}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar ganho
              </button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$ ${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Faturamento']}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorValor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue by Source Chart */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              Faturamento por Fonte
            </h3>
            <p className="text-xs text-neutral-500">
              Distribuição real de receita pelas fontes cadastradas
            </p>
          </div>

          {!hasAnyEarnings || sourcesData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-xs text-neutral-400">Nenhuma receita registrada ainda.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourcesData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      formatter={(v: any) => [formatCurrency(Number(v)), 'Total']}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                        border: 'none',
                      }}
                    />
                    <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                      {sourcesData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Source breakdown list */}
              <div className="pt-3 border-t border-neutral-100 space-y-1.5">
                {sourcesData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-neutral-600 truncate max-w-[130px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(item.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
