import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Expense, ExpenseCategory } from '../../types';
import { getTodaySP } from '../../utils/dateUtils';
import { X, DollarSign, Calendar, Tag, FileText, Bookmark } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
  onSuccess?: (msg: string) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Anúncios',
  'Ferramentas',
  'Design',
  'Edição',
  'Freelancer',
  'Domínio',
  'Hospedagem',
  'Outros',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
  onSuccess,
}) => {
  const { pages, createExpense, updateExpense } = useData();

  const [categoria, setCategoria] = useState<string>('Anúncios');
  const [pageId, setPageId] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [data, setData] = useState<string>(getTodaySP());
  const [descricao, setDescricao] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setCategoria(expenseToEdit.categoria);
      setPageId(expenseToEdit.page_id || '');
      setValor(String(expenseToEdit.valor));
      setData(expenseToEdit.data);
      setDescricao(expenseToEdit.descricao || '');
    } else {
      setCategoria('Anúncios');
      setPageId('');
      setValor('');
      setData(getTodaySP());
      setDescricao('');
    }
    setError(null);
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numValor = parseFloat(valor.replace(',', '.'));
    if (isNaN(numValor) || numValor <= 0) {
      setError('O valor da despesa deve ser maior que zero (R$ 0,00).');
      return;
    }

    if (!data) {
      setError('A data da despesa é obrigatória.');
      return;
    }

    setSaving(true);

    if (expenseToEdit) {
      const res = await updateExpense(expenseToEdit.id, {
        categoria,
        page_id: pageId || null,
        valor: numValor,
        data,
        descricao: descricao.trim() || null,
      });
      setSaving(false);
      if (res.success) {
        onSuccess?.('Despesa atualizada com sucesso.');
        onClose();
      } else {
        setError(res.error || 'Não foi possível atualizar a despesa.');
      }
    } else {
      const res = await createExpense({
        categoria,
        page_id: pageId || null,
        valor: numValor,
        data,
        descricao: descricao.trim() || null,
      });
      setSaving(false);
      if (res.success) {
        if (res.savedLocally) {
          onSuccess?.('Despesa registrada com sucesso! (Armazenamento seguro)');
        } else {
          onSuccess?.('Despesa registrada com sucesso.');
        }
        onClose();
      } else {
        setError(res.error || 'Não foi possível salvar a despesa.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-neutral-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              {expenseToEdit ? 'Editar Despesa' : '+ Nova Despesa'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Registro de custos e gastos operacionais
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Categoria <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Tag className="w-4 h-4" />
              </div>
              <select
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Página (opcional)
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Bookmark className="w-4 h-4" />
              </div>
              <select
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
              >
                <option value="">Geral — Sem página específica</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.plataforma})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Valor (R$) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="block w-full pl-9 pr-3 py-2 text-sm font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Data <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Descrição (opcional)
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute top-2.5 left-3 pointer-events-none text-neutral-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                rows={2}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Anúncios Facebook Ads para crescimento..."
                className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden resize-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar despesa'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
