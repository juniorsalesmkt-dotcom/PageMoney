import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Earning, RevenueSource, CurrencyType } from '../../types';
import { getTodaySP, getCurrentTimeSP, formatCurrency } from '../../utils/dateUtils';
import { fetchUsdBrlRate } from '../../services/currencyService';
import {
  X,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Layers,
  Bookmark,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

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
  const [fonteReceita, setFonteReceita] = useState<string>('Monetização de conteúdo');
  const [moeda, setMoeda] = useState<CurrencyType>('BRL');
  const [valor, setValor] = useState<string>('');
  const [data, setData] = useState<string>(getTodaySP());
  const [horario, setHorario] = useState<string>(getCurrentTimeSP());
  const [descricao, setDescricao] = useState<string>('');

  // Exchange rate states (for USD)
  const [cotacao, setCotacao] = useState<number | null>(null);
  const [cotacaoData, setCotacaoData] = useState<string | null>(null);
  const [cotacaoFonte, setCotacaoFonte] = useState<string>('');
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  const [rateError, setRateError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch exchange rate
  const loadRateForDate = useCallback(
    async (_targetDate?: string, force = false) => {
      setLoadingRate(true);
      setRateError(null);
      try {
        const result = await fetchUsdBrlRate({ forceRefresh: force });
        setCotacao(result.rate);
        setCotacaoData(result.updatedAt);
        setCotacaoFonte(result.source);
      } catch (err: any) {
        console.error('Failed to fetch USD rate:', err);
        setRateError(
          err.message ||
            'Não foi possível obter a cotação do dólar automaticamente. Verifique sua conexão e tente novamente.'
        );
      } finally {
        setLoadingRate(false);
      }
    },
    []
  );

  // Initial populate or reset
  useEffect(() => {
    if (earningToEdit) {
      setOrigem(earningToEdit.origem);
      setPageId(earningToEdit.page_id || '');
      setFonteReceita(earningToEdit.fonte_receita);
      const isUsd = earningToEdit.moeda === 'USD';
      setMoeda(isUsd ? 'USD' : 'BRL');
      setValor(
        isUsd && earningToEdit.valor_original
          ? String(earningToEdit.valor_original)
          : String(earningToEdit.valor)
      );
      setData(earningToEdit.data);
      setHorario(earningToEdit.horario || '');
      setDescricao(earningToEdit.descricao || '');

      if (isUsd && earningToEdit.cotacao_usd_brl) {
        setCotacao(earningToEdit.cotacao_usd_brl);
        setCotacaoData(earningToEdit.data_cotacao || earningToEdit.data);
        setCotacaoFonte('Cotação salva no lançamento');
      } else if (isUsd) {
        loadRateForDate(earningToEdit.data);
      }
    } else {
      setOrigem('geral');
      setPageId('');
      setFonteReceita('Monetização de conteúdo');
      setMoeda('BRL');
      setValor('');
      const today = getTodaySP();
      setData(today);
      setHorario(getCurrentTimeSP());
      setDescricao('');
      setCotacao(null);
      setCotacaoData(null);
      setCotacaoFonte('');
    }
    setError(null);
    setRateError(null);
  }, [earningToEdit, isOpen, loadRateForDate]);

  // When currency changes to USD, or date changes while in USD, fetch rate if not editing with historical rate
  const handleCurrencyChange = (newMoeda: CurrencyType) => {
    setMoeda(newMoeda);
    setError(null);
    if (newMoeda === 'USD' && !cotacao) {
      loadRateForDate(data);
    }
  };

  const handleDateChange = (newDate: string) => {
    setData(newDate);
    if (moeda === 'USD') {
      // If user changes date, fetch rate for that specific date
      loadRateForDate(newDate);
    }
  };

  if (!isOpen) return null;

  // Calculate converted BRL value
  const numValor = parseFloat(valor.replace(',', '.'));
  const valorOriginal = !isNaN(numValor) && numValor > 0 ? numValor : 0;
  const convertedBrl =
    moeda === 'USD' && cotacao && valorOriginal > 0
      ? Math.round(valorOriginal * cotacao * 100) / 100
      : valorOriginal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(numValor) || numValor <= 0) {
      setError(
        moeda === 'USD'
          ? 'O valor do ganho em dólar deve ser maior que zero ($ 0,00).'
          : 'O valor do ganho deve ser maior que zero (R$ 0,00).'
      );
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

    if (moeda === 'USD') {
      if (!cotacao || cotacao <= 0) {
        setError(
          'A cotação do dólar não foi obtida. Clique em "Atualizar Cotação" para obter a taxa comercial antes de salvar.'
        );
        return;
      }
    }

    setSaving(true);

    const earningPayload = {
      origem,
      page_id: origem === 'geral' ? null : pageId,
      fonte_receita: fonteReceita,
      moeda,
      valor_original: valorOriginal,
      cotacao_usd_brl: moeda === 'USD' ? cotacao! : 1.0,
      valor_brl: convertedBrl,
      data_cotacao: moeda === 'USD' ? cotacaoData || new Date().toISOString() : null,
      valor: convertedBrl, // Consolidated in BRL
      data,
      horario: horario || null,
      descricao: descricao.trim() || null,
    };

    if (earningToEdit) {
      const res = await updateEarning(earningToEdit.id, earningPayload);
      setSaving(false);
      if (res.success) {
        onSuccess?.('Ganho atualizado com sucesso.');
        onClose();
      } else {
        setError(res.error || 'Não foi possível atualizar o ganho. Tente novamente.');
      }
    } else {
      const res = await createEarning(earningPayload);
      setSaving(false);
      if (res.success) {
        if (res.savedLocally) {
          onSuccess?.('Ganho registrado com sucesso! (Armazenamento seguro)');
        } else {
          onSuccess?.('Ganho registrado com sucesso.');
        }
        onClose();
      } else {
        setError(res.error || 'Não foi possível salvar o ganho. Tente novamente.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-neutral-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              {earningToEdit ? 'Editar Ganho' : '+ Novo Ganho'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Lançamento de receita em Real (BRL) ou Dólar (USD)
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
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Origem do Ganho */}
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
                Ganhos gerais não pertencem a uma página individual (ex: Monetização geral, afiliados gerais).
              </p>
            )}
          </div>

          {/* 2. Seleção de página quando específica */}
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

          {/* 3. Moeda do Ganho (BRL / USD) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-2">
              Moeda do ganho <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleCurrencyChange('BRL')}
                className={`flex items-center justify-between py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  moeda === 'BRL'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">R$</span>
                  <span>BRL — Real brasileiro</span>
                </div>
                {moeda === 'BRL' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => handleCurrencyChange('USD')}
                className={`flex items-center justify-between py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  moeda === 'USD'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">$</span>
                  <span>USD — Dólar americano</span>
                </div>
                {moeda === 'USD' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </button>
            </div>
          </div>

          {/* 4. Fonte de receita */}
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

          {/* 5. Valor (BRL ou USD) */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              {moeda === 'USD' ? 'Valor em Dólar (USD)' : 'Valor (R$)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500 font-semibold">
                {moeda === 'USD' ? '$' : 'R$'}
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                className="block w-full pl-11 pr-3 py-2 text-sm font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
              />
            </div>
          </div>

          {/* Cotação e Conversão Automática quando USD */}
          {moeda === 'USD' && (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Conversão Cambial Automática (USD ➔ BRL)</span>
                </div>
                <button
                  type="button"
                  onClick={() => loadRateForDate(data, true)}
                  disabled={loadingRate}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 hover:text-amber-950 p-1 rounded hover:bg-amber-100/80 transition-colors disabled:opacity-50"
                  title="Atualizar cotação"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRate ? 'animate-spin' : ''}`} />
                  <span>{loadingRate ? 'Buscando...' : 'Atualizar'}</span>
                </button>
              </div>

              {rateError ? (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p>{rateError}</p>
                    <button
                      type="button"
                      onClick={() => loadRateForDate(data, true)}
                      className="text-[11px] underline font-semibold text-rose-900 hover:text-rose-950"
                    >
                      Tentar obter cotação novamente
                    </button>
                  </div>
                </div>
              ) : loadingRate ? (
                <div className="flex items-center gap-2 text-xs text-amber-800 py-1">
                  <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                  <span>Buscando cotação comercial oficial para a data {data}...</span>
                </div>
              ) : cotacao ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs text-neutral-700">
                    <span className="text-neutral-500">Cotação utilizada:</span>
                    <span className="font-mono font-bold text-neutral-900">
                      1 USD = R$ {cotacao.toFixed(4)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-neutral-500 block">
                        Valor convertido para Real:
                      </span>
                      <span className="text-base font-bold text-emerald-700">
                        {formatCurrency(convertedBrl)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">Original</span>
                      <span className="text-xs font-semibold text-neutral-800">
                        ${valorOriginal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5">
                    <span>
                      {cotacaoFonte ? `Fonte: ${cotacaoFonte}` : 'Cotação oficial comercial'}
                    </span>
                    <span>A taxa é fixada no momento do lançamento</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* 6. Data & Horário */}
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
                  onChange={(e) => handleDateChange(e.target.value)}
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

          {/* 7. Descrição */}
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
                placeholder="Ex: Monetização de vídeos (USD), comissões, vendas de conteúdo..."
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
              disabled={saving || (moeda === 'USD' && (!cotacao || cotacao <= 0))}
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
