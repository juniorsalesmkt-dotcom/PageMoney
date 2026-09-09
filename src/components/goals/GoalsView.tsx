import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  formatCurrency,
  formatPercent,
  getCurrentMonthSP,
  getMonthName,
  getTodaySP,
} from '../../utils/dateUtils';
import { Target, CheckCircle2, AlertCircle, ArrowUpRight, Plus, Calendar } from 'lucide-react';

interface GoalsViewProps {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ onToast }) => {
  const { goals, setMonthlyGoal, metrics } = useData();

  const curMonth = getCurrentMonthSP();
  const curMonthName = getMonthName(curMonth);

  const [selectedMonth, setSelectedMonth] = useState<string>(curMonth);
  const [metaValorInput, setMetaValorInput] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Find goal for the current month
  const currentMonthGoal = useMemo(() => {
    return goals.find((g) => g.mes === curMonth);
  }, [goals, curMonth]);

  const targetAmount = currentMonthGoal ? Number(currentMonthGoal.meta_faturamento) : 0;
  const currentRevenue = metrics.faturamentoMes;
  const progressPct = targetAmount > 0 ? (currentRevenue / targetAmount) * 100 : 0;
  const remainingAmount = Math.max(0, targetAmount - currentRevenue);

  // Calculate remaining days in month
  const remainingDays = useMemo(() => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return Math.max(1, lastDayOfMonth - today.getDate());
  }, []);

  const dailyNeeded = remainingAmount > 0 ? remainingAmount / remainingDays : 0;

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(metaValorInput.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      onToast('Informe um valor de meta válido e maior que zero.', 'error');
      return;
    }

    setSaving(true);
    const res = await setMonthlyGoal(selectedMonth, val);
    setSaving(false);

    if (res.success) {
      onToast('Meta financeira salva com sucesso!');
      setMetaValorInput('');
    } else {
      onToast(res.error || 'Erro ao salvar meta.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Metas Financeiras
          </h2>
          <p className="text-xs text-neutral-500">
            Acompanhe o atingimento do seu objetivo de faturamento mensal
          </p>
        </div>
      </div>

      {/* Main Goal Card for Current Month */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Meta de Faturamento — {curMonthName}
            </span>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                {targetAmount > 0 ? formatCurrency(targetAmount) : 'Meta não definida'}
              </span>
              {targetAmount > 0 && (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    progressPct >= 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {progressPct >= 100 ? 'Meta Batida! 🎉' : `${progressPct.toFixed(1)}% atingido`}
                </span>
              )}
            </div>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-xs text-neutral-500 block">Faturado até agora</span>
            <span className="text-xl font-bold text-emerald-600">
              {formatCurrency(currentRevenue)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {targetAmount > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-neutral-600">
              <span>R$ 0,00</span>
              <span className="font-semibold text-neutral-900">
                {formatPercent(progressPct)} da meta
              </span>
              <span>{formatCurrency(targetAmount)}</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  progressPct >= 100 ? 'bg-emerald-500' : 'bg-neutral-900'
                }`}
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
          </div>
        )}

        {/* Breakdown Stats */}
        {targetAmount > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-xs text-neutral-500 block font-medium">
                {progressPct >= 100 ? 'Faturamento excedente' : 'Quanto falta para bater a meta'}
              </span>
              <span
                className={`text-lg font-bold ${
                  progressPct >= 100 ? 'text-emerald-600' : 'text-neutral-900'
                }`}
              >
                {progressPct >= 100
                  ? `+ ${formatCurrency(currentRevenue - targetAmount)}`
                  : formatCurrency(remainingAmount)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-xs text-neutral-500 block font-medium">
                Média diária necessária ({remainingDays} dias restantes)
              </span>
              <span className="text-lg font-bold text-neutral-900">
                {progressPct >= 100 ? 'R$ 0,00 (Meta atingida)' : `${formatCurrency(dailyNeeded)} / dia`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Set / Update Goal Form */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-6">
        <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
          Definir ou Atualizar Meta
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Defina o alvo financeiro para impulsionar a escala de receita das suas páginas
        </p>

        <form onSubmit={handleSaveGoal} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Mês de Referência
            </label>
            <input
              type="month"
              required
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Meta de Faturamento (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="Ex: 10000,00"
              value={metaValorInput}
              onChange={(e) => setMetaValorInput(e.target.value)}
              className="block w-full px-3 py-2 text-sm font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 px-4 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 active:scale-[0.98] transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? 'Salvando...' : 'Salvar Meta do Mês'}
            </button>
          </div>
        </form>
      </div>

      {/* Historical Goals Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-900">
            Histórico de Metas Cadastradas
          </h3>
          <p className="text-xs text-neutral-500">
            Registro de objetivos de faturamento passados e presentes
          </p>
        </div>

        {goals.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            Nenhuma meta cadastrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-3.5">Mês</th>
                  <th className="px-6 py-3.5">Meta Estipulada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {goals.map((g) => (
                  <tr key={g.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-neutral-900">
                      {getMonthName(g.mes)} ({g.mes})
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-neutral-900">
                      {formatCurrency(g.meta_faturamento)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
