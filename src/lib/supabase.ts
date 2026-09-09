import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve environment variables
const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';

// Primary key: VITE_SUPABASE_PUBLISHABLE_KEY
// Fallback: VITE_SUPABASE_ANON_KEY (for backwards compatibility if provided in environment)
const rawKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  ''
);

/**
 * Normalizes Supabase Project URL:
 * Supabase createClient requires the project origin (e.g. "https://abcdef.supabase.co").
 * If the user enters "https://abcdef.supabase.co/rest/v1/" or trailing slashes,
 * this extracts just the protocol and hostname to prevent routing errors.
 * 
 * Also handles recovery if the project URL was provided in chat or previous steps
 * ("https://jzxvgeaxeftwicavvbeb.supabase.co").
 */
function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
    return '';
  } catch {
    if (url.includes('.supabase.co')) {
      try {
        const parsed = new URL(`https://${url.replace(/^\/+/, '')}`);
        return parsed.origin;
      } catch {
        return '';
      }
    }
    return '';
  }
}

// Check if rawEnvUrl is a valid URL or if it was mistakenly set to a key.
// If not a valid URL, fallback to the project URL provided by the user (jzxvgeaxeftwicavvbeb)
let cleanedUrl = normalizeSupabaseUrl(rawEnvUrl);
if (!cleanedUrl) {
  // Known verified project instance for this workspace
  cleanedUrl = 'https://jzxvgeaxeftwicavvbeb.supabase.co';
}

/**
 * Validates if the Supabase environment variables are properly configured.
 */
export const isConfigured: boolean = Boolean(
  cleanedUrl &&
  rawKey &&
  !cleanedUrl.includes('placeholder') &&
  rawKey.length > 20
);

/**
 * User-friendly configuration error details when variables are missing or invalid.
 */
export function getConfigurationErrorMessage(): string | null {
  if (isConfigured) return null;

  const missing: string[] = [];
  if (!cleanedUrl) {
    missing.push('VITE_SUPABASE_URL (URL do projeto: https://jzxvgeaxeftwicavvbeb.supabase.co)');
  }

  if (!rawKey) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  return `As seguintes variáveis de ambiente do Supabase precisam de atenção: ${missing.join(', ')}. Configure-as no painel de ambiente para ativar a sincronização na nuvem e autenticação.`;
}

// Log status in the browser console
if (!isConfigured) {
  const errorMessage = getConfigurationErrorMessage();
  console.warn(`[PageMoney Supabase Config] ⚠️ ${errorMessage}`);
} else {
  console.info(`[PageMoney Supabase Config] ✓ Conectado a ${cleanedUrl}`);
}

// Use sanitized URL or fallback to placeholder credentials so createClient does not crash at bundle evaluation
const supabaseUrl = cleanedUrl || 'https://placeholder.supabase.co';
const supabaseKey = isConfigured ? rawKey : 'placeholder-publishable-key-000000000000';

/**
 * Pre-configured Supabase client instance.
 * Strictly uses public/publishable key - never secret or service_role keys.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
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
 * Returns the Supabase client instance if properly configured, or null if unconfigured.
 */
export function getSupabase(): SupabaseClient | null {
  return isConfigured ? supabase : null;
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
  const missing: string[] = [];
  const hasKey = Boolean(rawKey && rawKey.length > 20);
  const urlValid = Boolean(cleanedUrl);

  if (!urlValid) {
    missing.push('VITE_SUPABASE_URL (URL inválida: deve ser https://jzxvgeaxeftwicavvbeb.supabase.co)');
  }

  if (!hasKey) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  return {
    isConfigured: urlValid && hasKey,
    hasUrl: Boolean(rawEnvUrl || cleanedUrl),
    hasKey,
    urlValid,
    normalizedUrl: cleanedUrl,
    missingVariables: missing,
    errorMessage: getConfigurationErrorMessage(),
  };
}

export default supabase;
