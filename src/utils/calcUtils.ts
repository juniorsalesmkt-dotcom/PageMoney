import { Earning, Expense, FollowerHistory, DashboardMetrics } from '../types';
import {
  getTodaySP,
  getYesterdaySP,
  getCurrentMonthSP,
  getPreviousMonthSP,
  getDaysElapsedInCurrentMonthSP,
} from './dateUtils';

/**
 * Calculates complete dashboard financial metrics based on earnings and expenses
 */
export function calculateDashboardMetrics(
  earnings: Earning[],
  expenses: Expense[]
): DashboardMetrics {
  const today = getTodaySP();
  const yesterday = getYesterdaySP();
  const currentMonth = getCurrentMonthSP(); // 'YYYY-MM'
  const prevMonth = getPreviousMonthSP(); // 'YYYY-MM'

  let faturamentoHoje = 0;
  let faturamentoOntem = 0;
  let faturamentoMes = 0;
  let faturamentoMesAnterior = 0;
  let totalGeralMes = 0;
  let totalAtribuidoMes = 0;

  earnings.forEach((e) => {
    const val = Number(e.valor) || 0;
    const date = e.data;
    const month = date.substring(0, 7);

    if (date === today) {
      faturamentoHoje += val;
    }
    if (date === yesterday) {
      faturamentoOntem += val;
    }
    if (month === currentMonth) {
      faturamentoMes += val;
      if (!e.page_id || e.origem === 'geral') {
        totalGeralMes += val;
      } else {
        totalAtribuidoMes += val;
      }
    }
    if (month === prevMonth) {
      faturamentoMesAnterior += val;
    }
  });

  // Calculate expenses for current month
  let despesasMes = 0;
  expenses.forEach((ex) => {
    const val = Number(ex.valor) || 0;
    const month = ex.data.substring(0, 7);
    if (month === currentMonth) {
      despesasMes += val;
    }
  });

  // Today x Yesterday difference & percentage
  const variacaoHojeOntemReais = faturamentoHoje - faturamentoOntem;
  let variacaoHojeOntemPercentual: number | null = null;
  let mensagemHojeOntem = 'Sem faturamento registrado.';

  if (faturamentoOntem > 0) {
    variacaoHojeOntemPercentual = ((faturamentoHoje - faturamentoOntem) / faturamentoOntem) * 100;
    if (faturamentoHoje > faturamentoOntem) {
      mensagemHojeOntem = 'Você faturou mais que ontem.';
    } else if (faturamentoHoje < faturamentoOntem) {
      mensagemHojeOntem = 'Você faturou menos que ontem.';
    } else {
      mensagemHojeOntem = 'Faturamento igual a ontem.';
    }
  } else if (faturamentoHoje > 0) {
    mensagemHojeOntem = 'Sem faturamento ontem.';
  }

  // Current Month x Previous Month difference & percentage
  const variacaoMesReais = faturamentoMes - faturamentoMesAnterior;
  let variacaoMesPercentual: number | null = null;
  if (faturamentoMesAnterior > 0) {
    variacaoMesPercentual = ((faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior) * 100;
  }

  // Daily average of current month
  const diasDecorridos = getDaysElapsedInCurrentMonthSP();
  const mediaDiariaMes = faturamentoMes / diasDecorridos;
  const diferencaHojeMediaDiaria = faturamentoHoje - mediaDiariaMes;
  let percentualHojeMediaDiaria: number | null = null;
  if (mediaDiariaMes > 0) {
    percentualHojeMediaDiaria = ((faturamentoHoje - mediaDiariaMes) / mediaDiariaMes) * 100;
  }

  // Net Profit & Net Margin
  const lucroLiquidoMes = faturamentoMes - despesasMes;
  const margemLiquidaMes = faturamentoMes > 0 ? (lucroLiquidoMes / faturamentoMes) * 100 : 0;

  return {
    faturamentoHoje,
    faturamentoOntem,
    variacaoHojeOntemReais,
    variacaoHojeOntemPercentual,
    mensagemHojeOntem,
    faturamentoMes,
    faturamentoMesAnterior,
    variacaoMesReais,
    variacaoMesPercentual,
    mediaDiariaMes,
    diferencaHojeMediaDiaria,
    percentualHojeMediaDiaria,
    despesasMes,
    lucroLiquidoMes,
    margemLiquidaMes,
    totalGeralMes,
    totalAtribuidoMes,
  };
}

export interface PageGrowthStats {
  pageId: string;
  seguidoresAtuais: number;
  crescimentoHojeAbsoluto: number;
  crescimentoHojePercentual: number;
  crescimento7DiasAbsoluto: number;
  crescimento7DiasPercentual: number;
  crescimento30DiasAbsoluto: number;
  crescimento30DiasPercentual: number;
  crescimentoAnoAbsoluto: number;
  crescimentoAnoPercentual: number;
  mediaDiaria: number;
  melhorDia: { data: string; ganho: number } | null;
  piorDia: { data: string; ganho: number } | null;
  totalRegistros: number;
  historicoOrdenado: FollowerHistory[];
}

/**
 * Calculates follower statistics for a specific page given its history records
 */
export function calculatePageGrowth(
  pageId: string,
  records: FollowerHistory[]
): PageGrowthStats {
  // Sort by date ascending
  const sorted = [...records]
    .filter((r) => r.page_id === pageId)
    .sort((a, b) => a.data.localeCompare(b.data));

  if (sorted.length === 0) {
    return {
      pageId,
      seguidoresAtuais: 0,
      crescimentoHojeAbsoluto: 0,
      crescimentoHojePercentual: 0,
      crescimento7DiasAbsoluto: 0,
      crescimento7DiasPercentual: 0,
      crescimento30DiasAbsoluto: 0,
      crescimento30DiasPercentual: 0,
      crescimentoAnoAbsoluto: 0,
      crescimentoAnoPercentual: 0,
      mediaDiaria: 0,
      melhorDia: null,
      piorDia: null,
      totalRegistros: 0,
      historicoOrdenado: [],
    };
  }

  const latestRecord = sorted[sorted.length - 1];
  const seguidoresAtuais = Number(latestRecord.quantidade_seguidores) || 0;

  // Day-over-day changes to find best day and worst day
  let melhorDia: { data: string; ganho: number } | null = null;
  let piorDia: { data: string; ganho: number } | null = null;

  for (let i = 1; i < sorted.length; i++) {
    const diff = Number(sorted[i].quantidade_seguidores) - Number(sorted[i - 1].quantidade_seguidores);
    const date = sorted[i].data;
    if (!melhorDia || diff > melhorDia.ganho) {
      melhorDia = { data: date, ganho: diff };
    }
    if (!piorDia || diff < piorDia.ganho) {
      piorDia = { data: date, ganho: diff };
    }
  }

  // Today calculation: compare latest with previous record
  let crescimentoHojeAbsoluto = 0;
  let crescimentoHojePercentual = 0;
  if (sorted.length >= 2) {
    const previous = sorted[sorted.length - 2];
    const prevCount = Number(previous.quantidade_seguidores) || 0;
    crescimentoHojeAbsoluto = seguidoresAtuais - prevCount;
    if (prevCount > 0) {
      crescimentoHojePercentual = (crescimentoHojeAbsoluto / prevCount) * 100;
    }
  }

  // Helper to calculate growth between latest and record on or before target date
  const getGrowthSince = (targetDate: string) => {
    const baseline = [...sorted].reverse().find((r) => r.data <= targetDate);
    if (!baseline || baseline.id === latestRecord.id) {
      // If none found earlier, compare with the earliest recorded
      const first = sorted[0];
      const baselineCount = Number(first.quantidade_seguidores) || 0;
      const abs = seguidoresAtuais - baselineCount;
      const pct = baselineCount > 0 ? (abs / baselineCount) * 100 : 0;
      return { abs, pct };
    }
    const baselineCount = Number(baseline.quantidade_seguidores) || 0;
    const abs = seguidoresAtuais - baselineCount;
    const pct = baselineCount > 0 ? (abs / baselineCount) * 100 : 0;
    return { abs, pct };
  };

  const todayStr = getTodaySP();
  const dNow = new Date(todayStr);

  const d7 = new Date(dNow.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d7Str = d7.toISOString().split('T')[0];
  const growth7 = getGrowthSince(d7Str);

  const d30 = new Date(dNow.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d30Str = d30.toISOString().split('T')[0];
  const growth30 = getGrowthSince(d30Str);

  const yearStartStr = `${todayStr.split('-')[0]}-01-01`;
  const growthAno = getGrowthSince(yearStartStr);

  // Daily average growth across recorded history
  let mediaDiaria = 0;
  if (sorted.length > 1) {
    const first = sorted[0];
    const firstDate = new Date(first.data);
    const lastDate = new Date(latestRecord.data);
    const dayDiff = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000)));
    const totalDiff = seguidoresAtuais - Number(first.quantidade_seguidores);
    mediaDiaria = Math.round(totalDiff / dayDiff);
  }

  return {
    pageId,
    seguidoresAtuais,
    crescimentoHojeAbsoluto,
    crescimentoHojePercentual,
    crescimento7DiasAbsoluto: growth7.abs,
    crescimento7DiasPercentual: growth7.pct,
    crescimento30DiasAbsoluto: growth30.abs,
    crescimento30DiasPercentual: growth30.pct,
    crescimentoAnoAbsoluto: growthAno.abs,
    crescimentoAnoPercentual: growthAno.pct,
    mediaDiaria,
    melhorDia,
    piorDia,
    totalRegistros: sorted.length,
    historicoOrdenado: sorted,
  };
}
