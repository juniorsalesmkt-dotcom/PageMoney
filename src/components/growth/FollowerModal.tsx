import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { getTodaySP, formatFollowerCount } from '../../utils/dateUtils';
import { X, Users, Calendar, AlertCircle } from 'lucide-react';

interface FollowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPageId?: string;
  onSuccess?: (msg: string) => void;
}

export const FollowerModal: React.FC<FollowerModalProps> = ({
  isOpen,
  onClose,
  defaultPageId,
  onSuccess,
}) => {
  const { pages, followerHistory, recordFollowers } = useData();

  const [pageId, setPageId] = useState<string>('');
  const [data, setData] = useState<string>(getTodaySP());
  const [quantidade, setQuantidade] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultPageId) {
      setPageId(defaultPageId);
    } else if (pages.length > 0 && !pageId) {
      setPageId(pages[0].id);
    }
    setData(getTodaySP());
    setQuantidade('');
    setError(null);
  }, [isOpen, defaultPageId, pages]);

  if (!isOpen) return null;

  // Check if a record already exists for this page and date
  const existingRecord = followerHistory.find(
    (f) => f.page_id === pageId && f.data === data
  );

  const selectedPage = pages.find((p) => p.id === pageId);
  const isYouTube = selectedPage?.plataforma === 'YouTube';
  const labelTerm = isYouTube ? 'inscritos' : 'seguidores';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pageId) {
      setError('Selecione a página.');
      return;
    }

    const num = parseInt(quantidade.replace(/\D/g, ''), 10);
    if (isNaN(num) || num < 0) {
      setError(`Informe uma quantidade válida de ${labelTerm}.`);
      return;
    }

    setSaving(true);
    const res = await recordFollowers(pageId, data, num);
    setSaving(false);

    if (res.success) {
      if (res.updated) {
        onSuccess?.(`Registro de ${labelTerm} de ${data} atualizado com sucesso!`);
      } else {
        onSuccess?.(`Contagem de ${labelTerm} registrada com sucesso!`);
      }
      onClose();
    } else {
      setError(res.error || `Não foi possível registrar os ${labelTerm}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-neutral-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              Registrar {labelTerm.charAt(0).toUpperCase() + labelTerm.slice(1)}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Acompanhamento diário da audiência da página
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
              Página <span className="text-rose-500">*</span>
            </label>
            {pages.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
                Você ainda não cadastrou nenhuma página. Cadastre uma página antes de registrar seguidores.
              </div>
            ) : (
              <select
                required
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.plataforma})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Data do registro <span className="text-rose-500">*</span>
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
              Quantidade total de {labelTerm} <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Users className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Ex: 125400"
                className="block w-full pl-9 pr-3 py-2 text-sm font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Informe apenas o número total atual. O PageMoney calcula o crescimento automaticamente.
            </p>
          </div>

          {existingRecord && (
            <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Já existe registro nesta data</p>
                <p className="text-blue-700 mt-0.5">
                  Valor atual: {formatFollowerCount(existingRecord.quantidade_seguidores)} {labelTerm}. Ao salvar, ele será atualizado (sem duplicar).
                </p>
              </div>
            </div>
          )}

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
              disabled={saving || pages.length === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : existingRecord ? (
                'Atualizar registro'
              ) : (
                'Salvar seguidores'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
