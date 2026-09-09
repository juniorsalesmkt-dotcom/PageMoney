import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Expense } from '../../types';
import {
  formatCurrency,
  formatDateBR,
  formatPercent,
  getCurrentMonthSP,
} from '../../utils/dateUtils';
import {
  ArrowDownCircle,
  Plus,
  Trash2,
  Edit2,
  Tag,
  DollarSign,
  TrendingDown,
  Layers,
  Wallet,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { ExpenseModal } from './ExpenseModal';

interface ExpensesViewProps {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onToast }) => {
  const { expenses, pages, deleteExpense, metrics } = useData();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pageFilter, setPageFilter] = useState<string>('all');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      if (categoryFilter !== 'all' && item.categoria !== categoryFilter) return false;
      if (pageFilter === 'geral' && item.page_id !== null) return false;
      if (pageFilter !== 'all' && pageFilter !== 'geral' && item.page_id !== pageFilter)
        return false;
      return true;
    });
  }, [expenses, categoryFilter, pageFilter]);

  const totalFiltered = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
  }, [filteredExpenses]);

  const handleDelete = async (expense: Expense) => {
    if (
      window.confirm(
        `Deseja excluir a despesa de ${formatCurrency(expense.valor)} (${expense.categoria})?`
      )
    ) {
      setDeletingId(expense.id);
      const res = await deleteExpense(expense.id);
      setDeletingId(null);
      if (res.success) {
        onToast('Despesa excluída com sucesso.');
      } else {
        onToast(res.error || 'Erro ao excluir despesa.', 'error');
      }
    }
  };

  const getPageName = (pageId?: string | null): string => {
    if (!pageId) return 'Geral (Sem página)';
    const found = pages.find((p) => p.id === pageId);
    return found ? `${found.nome} (${found.plataforma})` : 'Página removida';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Despesas & Custos
          </h2>
          <p className="text-xs text-neutral-500">
            Controle de anúncios, ferramentas, freelancers e custos operacionais
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition shadow-xs active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nova Despesa
        </button>
      </div>

      {/* Financial Impact Cards: Despesas x Lucro Líquido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Despesas Mês */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Despesas do Mês Atual
          </span>
          <div className="mt-2 text-2xl font-bold text-rose-600 tracking-tight">
            {formatCurrency(metrics.despesasMes)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Custos operacionais computados no mês
          </p>
        </div>

        {/* Lucro Líquido Mês */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Lucro Líquido do Mês
          </span>
          <div
            className={`mt-2 text-2xl font-bold tracking-tight ${
              metrics.lucroLiquidoMes >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(metrics.lucroLiquidoMes)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Faturamento menos despesas do mês
          </p>
        </div>

        {/* Margem Líquida */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Margem Líquida
          </span>
          <div className="mt-2 text-2xl font-bold text-neutral-900 tracking-tight">
            {metrics.margemLiquidaMes.toFixed(1)}%
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Percentual do faturamento convertido em lucro
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">
            Categoria
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
          >
            <option value="all">Todas as categorias</option>
            <option value="Anúncios">Anúncios</option>
            <option value="Ferramentas">Ferramentas</option>
            <option value="Design">Design</option>
            <option value="Edição">Edição</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Domínio">Domínio</option>
            <option value="Hospedagem">Hospedagem</option>
            <option value="Outros">Outros</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-neutral-600 mb-1">
            Atribuído a
          </label>
          <select
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
            className="block w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
          >
            <option value="all">Todas as despesas</option>
            <option value="geral">Gerais (sem página)</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.plataforma})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={ArrowDownCircle}
            title="Nenhuma despesa registrada."
            description={
              expenses.length === 0
                ? 'Registre seus custos de produção, tráfego pago ou assinaturas para calcular o lucro líquido real.'
                : 'Nenhuma despesa corresponde aos filtros selecionados.'
            }
            actionLabel={expenses.length === 0 ? '+ Nova Despesa' : undefined}
            onAction={expenses.length === 0 ? () => setIsNewModalOpen(true) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-3.5">Data</th>
                  <th className="px-6 py-3.5">Categoria</th>
                  <th className="px-6 py-3.5">Atribuído a</th>
                  <th className="px-6 py-3.5">Descrição</th>
                  <th className="px-6 py-3.5">Valor</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap font-medium text-neutral-900">
                      {formatDateBR(item.data)}
                    </td>

                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                        <Tag className="w-3 h-3" />
                        {item.categoria}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 whitespace-nowrap text-neutral-600">
                      {getPageName(item.page_id)}
                    </td>

                    <td className="px-6 py-3.5 max-w-xs truncate text-neutral-500">
                      {item.descricao || '—'}
                    </td>

                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-rose-600 text-sm">
                        {formatCurrency(item.valor)}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingExpense(item)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Editar despesa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir despesa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New & Edit Modals */}
      {isNewModalOpen && (
        <ExpenseModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={(msg) => onToast(msg, 'success')}
        />
      )}

      {editingExpense && (
        <ExpenseModal
          isOpen={Boolean(editingExpense)}
          onClose={() => setEditingExpense(null)}
          expenseToEdit={editingExpense}
          onSuccess={(msg) => onToast(msg, 'success')}
        />
      )}
    </div>
  );
};
