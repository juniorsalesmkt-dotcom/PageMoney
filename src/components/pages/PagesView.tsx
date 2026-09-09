import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { ContentPage } from '../../types';
import { formatFollowerCount } from '../../utils/dateUtils';
import {
  Layers,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  TrendingUp,
  Globe,
  Tag,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { PageModal } from './PageModal';

interface PagesViewProps {
  onOpenNewPage: () => void;
  onSelectPageGrowth: (pageId: string) => void;
  onOpenFollowerModalForPage: (pageId: string) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const PagesView: React.FC<PagesViewProps> = ({
  onOpenNewPage,
  onSelectPageGrowth,
  onOpenFollowerModalForPage,
  onToast,
}) => {
  const { pages, deletePage, followerHistory } = useData();
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getLatestFollowers = (pageId: string): number => {
    const pageHistory = followerHistory
      .filter((f) => f.page_id === pageId)
      .sort((a, b) => a.data.localeCompare(b.data));
    if (pageHistory.length === 0) return 0;
    return pageHistory[pageHistory.length - 1].quantidade_seguidores;
  };

  const handleDelete = async (page: ContentPage) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a página "${page.nome}"? Os lançamentos associados se tornarão gerais.`
      )
    ) {
      setDeletingId(page.id);
      const res = await deletePage(page.id);
      setDeletingId(null);
      if (res.success) {
        onToast('Página excluída com sucesso.');
      } else {
        onToast(res.error || 'Erro ao excluir página.', 'error');
      }
    }
  };

  const platformBadge = (plataforma: string) => {
    const colors: Record<string, string> = {
      Instagram: 'bg-rose-50 text-rose-700 border-rose-200',
      TikTok: 'bg-neutral-900 text-white border-neutral-800',
      YouTube: 'bg-red-50 text-red-700 border-red-200',
      Facebook: 'bg-blue-50 text-blue-700 border-blue-200',
      Outra: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    };
    return (
      <span
        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
          colors[plataforma] || colors.Outra
        }`}
      >
        {plataforma}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Minhas Páginas
          </h2>
          <p className="text-xs text-neutral-500">
            Cadastre e gerencie suas páginas, canais e perfis sociais
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewPage}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition shadow-xs active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Nova Página
        </button>
      </div>

      {pages.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Você ainda não cadastrou nenhuma página."
          description="Cadastre sua primeira página ou canal para atribuir receitas e acompanhar o crescimento de seguidores."
          actionLabel="+ Adicionar página"
          onAction={onOpenNewPage}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => {
            const followers = getLatestFollowers(page.id);
            const isYouTube = page.plataforma === 'YouTube';
            const audienceTerm = isYouTube ? 'inscritos' : 'seguidores';

            return (
              <div
                key={page.id}
                className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-5 flex flex-col justify-between hover:border-neutral-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-neutral-900 leading-tight">
                          {page.nome}
                        </h3>
                        {platformBadge(page.plataforma)}
                      </div>
                      {page.username && (
                        <p className="text-xs text-neutral-500 font-mono">
                          {page.username}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        page.status === 'Ativa'
                          ? 'bg-emerald-50 text-emerald-700'
                          : page.status === 'Pausada'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {page.status}
                    </span>
                  </div>

                  {/* Niche & Details */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-neutral-400 block">Nicho</span>
                      <span className="font-medium text-neutral-700">
                        {page.nicho || 'Não especificado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400 block">Audiência Atual</span>
                      <span className="font-bold text-neutral-900">
                        {followers > 0
                          ? `${formatFollowerCount(followers)} ${audienceTerm}`
                          : `0 ${audienceTerm}`}
                      </span>
                    </div>
                  </div>

                  {page.observacoes && (
                    <p className="mt-3 text-xs text-neutral-500 line-clamp-2 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                      {page.observacoes}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {page.url && (
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Visitar página"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingPage(page)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                      title="Editar página"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === page.id}
                      onClick={() => handleDelete(page)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir página"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenFollowerModalForPage(page.id)}
                      className="text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      + {isYouTube ? 'Inscritos' : 'Seguidores'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPageGrowth(page.id)}
                      className="text-xs font-semibold text-neutral-900 hover:text-black flex items-center gap-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-2.5 py-1.5 rounded-lg transition"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      Ver Crescimento
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Page Modal */}
      {editingPage && (
        <PageModal
          isOpen={Boolean(editingPage)}
          onClose={() => setEditingPage(null)}
          pageToEdit={editingPage}
          onSuccess={(msg) => onToast(msg, 'success')}
        />
      )}
    </div>
  );
};
