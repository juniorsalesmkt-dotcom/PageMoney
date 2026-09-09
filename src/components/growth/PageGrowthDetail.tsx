import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { ContentPage } from '../../types';
import { calculatePageGrowth } from '../../utils/calcUtils';
import {
  formatDateBR,
  formatFollowerCount,
  formatPercent,
} from '../../utils/dateUtils';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  Award,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface PageGrowthDetailProps {
  page: ContentPage;
  onBack: () => void;
  onOpenFollowerModal: (pageId: string) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

type FollowerChartFilter = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

export const PageGrowthDetail: React.FC<PageGrowthDetailProps> = ({
  page,
  onBack,
  onOpenFollowerModal,
  onToast,
}) => {
  const { followerHistory, deleteFollowerRecord } = useData();
  const { isDark } = useTheme();
  const [chartFilter, setChartFilter] = useState<FollowerChartFilter>('30d');

  const isYouTube = page.plataforma === 'YouTube';
  const term = isYouTube ? 'inscritos' : 'seguidores';
  const termCap = isYouTube ? 'Inscritos' : 'Seguidores';

  const stats = useMemo(() => {
    return calculatePageGrowth(page.id, followerHistory);
  }, [page.id, followerHistory]);

  // Filtered chart data
  const chartData = useMemo(() => {
    if (stats.historicoOrdenado.length === 0) return [];

    const now = new Date();
    let minDate = new Date();

    if (chartFilter === '7d') {
      minDate.setDate(now.getDate() - 7);
    } else if (chartFilter === '30d') {
      minDate.setDate(now.getDate() - 30);
    } else if (chartFilter === '90d') {
      minDate.setDate(now.getDate() - 90);
    } else if (chartFilter === '6m') {
      minDate.setMonth(now.getMonth() - 6);
    } else if (chartFilter === '1y') {
      minDate.setFullYear(now.getFullYear() - 1);
    } else {
      minDate = new Date(0); // all
    }

    const minDateStr = minDate.toISOString().split('T')[0];

    return stats.historicoOrdenado
      .filter((r) => r.data >= minDateStr)
      .map((r) => {
        const parts = r.data.split('-');
        return {
          data: r.data,
          label: `${parts[2]}/${parts[1]}`,
          seguidores: Number(r.quantidade_seguidores),
        };
      });
  }, [stats.historicoOrdenado, chartFilter]);

  const handleDeleteRecord = async (recordId: string, recordDate: string) => {
    if (window.confirm(`Deseja excluir o registro de ${formatDateBR(recordDate)}?`)) {
      const res = await deleteFollowerRecord(recordId);
      if (res.success) {
        onToast('Registro excluído com sucesso.');
      } else {
        onToast(res.error || 'Erro ao excluir registro.', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
                {page.nome}
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                {page.plataforma}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Análise e evolução detalhada de audiência
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenFollowerModal(page.id)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition shadow-xs active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Registrar {termCap}
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Atual */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {termCap} Atuais
          </span>
          <div className="mt-2 text-xl font-bold text-neutral-900">
            {formatFollowerCount(stats.seguidoresAtuais)}
          </div>
        </div>

        {/* Crescimento Hoje */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Crescimento Hoje
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold ${
                stats.crescimentoHojeAbsoluto >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {stats.crescimentoHojeAbsoluto > 0 ? '+' : ''}
              {formatFollowerCount(stats.crescimentoHojeAbsoluto)}
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              ({formatPercent(stats.crescimentoHojePercentual)})
            </span>
          </div>
        </div>

        {/* Últimos 7 dias */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Últimos 7 dias
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold ${
                stats.crescimento7DiasAbsoluto >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {stats.crescimento7DiasAbsoluto > 0 ? '+' : ''}
              {formatFollowerCount(stats.crescimento7DiasAbsoluto)}
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              ({formatPercent(stats.crescimento7DiasPercentual)})
            </span>
          </div>
        </div>

        {/* Últimos 30 dias */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Últimos 30 dias
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold ${
                stats.crescimento30DiasAbsoluto >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {stats.crescimento30DiasAbsoluto > 0 ? '+' : ''}
              {formatFollowerCount(stats.crescimento30DiasAbsoluto)}
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              ({formatPercent(stats.crescimento30DiasPercentual)})
            </span>
          </div>
        </div>

        {/* No Ano */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            No Ano
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold ${
                stats.crescimentoAnoAbsoluto >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {stats.crescimentoAnoAbsoluto > 0 ? '+' : ''}
              {formatFollowerCount(stats.crescimentoAnoAbsoluto)}
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              ({formatPercent(stats.crescimentoAnoPercentual)})
            </span>
          </div>
        </div>

        {/* Média Diária */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Média Diária
          </span>
          <div className="mt-2 text-xl font-bold text-neutral-900">
            {stats.mediaDiaria > 0 ? '+' : ''}
            {formatFollowerCount(stats.mediaDiaria)} / dia
          </div>
        </div>
      </div>

      {/* Best Day and Worst Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-500 block">Melhor Dia</span>
              <span className="text-sm font-bold text-neutral-900">
                {stats.melhorDia ? formatDateBR(stats.melhorDia.data) : 'Nenhum registro'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-bold text-emerald-600 block">
              {stats.melhorDia && stats.melhorDia.ganho > 0 ? '+' : ''}
              {stats.melhorDia ? formatFollowerCount(stats.melhorDia.ganho) : 0} {term}
            </span>
            <span className="text-[11px] text-neutral-400">Maior salto diário</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-500 block">Pior Dia</span>
              <span className="text-sm font-bold text-neutral-900">
                {stats.piorDia ? formatDateBR(stats.piorDia.data) : 'Nenhum registro'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`text-base font-bold block ${
                stats.piorDia && stats.piorDia.ganho < 0 ? 'text-rose-600' : 'text-neutral-700'
              }`}
            >
              {stats.piorDia && stats.piorDia.ganho > 0 ? '+' : ''}
              {stats.piorDia ? formatFollowerCount(stats.piorDia.ganho) : 0} {term}
            </span>
            <span className="text-[11px] text-neutral-400">Menor variação diária</span>
          </div>
        </div>
      </div>

      {/* Historical Line Chart */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              Evolução Histórica de {termCap}
            </h3>
            <p className="text-xs text-neutral-500">
              Curva real de crescimento da página baseada nos registros diários
            </p>
          </div>

          <div className="inline-flex rounded-lg border border-neutral-200 dark:border-[#262c38] p-0.5 bg-neutral-50 dark:bg-[#12151b] text-xs">
            {(
              [
                { id: '7d', label: '7 dias' },
                { id: '30d', label: '30 dias' },
                { id: '90d', label: '90 dias' },
                { id: '6m', label: '6 meses' },
                { id: '1y', label: '1 ano' },
                { id: 'all', label: 'Todos' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setChartFilter(f.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  chartFilter === f.id
                    ? 'bg-white dark:bg-[#1c2028] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Ainda não existem registros de {term} para esta página.
            </p>
            <button
              type="button"
              onClick={() => onOpenFollowerModal(page.id)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-neutral-950 bg-neutral-900 dark:bg-white rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar {termCap}
            </button>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262c38' : '#f1f5f9'} />
                <XAxis
                  dataKey="label"
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatFollowerCount(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#15181e' : '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: isDark ? '1px solid #262c38' : 'none',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  formatter={(val: any) => [formatFollowerCount(Number(val)), termCap]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="seguidores"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Histórico de Lançamentos
            </h3>
            <p className="text-xs text-neutral-500">
              Todos os registros salvos para {page.nome}
            </p>
          </div>
          <span className="text-xs font-medium text-neutral-500">
            {stats.historicoOrdenado.length} registros
          </span>
        </div>

        {stats.historicoOrdenado.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            Nenhum registro histórico.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Total de {termCap}</th>
                  <th className="px-6 py-3">Crescimento</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {[...stats.historicoOrdenado].reverse().map((rec, idx, arr) => {
                  const prev = arr[idx + 1];
                  const diff = prev ? Number(rec.quantidade_seguidores) - Number(prev.quantidade_seguidores) : 0;
                  const pct = prev && Number(prev.quantidade_seguidores) > 0 ? (diff / Number(prev.quantidade_seguidores)) * 100 : 0;

                  return (
                    <tr key={rec.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-6 py-3 font-medium text-neutral-900">
                        {formatDateBR(rec.data)}
                      </td>
                      <td className="px-6 py-3 font-bold text-neutral-900">
                        {formatFollowerCount(rec.quantidade_seguidores)}
                      </td>
                      <td className="px-6 py-3">
                        {prev ? (
                          <span
                            className={`font-semibold ${
                              diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-neutral-500'
                            }`}
                          >
                            {diff > 0 ? '+' : ''}
                            {formatFollowerCount(diff)} ({formatPercent(pct)})
                          </span>
                        ) : (
                          <span className="text-neutral-400">Primeiro registro</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id, rec.data)}
                          className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                          title="Excluir este registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
