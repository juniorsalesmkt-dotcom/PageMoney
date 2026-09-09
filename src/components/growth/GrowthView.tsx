import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { ContentPage } from '../../types';
import { calculatePageGrowth } from '../../utils/calcUtils';
import { formatFollowerCount, formatPercent } from '../../utils/dateUtils';
import {
  TrendingUp,
  Plus,
  ArrowUpDown,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { PageGrowthDetail } from './PageGrowthDetail';

interface GrowthViewProps {
  onOpenRecordFollowers: (defaultPageId?: string) => void;
  onOpenNewPage: () => void;
  selectedPageId: string | null;
  setSelectedPageId: (id: string | null) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

type RankingSort = 'absolute' | 'percent' | 'daily_avg';

export const GrowthView: React.FC<GrowthViewProps> = ({
  onOpenRecordFollowers,
  onOpenNewPage,
  selectedPageId,
  setSelectedPageId,
  onToast,
}) => {
  const { pages, followerHistory } = useData();
  const [rankingSort, setRankingSort] = useState<RankingSort>('absolute');

  // If a specific page is selected for detail view, render PageGrowthDetail
  const activeDetailPage = useMemo(() => {
    if (!selectedPageId) return null;
    return pages.find((p) => p.id === selectedPageId) || null;
  }, [selectedPageId, pages]);

  // Calculate statistics for all pages
  const pagesStats = useMemo(() => {
    return pages.map((page) => {
      const stats = calculatePageGrowth(page.id, followerHistory);
      return {
        page,
        stats,
      };
    });
  }, [pages, followerHistory]);

  // Ranking calculation sorted by selected criteria
  const rankedPages = useMemo(() => {
    return [...pagesStats].sort((a, b) => {
      if (rankingSort === 'absolute') {
        return b.stats.crescimento30DiasAbsoluto - a.stats.crescimento30DiasAbsoluto;
      }
      if (rankingSort === 'percent') {
        return b.stats.crescimento30DiasPercentual - a.stats.crescimento30DiasPercentual;
      }
      return b.stats.mediaDiaria - a.stats.mediaDiaria;
    });
  }, [pagesStats, rankingSort]);

  if (activeDetailPage) {
    return (
      <PageGrowthDetail
        page={activeDetailPage}
        onBack={() => setSelectedPageId(null)}
        onOpenFollowerModal={(pageId) => onOpenRecordFollowers(pageId)}
        onToast={onToast}
      />
    );
  }

  const hasFollowerRecords = followerHistory.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
            Crescimento de Audiência
          </h2>
          <p className="text-xs text-neutral-500">
            Acompanhe o ganho de seguidores e inscritos das suas páginas de conteúdo
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pages.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenRecordFollowers()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Registrar Seguidores
            </button>
          )}
        </div>
      </div>

      {pages.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Você ainda não cadastrou nenhuma página."
          description="Cadastre suas páginas em 'Minhas Páginas' antes de acompanhar o crescimento de audiência."
          actionLabel="+ Adicionar página"
          onAction={onOpenNewPage}
        />
      ) : !hasFollowerRecords ? (
        <EmptyState
          icon={TrendingUp}
          title="Ainda não existem registros de seguidores."
          description="Registre a contagem atual de seguidores da sua página para iniciar o acompanhamento diário."
          actionLabel="+ Registrar seguidores"
          onAction={() => onOpenRecordFollowers()}
        />
      ) : (
        <>
          {/* Section 1: Ranking de Crescimento */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                    Páginas que mais cresceram
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Ranking de evolução de audiência (sem dados de faturamento)
                  </p>
                </div>
              </div>

              {/* Ranking sort tabs */}
              <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50 text-xs">
                {(
                  [
                    { id: 'absolute', label: 'Crescimento absoluto' },
                    { id: 'percent', label: 'Crescimento percentual' },
                    { id: 'daily_avg', label: 'Média diária' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setRankingSort(s.id)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      rankingSort === s.id
                        ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 divide-y divide-neutral-100">
              {rankedPages.map((item, index) => {
                const isYouTube = item.page.plataforma === 'YouTube';
                const term = isYouTube ? 'inscritos' : 'seguidores';

                let metricDisplay = '';
                if (rankingSort === 'absolute') {
                  metricDisplay = `${item.stats.crescimento30DiasAbsoluto >= 0 ? '+' : ''}${formatFollowerCount(
                    item.stats.crescimento30DiasAbsoluto
                  )} ${term} (30d)`;
                } else if (rankingSort === 'percent') {
                  metricDisplay = `${formatPercent(item.stats.crescimento30DiasPercentual)} (30d)`;
                } else {
                  metricDisplay = `${item.stats.mediaDiaria > 0 ? '+' : ''}${formatFollowerCount(
                    item.stats.mediaDiaria
                  )} / dia`;
                }

                return (
                  <div
                    key={item.page.id}
                    onClick={() => setSelectedPageId(item.page.id)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-neutral-50/80 rounded-xl transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-amber-100 text-amber-800'
                            : index === 1
                            ? 'bg-neutral-200 text-neutral-800'
                            : index === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'text-neutral-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900">
                            {item.page.nome}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                            {item.page.plataforma}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400">
                          {formatFollowerCount(item.stats.seguidoresAtuais)} {term} atuais
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600 font-mono">
                        {metricDisplay}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Cards com estatísticas de cada página */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
              Evolução por Página
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagesStats.map(({ page, stats }) => {
                const isYouTube = page.plataforma === 'YouTube';
                const termCap = isYouTube ? 'Inscritos' : 'Seguidores';

                return (
                  <div
                    key={page.id}
                    className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-5 flex flex-col justify-between hover:border-neutral-300 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-base font-bold text-neutral-900 leading-tight">
                            {page.nome}
                          </h4>
                          <span className="text-xs text-neutral-400 font-medium">
                            {page.plataforma} {page.username && `• ${page.username}`}
                          </span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                          {stats.totalRegistros} registros
                        </span>
                      </div>

                      {/* Total current */}
                      <div className="mt-4 p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500">
                          {termCap} Atuais
                        </span>
                        <span className="text-lg font-bold text-neutral-900">
                          {formatFollowerCount(stats.seguidoresAtuais)}
                        </span>
                      </div>

                      {/* Quick metrics grid */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg border border-neutral-100">
                          <span className="text-[11px] text-neutral-400 block">Hoje</span>
                          <span
                            className={`font-bold ${
                              stats.crescimentoHojeAbsoluto >= 0
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {stats.crescimentoHojeAbsoluto > 0 ? '+' : ''}
                            {formatFollowerCount(stats.crescimentoHojeAbsoluto)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg border border-neutral-100">
                          <span className="text-[11px] text-neutral-400 block">30 dias</span>
                          <span
                            className={`font-bold ${
                              stats.crescimento30DiasAbsoluto >= 0
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {stats.crescimento30DiasAbsoluto > 0 ? '+' : ''}
                            {formatFollowerCount(stats.crescimento30DiasAbsoluto)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onOpenRecordFollowers(page.id)}
                        className="text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition"
                      >
                        + Registrar
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPageId(page.id)}
                        className="text-xs font-semibold text-neutral-900 hover:text-black flex items-center gap-1 hover:underline"
                      >
                        Ver detalhes
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
