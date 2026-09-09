// Timezone for PageMoney: America/Sao_Paulo

/**
 * Returns today's date formatted as YYYY-MM-DD in America/Sao_Paulo
 */
export function getTodaySP(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Returns yesterday's date formatted as YYYY-MM-DD in America/Sao_Paulo
 */
export function getYesterdaySP(): string {
  const now = new Date();
  // subtract 24 hours from current timestamp
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(yesterday);
}

/**
 * Returns current time in America/Sao_Paulo as HH:MM
 */
export function getCurrentTimeSP(): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
}

/**
 * Returns current Year-Month (YYYY-MM) in America/Sao_Paulo
 */
export function getCurrentMonthSP(): string {
  const today = getTodaySP();
  return today.substring(0, 7);
}

/**
 * Returns previous Year-Month (YYYY-MM) relative to current month in America/Sao_Paulo
 */
export function getPreviousMonthSP(): string {
  const currentMonthStr = getCurrentMonthSP(); // '2026-09'
  const [yearStr, monthStr] = currentMonthStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Formats standard date 'YYYY-MM-DD' into Brazilian 'DD/MM/YYYY'
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '--/--/----';
  // If it's already YYYY-MM-DD
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formats a currency value in BRL: 'R$ 1.250,00'
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats followers or numbers with thousand separators: '125.400'
 */
export function formatFollowerCount(count: number | null | undefined): string {
  if (count === null || count === undefined || isNaN(count)) {
    return '0';
  }
  return new Intl.NumberFormat('pt-BR').format(count);
}

/**
 * Formats percentage with sign: '+37,10%' or '-12,40%' or '0%'
 */
export function formatPercent(value: number | null | undefined, includeSign = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  const formatted = Math.abs(value).toFixed(2).replace('.', ',') + '%';
  if (!includeSign) return formatted;
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return '0%';
}

/**
 * Returns month name in Portuguese: 'Setembro', 'Agosto'
 */
export function getMonthName(yearMonthStr: string): string {
  try {
    const [year, month] = yearMonthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const name = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return yearMonthStr;
  }
}

/**
 * Returns the number of days elapsed in the current month up to today
 */
export function getDaysElapsedInCurrentMonthSP(): number {
  const today = getTodaySP();
  const day = parseInt(today.split('-')[2], 10);
  return Math.max(1, day);
}
