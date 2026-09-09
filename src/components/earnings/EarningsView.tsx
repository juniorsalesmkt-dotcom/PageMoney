import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Earning, RevenueSource } from '../../types';
import {
  formatCurrency,
  formatDateBR,
  getTodaySP,
  getYesterdaySP,
  getCurrentMonthSP,
  getPreviousMonthSP,
} from '../../utils/dateUtils';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Layers,
  Bookmark,
  Calendar,
  DollarSign,
  Download,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { EarningModal } from './EarningModal';

interface EarningsViewProps {
  onOpenNewEarning: () => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

type PeriodFilter = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'prev_month' | 'custom';

export const EarningsView: React.FC<EarningsViewProps> = ({ onOpenNewEarning, onToast }) => {
  const { earnings, pages, deleteEarning } = useData();

  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState<string>('all');
  const [searchDesc, setSearchDesc] = useState<string>('');

  const [editingEarning, setEditingEarning] = useState<Earning | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered earnings list
  const filteredEarnings = useMemo(() => {
    const today = getTodaySP();
    const yesterday = getYesterdaySP();
    const curMonth = getCurrentMonthSP();
    const prevMonth = getPreviousMonthSP();

    return earnings.filter((item) => {
      // Period filter
      if (period === 'today' && item.data !== today) return false;
      if (period === 'yesterday' && item.data !== yesterday) return false;
      if (period === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const minStr = d.toISOString().split('T')[0];
        if (item.data < minStr) return false;
      }
      if (period === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        const minStr = d.toISOString().split('T')[0];
        if (item.data < minStr) return false;
      }
      if (period === 'month' && !item.data.startsWith(curMonth)) return false;
      if (period === 'prev_month' && !item.data.startsWith(prevMonth)) return false;
      if (period === 'custom') {
        if (customStart && item.data < customStart) return false;
        if (customEnd && item.data > customEnd) return false;
      }

      // Page filter: 'all', 'geral', or specific page ID
      if (selectedPageFilter === 'geral' && item.origem !== 'geral') return false;
      if (
        selectedPageFilter !== 'all' &&
        selectedPageFilter !== 'geral' &&
        item.page_id !== selectedPageFilter
      ) {
        return false;
      }

      // Source filter
      if (selectedSourceFilter !== 'all' && item.fonte_receita !== selectedSourceFilter) {
        return false;
      }

      // Currency filter
      if (selectedCurrencyFilter !== 'all') {
        const itemMoeda = item.moeda || 'BRL';
        if (itemMoeda !== selectedCurrencyFilter) return false;
      }

      // Description search
      if (searchDesc.trim()) {
        const query = searchDesc.toLowerCase();
        const descMatch = (item.descricao || '').toLowerCase().includes(query);
        const srcMatch = item.fonte_receita.toLowerCase().includes(query);
        if (!descMatch && !srcMatch) return false;
      }

      return true;
    });
  }, [
    earnings,
    period,
    customStart,
    customEnd,
    selectedPageFilter,
    selectedSourceFilter,
    selectedCurrencyFilter,
    searchDesc,
  ]);

  // Total filtered
  const totalFiltered = useMemo(() => {
    return filteredEarnings.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  }, [filteredEarnings]);

  const handleDelete = async (earning: Earning) => {
    if (
      window.confirm(
        `Excluir o lançamento de ${formatCurrency(earning.valor)} do dia ${formatDateBR(earning.data)}?`
      )
    ) {
      setDeletingId(earning.id);
      const res = await deleteEarning(earning.id);
      setDeletingId(null);
      if (res.success) {
        onToast('Ganho excluído com sucesso.');
      } else {
        onToast(res.error || 'Erro ao excluir ganho.', 'error');
      }
    }
  };

  const getPageName = (pageId?: string | null): string => {
    if (!pageId) return 'Geral';
    const found = pages.find((p) => p.id === pageId);
    return found ? `${found.nome} (${found.plataforma})` : 'Página removida';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Lançamentos de Receita
          </h2>
          <p className="text-xs text-neutral-500">
            Controle de todos os ganhos gerais e específicos por página
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewEarning}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition shadow-xs active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Novo Ganho
        </button>
      </div>

      {/* Dynamic Summary Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Total dos Lançamentos Filtrados
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {formatCurrency(totalFiltered)}
            </span>
            <span className="text-xs font-medium text-neutral-500">
              ({filteredEarnings.length} {filteredEarnings.length === 1 ? 'registro' : 'registros'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            Filtre por período, página ou fonte abaixo para detalhar.
          </span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Period Select */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-600 mb-1">
              Período
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="block w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
            >
              <option value="all">Todo o período</option>
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="month">Mês atual</option>
              <option value="prev_month">Mês anterior</option>
              <option value="custom">Personalizado...</option>
            </select>
          </div>

          {/* Page Select */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-600 mb-1">
              Página / Origem
            </label>
            <select
              value={selectedPageFilter}
              onChange={(e) => setSelectedPageFilter(e.target.value)}
              className="block w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
            >
              <option value="all">Todas as páginas e gerais</option>
              <option value="geral">Geral — Sem página específica</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.plataforma})
                </option>
              ))}
            </select>
          </div>

          {/* Source Select */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-600 mb-1">
              Fonte de Receita
            </label>
            <select
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
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

          {/* Currency Select */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-600 mb-1">
              Moeda
            </label>
            <select
              value={selectedCurrencyFilter}
              onChange={(e) => setSelectedCurrencyFilter(e.target.value)}
              className="block w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
            >
              <option value="all">Todas as moedas</option>
              <option value="BRL">Apenas Real (BRL)</option>
              <option value="USD">Apenas Dólar (USD)</option>
            </select>
          </div>

          {/* Text Search */}
          <div>
            <label className="block text-[11px] font-medium text-neutral-600 mb-1">
              Buscar na descrição
            </label>
            <div className="relative rounded-lg">
              <input
                type="text"
                value={searchDesc}
                onChange={(e) => setSearchDesc(e.target.value)}
                placeholder="Ex: comissão, ebook..."
                className="block w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Custom date range if selected */}
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

      {/* Earnings Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {filteredEarnings.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhum lançamento encontrado."
            description={
              earnings.length === 0
                ? 'Você ainda não registrou nenhum faturamento. Registre seu primeiro ganho no PageMoney.'
                : 'Nenhum resultado corresponde aos filtros selecionados acima.'
            }
            actionLabel={earnings.length === 0 ? '+ Novo Ganho' : undefined}
            onAction={earnings.length === 0 ? onOpenNewEarning : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-3.5">Data / Horário</th>
                  <th className="px-6 py-3.5">Origem</th>
                  <th className="px-6 py-3.5">Fonte de Receita</th>
                  <th className="px-6 py-3.5">Descrição</th>
                  <th className="px-6 py-3.5">Valor</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredEarnings.map((item) => {
                  const isGeral = item.origem === 'geral' || !item.page_id;
                  const pageName = getPageName(item.page_id);

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-neutral-900 block">
                          {formatDateBR(item.data)}
                        </span>
                        {item.horario && (
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {item.horario}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {isGeral ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                            <Layers className="w-3 h-3" />
                            Geral (Todas)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                            <Bookmark className="w-3 h-3" />
                            {pageName}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap font-medium text-neutral-800">
                        {item.fonte_receita}
                      </td>

                      <td className="px-6 py-3.5 max-w-xs truncate text-neutral-500">
                        {item.descricao || '—'}
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-600 text-sm">
                            {formatCurrency(item.valor_brl ?? item.valor)}
                          </span>
                          {item.moeda === 'USD' && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                USD
                              </span>
                              <span className="text-[11px] text-neutral-600 font-medium">
                                ${(item.valor_original ?? 0).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              {item.cotacao_usd_brl && item.cotacao_usd_brl > 1 && (
                                <span
                                  className="text-[10px] text-neutral-400"
                                  title={`Cotação utilizada: 1 USD = R$ ${item.cotacao_usd_brl.toFixed(4)}`}
                                >
                                  (R$ {item.cotacao_usd_brl.toFixed(2)})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingEarning(item)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Editar ganho"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir ganho"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Earning Modal */}
      {editingEarning && (
        <EarningModal
          isOpen={Boolean(editingEarning)}
          onClose={() => setEditingEarning(null)}
          earningToEdit={editingEarning}
          onSuccess={(msg) => onToast(msg, 'success')}
        />
      )}
    </div>
  );
};
