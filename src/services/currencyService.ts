// Currency exchange service for PageMoney
// Timezone: America/Sao_Paulo

export interface ExchangeRateResult {
  success: boolean;
  rate: number; // e.g. 5.0868
  updatedAt: string; // Formatted date string in America/Sao_Paulo, e.g. '08/09/2026 18:00'
  isoDate: string; // ISO string
  source: string;
  isCache?: boolean;
  error?: string;
}

interface CacheEntry {
  rate: number;
  timestamp: number;
  updatedAt: string;
  isoDate: string;
  source: string;
}

let memoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Format date in America/Sao_Paulo as DD/MM/YYYY HH:mm
 */
export function formatDateTimeSP(dateInput?: Date | string | number | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(d).replace(',', '');
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Formats a currency rate with at least 4 decimal places: 'R$ 5,0868'
 */
export function formatExchangeRate(rate: number): string {
  if (isNaN(rate) || rate <= 0) return 'R$ 0,0000';
  return (
    'R$ ' +
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(rate)
  );
}

/**
 * Formats USD value: 'US$ 100,00'
 */
export function formatUSD(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'US$ 0,00';
  }
  return (
    'US$ ' +
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  );
}

/**
 * Fetches real-time USD/BRL exchange rate using high-reliability cascade
 */
export async function fetchUsdBrlRate(options?: {
  forceRefresh?: boolean;
}): Promise<ExchangeRateResult> {
  const now = Date.now();

  // 1. Check in-memory cache if not forcing refresh
  if (!options?.forceRefresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return {
      success: true,
      rate: memoryCache.rate,
      updatedAt: memoryCache.updatedAt,
      isoDate: memoryCache.isoDate,
      source: memoryCache.source,
      isCache: true,
    };
  }

  // Attempt 1: AwesomeAPI (Brazilian economic API)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.USDBRL?.bid) {
        const bid = parseFloat(data.USDBRL.bid);
        if (!isNaN(bid) && bid > 0) {
          const isoDate = data.USDBRL.create_date
            ? new Date(data.USDBRL.create_date.replace(' ', 'T') + '-03:00').toISOString()
            : new Date().toISOString();
          const updatedAt = formatDateTimeSP(isoDate);
          const result: ExchangeRateResult = {
            success: true,
            rate: Number(bid.toFixed(4)),
            updatedAt,
            isoDate,
            source: 'AwesomeAPI (Mercado Financeiro)',
          };
          memoryCache = {
            rate: result.rate,
            timestamp: now,
            updatedAt: result.updatedAt,
            isoDate: result.isoDate,
            source: result.source,
          };
          return result;
        }
      }
    }
  } catch (e) {
    // Continue to next provider
  }

  // Attempt 2: Open Exchange Rates API (open.er-api.com)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.BRL) {
        const rate = parseFloat(data.rates.BRL);
        if (!isNaN(rate) && rate > 0) {
          const isoDate = data.time_last_update_utc
            ? new Date(data.time_last_update_utc).toISOString()
            : new Date().toISOString();
          const updatedAt = formatDateTimeSP(isoDate);
          const result: ExchangeRateResult = {
            success: true,
            rate: Number(rate.toFixed(4)),
            updatedAt,
            isoDate,
            source: 'Open Exchange Rates (Global)',
          };
          memoryCache = {
            rate: result.rate,
            timestamp: now,
            updatedAt: result.updatedAt,
            isoDate: result.isoDate,
            source: result.source,
          };
          return result;
        }
      }
    }
  } catch (e) {
    // Continue to next provider
  }

  // Attempt 3: Fawaz Ahmed Currency API (jsdelivr)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.usd?.brl) {
        const rate = parseFloat(data.usd.brl);
        if (!isNaN(rate) && rate > 0) {
          const isoDate = data.date ? new Date(data.date).toISOString() : new Date().toISOString();
          const updatedAt = formatDateTimeSP(isoDate);
          const result: ExchangeRateResult = {
            success: true,
            rate: Number(rate.toFixed(4)),
            updatedAt,
            isoDate,
            source: 'Currency Exchange Hub',
          };
          memoryCache = {
            rate: result.rate,
            timestamp: now,
            updatedAt: result.updatedAt,
            isoDate: result.isoDate,
            source: result.source,
          };
          return result;
        }
      }
    }
  } catch (e) {
    // Continue to next provider
  }

  // Attempt 4: ExchangeRate-API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.BRL) {
        const rate = parseFloat(data.rates.BRL);
        if (!isNaN(rate) && rate > 0) {
          const isoDate = new Date().toISOString();
          const updatedAt = formatDateTimeSP(isoDate);
          const result: ExchangeRateResult = {
            success: true,
            rate: Number(rate.toFixed(4)),
            updatedAt,
            isoDate,
            source: 'ExchangeRate API',
          };
          memoryCache = {
            rate: result.rate,
            timestamp: now,
            updatedAt: result.updatedAt,
            isoDate: result.isoDate,
            source: result.source,
          };
          return result;
        }
      }
    }
  } catch (e) {
    // Continue
  }

  // If all failed, check if we have older memory cache to salvage
  if (memoryCache) {
    return {
      success: true,
      rate: memoryCache.rate,
      updatedAt: memoryCache.updatedAt,
      isoDate: memoryCache.isoDate,
      source: `${memoryCache.source} (Cache)`,
      isCache: true,
    };
  }

  return {
    success: false,
    rate: 0,
    updatedAt: '',
    isoDate: '',
    source: '',
    error: 'Não foi possível obter a cotação do dólar. Tente novamente.',
  };
}
