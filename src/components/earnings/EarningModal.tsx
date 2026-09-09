import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Earning, RevenueSource } from '../../types';
import { getTodaySP, getCurrentTimeSP } from '../../utils/dateUtils';
import { X, DollarSign, Calendar, Clock, FileText, Layers, Bookmark } from 'lucide-react';

interface EarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  earningToEdit?: Earning | null;
  onSuccess?: (msg: string) => void;
}

const DEFAULT_SOURCES: RevenueSource[] = [
  'Shopee Afiliados',
  'E-books',
  'Monetização de conteúdo',
  'Afiliados',
  'Publicidade',
  'Produtos próprios',
  'Outros',
];

export const EarningModal: React.FC<EarningModalProps> = ({
  isOpen,
  onClose,
  earningToEdit,
  onSuccess,
}) => {
  const { pages, createEarning, updateEarning } = useData();

  const [origem, setOrigem] = useState<'geral' | 'especifica'>('geral');
  const [pageId, setPageId] = useState<string>('');
  const [fonteReceita, setFonteReceita] = useState<string>('Shopee Afiliados');
  const [valor, setValor] = useState<string>('');
  const [data, setData] = useState<string>(getTodaySP());
  const [horario, setHorario] = useState<string>(getCurrentTimeSP());
  const [descricao, setDescricao] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (earningToEdit) {
      setOrigem(earningToEdit.origem);
      setPageId(earningToEdit.page_id || '');
      setFonteReceita(earningToEdit.fonte_receita);
      setValor(String(earningToEdit.valor));
      setData(earningToEdit.data);
      setHorario(earningToEdit.horario || '');
      setDescricao(earningToEdit.descricao || '');
    } else {
      setOrigem('geral');
      setPageId('');
      setFonteReceita('Shopee Afiliados');
      setValor('');
      setData(getTodaySP());
      setHorario(getCurrentTimeSP());
      setDescricao('');
    }
    setError(null);
  }, [earningToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numValor = parseFloat(valor.replace(',', '.'));
    if (isNaN(numValor) || numValor <= 0) {
      setError('O valor do ganho deve ser maior que zero (R$ 0,00).');
      return;
    }

    if (!data) {
      setError('A data do ganho é obrigatória.');
      return;
    }

    if (!fonteReceita) {
      setError('Selecione uma fonte de receita.');
      return;
    }

    if (origem === 'especifica' && !pageId) {
      setError('Selecione a página para este ganho específico.');
      return;
    }

    setSaving(true);

    if (earningToEdit) {
      const res = await updateEarning(earningToEdit.id, {
        origem,
        page_id: origem === 'geral' ? null : pageId,
        fonte_receita: fonteReceita,
        valor: numValor,
        data,
        horario: horario || null,
        descricao: descricao.trim() || null,
      });
      setSaving(false);
      if (res.success) {
        onSuccess?.('Ganho atualizado com sucesso.');
        onClose();
      } else {
        setError(res.error || 'Não foi possível atualizar o ganho. Tente novamente.');
      }
    } else {
      const res = await createEarning({
        origem,
        page_id: origem === 'geral' ? null : pageId,
        fonte_receita: fonteReceita,
        valor: numValor,
        data,
        horario: horario || null,
        descricao: descricao.trim() || null,
      });
      setSaving(false);
      if (res.success) {
        onSuccess?.('Ganho registrado com sucesso.');
        onClose();
      } else {
        setError(res.error || 'Não foi possível salvar o ganho. Tente novamente.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-neutral-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              {earningToEdit ? 'Editar Ganho' : '+ Novo Ganho'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Lançamento de receita e faturamento no PageMoney
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
          {/* 1. Origem do Ganho - Regra Principal */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-2">
              Origem do ganho <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setOrigem('geral');
                  setPageId('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  origem === 'geral'
                    ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Geral — Todas as páginas
              </button>

              <button
                type="button"
                onClick={() => setOrigem('especifica')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  origem === 'especifica'
                    ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Página específica
              </button>
            </div>
            {origem === 'geral' && (
              <p className="text-[11px] text-neutral-500 mt-1.5 pl-0.5">
                Ganhos gerais não pertencem a uma página individual (ex: Shopee, afiliados gerais).
              </p>
            )}
          </div>

          {/* 2. Selecione a página (somente quando página específica) */}
          {origem === 'especifica' && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Selecione a página <span className="text-rose-500">*</span>
              </label>
              {pages.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
                  Nenhuma página cadastrada ainda. Cadastre primeiro em "Minhas Páginas" ou lance como ganho Geral.
                </div>
              ) : (
                <select
                  required
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
                >
                  <option value="">-- Escolha uma página --</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.plataforma})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 3. Fonte de receita */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Fonte de receita <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={fonteReceita}
              onChange={(e) => setFonteReceita(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
            >
              {DEFAULT_SOURCES.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Valor (R$) */}
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

          {/* 5. Data & Horário */}
          <div className="grid grid-cols-2 gap-3">
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
                Horário (opcional)
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 6. Descrição */}
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
                placeholder="Ex: Comissões semanais Shopee, venda de infoproduto..."
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
                'Salvar ganho'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
