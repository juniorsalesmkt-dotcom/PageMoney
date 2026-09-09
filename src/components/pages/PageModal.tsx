import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { ContentPage, PlatformType, PageStatus } from '../../types';
import { X, Globe, User, Tag, Link2, FileText, CheckCircle2 } from 'lucide-react';

interface PageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageToEdit?: ContentPage | null;
  onSuccess?: (msg: string) => void;
}

const PLATFORMS: PlatformType[] = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Outra'];
const STATUS_OPTIONS: PageStatus[] = ['Ativa', 'Pausada', 'Inativa'];

export const PageModal: React.FC<PageModalProps> = ({
  isOpen,
  onClose,
  pageToEdit,
  onSuccess,
}) => {
  const { createPage, updatePage } = useData();

  const [nome, setNome] = useState('');
  const [plataforma, setPlataforma] = useState<PlatformType>('Instagram');
  const [nicho, setNicho] = useState('');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<PageStatus>('Ativa');
  const [observacoes, setObservacoes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pageToEdit) {
      setNome(pageToEdit.nome);
      setPlataforma(pageToEdit.plataforma);
      setNicho(pageToEdit.nicho || '');
      setUsername(pageToEdit.username || '');
      setUrl(pageToEdit.url || '');
      setStatus(pageToEdit.status || 'Ativa');
      setObservacoes(pageToEdit.observacoes || '');
    } else {
      setNome('');
      setPlataforma('Instagram');
      setNicho('');
      setUsername('');
      setUrl('');
      setStatus('Ativa');
      setObservacoes('');
    }
    setError(null);
  }, [pageToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('O nome da página é obrigatório.');
      return;
    }

    setSaving(true);

    if (pageToEdit) {
      const res = await updatePage(pageToEdit.id, {
        nome: nome.trim(),
        plataforma,
        nicho: nicho.trim() || null,
        username: username.trim() || null,
        url: url.trim() || null,
        status,
        observacoes: observacoes.trim() || null,
      });
      setSaving(false);
      if (res.success) {
        onSuccess?.('Página atualizada com sucesso.');
        onClose();
      } else {
        setError(res.error || 'Não foi possível atualizar a página.');
      }
    } else {
      const res = await createPage({
        nome: nome.trim(),
        plataforma,
        nicho: nicho.trim() || null,
        username: username.trim() || null,
        url: url.trim() || null,
        status,
        observacoes: observacoes.trim() || null,
      });
      setSaving(false);
      if (res.success) {
        onSuccess?.('Página cadastrada com sucesso.');
        onClose();
      } else {
        setError(res.error || 'Não foi possível cadastrar a página.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-neutral-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              {pageToEdit ? 'Editar Página' : '+ Nova Página'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Cadastro e gerenciamento de canais e perfis de conteúdo
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
              Nome da página <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vidas em Cena, Culinária Fácil..."
              className="block w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Plataforma <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Globe className="w-4 h-4" />
                </div>
                <select
                  required
                  value={plataforma}
                  onChange={(e) => setPlataforma(e.target.value as PlatformType)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Status
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PageStatus)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden bg-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Nicho / Tema
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Tag className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nicho}
                  onChange={(e) => setNicho(e.target.value)}
                  placeholder="Ex: Entretenimento, Finanças..."
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                @ / Username
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@seuperfil"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              URL da Página
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Observações (opcional)
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute top-2.5 left-3 pointer-events-none text-neutral-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Estratégia de monetização, parcerias, notas..."
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
                'Salvar página'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
