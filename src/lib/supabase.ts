import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project credentials configured for this workspace
export const DEFAULT_SUPABASE_URL = 'https://jzxvgeaxeftwicavvbeb.supabase.co';
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_t4q3_KphlRRwnHEH-QaO-g_o2FQAfc-';

/**
 * Normalizes Supabase Project URL:
 * Supabase createClient requires the project origin (e.g. "https://abcdef.supabase.co").
 * If the user enters "https://abcdef.supabase.co/rest/v1/" or trailing slashes,
 * this extracts just the protocol and hostname to prevent routing errors.
 */
export function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
    return '';
  } catch {
    if (trimmed.includes('.supabase.co')) {
      try {
        const parsed = new URL(`https://${trimmed.replace(/^\/+/, '')}`);
        return parsed.origin;
      } catch {
        return '';
      }
    }
    return '';
  }
}

// 1. Read raw environment variables
const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const rawEnvKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  ''
);

// 2. Safeguard: detect if key was accidentally pasted into VITE_SUPABASE_URL
const urlLooksLikeKey = rawEnvUrl.startsWith('sb_') || (rawEnvUrl.length > 30 && !rawEnvUrl.includes('.'));
const resolvedEnvUrl = urlLooksLikeKey ? '' : rawEnvUrl;
const resolvedEnvKey = rawEnvKey || (urlLooksLikeKey ? rawEnvUrl : '');

// 3. Read custom credentials from localStorage if available (client-side override)
let storedUrl = '';
let storedKey = '';
if (typeof window !== 'undefined') {
  try {
    storedUrl = localStorage.getItem('pagemoney_supabase_url')?.trim() || '';
    storedKey = localStorage.getItem('pagemoney_supabase_key')?.trim() || '';
  } catch {
    // ignore
  }
}

// 4. Resolve final cleaned URL
let finalUrl = normalizeSupabaseUrl(resolvedEnvUrl) || normalizeSupabaseUrl(storedUrl) || DEFAULT_SUPABASE_URL;

// 5. Resolve final publishable key
let finalKey = resolvedEnvKey || storedKey || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

/**
 * Validates if the Supabase environment variables are properly configured.
 */
export const isConfigured: boolean = Boolean(
  finalUrl &&
  finalKey &&
  finalKey.length > 20 &&
  !finalUrl.includes('placeholder')
);

/**
 * User-friendly configuration error details when variables are missing or invalid.
 */
export function getConfigurationErrorMessage(): string | null {
  if (isConfigured) return null;

  const missing: string[] = [];
  if (!finalUrl) {
    missing.push('VITE_SUPABASE_URL (URL do projeto)');
  }
  if (!finalKey || finalKey.length <= 20) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  return `As seguintes configurações do Supabase precisam de atenção: ${missing.join(', ')}.`;
}

// Log status in browser console
if (isConfigured) {
  console.info(`[PageMoney Supabase] ✓ Conectado com sucesso ao projeto: ${finalUrl}`);
} else {
  console.warn(`[PageMoney Supabase] ⚠️ ${getConfigurationErrorMessage()}`);
}

// Pre-configured Supabase client instance using normalized URL and safe publishable key
export const supabase: SupabaseClient = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Helper to check configuration state.
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

/**
 * Returns the Supabase client instance if properly configured.
 */
export function getSupabase(): SupabaseClient {
  return supabase;
}

/**
 * Detailed configuration diagnostics for UI guidance without exposing secret values.
 */
export function getSupabaseConfigStatus(): {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  urlValid: boolean;
  normalizedUrl: string;
  missingVariables: string[];
  errorMessage: string | null;
} {
  return {
    isConfigured,
    hasUrl: Boolean(finalUrl),
    hasKey: Boolean(finalKey && finalKey.length > 20),
    urlValid: Boolean(finalUrl && finalUrl.startsWith('https://')),
    normalizedUrl: finalUrl,
    missingVariables: isConfigured ? [] : ['VITE_SUPABASE_PUBLISHABLE_KEY'],
    errorMessage: getConfigurationErrorMessage(),
  };
}

/**
 * Allows user to update credentials locally from the UI if necessary
 */
export function setCustomCredentials(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('pagemoney_supabase_url', url.trim());
    if (key) localStorage.setItem('pagemoney_supabase_key', key.trim());
    window.location.reload();
  }
}

export default supabase;
