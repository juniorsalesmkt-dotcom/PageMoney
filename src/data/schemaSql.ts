export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- PAGEMONEY - BANCO DE DADOS POSTGRESQL (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase para criar todas as
-- tabelas, relacionamentos, índices e políticas de segurança RLS.
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA: profiles (Perfis de usuário)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA: pages (Páginas de conteúdo do usuário)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    plataforma TEXT NOT NULL, -- 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'Outra'
    nicho TEXT,
    username TEXT,
    url TEXT,
    status TEXT DEFAULT 'Ativa' NOT NULL, -- 'Ativa', 'Pausada', 'Inativa'
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA: earnings (Ganhos / Faturamento)
CREATE TABLE IF NOT EXISTS public.earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
    origem TEXT NOT NULL CHECK (origem IN ('geral', 'especifica')),
    fonte_receita TEXT NOT NULL,
    moeda TEXT DEFAULT 'BRL' NOT NULL,
    valor_original NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cotacao_usd_brl NUMERIC(10, 4) DEFAULT 1.0000 NOT NULL,
    valor_brl NUMERIC(12, 2) NOT NULL DEFAULT 0,
    data_cotacao TIMESTAMPTZ,
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    data DATE NOT NULL,
    horario TEXT,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA: expenses (Despesas do negócio)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
    categoria TEXT NOT NULL,
    moeda TEXT DEFAULT 'BRL' NOT NULL,
    valor_original NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cotacao_usd_brl NUMERIC(10, 4) DEFAULT 1.0000 NOT NULL,
    valor_brl NUMERIC(12, 2) NOT NULL DEFAULT 0,
    data_cotacao TIMESTAMPTZ,
    valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
    data DATE NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA: follower_history (Histórico de seguidores)
CREATE TABLE IF NOT EXISTS public.follower_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
    data DATE NOT NULL,
    quantidade_seguidores BIGINT NOT NULL CHECK (quantidade_seguidores >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_page_follower_date UNIQUE (page_id, data)
);

-- 7. TABELA: financial_goals (Metas mensais)
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mes TEXT NOT NULL,
    meta_faturamento NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (meta_faturamento >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_month_goal UNIQUE (user_id, mes)
);

-- ==============================================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_earnings_user_date ON public.earnings (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_page ON public.earnings (page_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_follower_page_date ON public.follower_history (page_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_pages_user ON public.pages (user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follower_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Pages
DROP POLICY IF EXISTS "pages_select_own" ON public.pages;
CREATE POLICY "pages_select_own" ON public.pages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "pages_insert_own" ON public.pages;
CREATE POLICY "pages_insert_own" ON public.pages FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "pages_update_own" ON public.pages;
CREATE POLICY "pages_update_own" ON public.pages FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "pages_delete_own" ON public.pages;
CREATE POLICY "pages_delete_own" ON public.pages FOR DELETE USING (auth.uid() = user_id);

-- Earnings
DROP POLICY IF EXISTS "earnings_select_own" ON public.earnings;
CREATE POLICY "earnings_select_own" ON public.earnings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "earnings_insert_own" ON public.earnings;
CREATE POLICY "earnings_insert_own" ON public.earnings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "earnings_update_own" ON public.earnings;
CREATE POLICY "earnings_update_own" ON public.earnings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "earnings_delete_own" ON public.earnings;
CREATE POLICY "earnings_delete_own" ON public.earnings FOR DELETE USING (auth.uid() = user_id);

-- Expenses
DROP POLICY IF EXISTS "expenses_select_own" ON public.expenses;
CREATE POLICY "expenses_select_own" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "expenses_insert_own" ON public.expenses;
CREATE POLICY "expenses_insert_own" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "expenses_update_own" ON public.expenses;
CREATE POLICY "expenses_update_own" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "expenses_delete_own" ON public.expenses;
CREATE POLICY "expenses_delete_own" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Follower History
DROP POLICY IF EXISTS "follower_history_select_own" ON public.follower_history;
CREATE POLICY "follower_history_select_own" ON public.follower_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "follower_history_insert_own" ON public.follower_history;
CREATE POLICY "follower_history_insert_own" ON public.follower_history FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "follower_history_update_own" ON public.follower_history;
CREATE POLICY "follower_history_update_own" ON public.follower_history FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "follower_history_delete_own" ON public.follower_history;
CREATE POLICY "follower_history_delete_own" ON public.follower_history FOR DELETE USING (auth.uid() = user_id);

-- Financial Goals
DROP POLICY IF EXISTS "financial_goals_select_own" ON public.financial_goals;
CREATE POLICY "financial_goals_select_own" ON public.financial_goals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "financial_goals_insert_own" ON public.financial_goals;
CREATE POLICY "financial_goals_insert_own" ON public.financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "financial_goals_update_own" ON public.financial_goals;
CREATE POLICY "financial_goals_update_own" ON public.financial_goals FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "financial_goals_delete_own" ON public.financial_goals;
CREATE POLICY "financial_goals_delete_own" ON public.financial_goals FOR DELETE USING (auth.uid() = user_id);

-- Trigger perfil automatico
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, nome, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualização automática de colunas para tabelas já existentes
ALTER TABLE public.earnings
    ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL' NOT NULL,
    ADD COLUMN IF NOT EXISTS valor_original NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS cotacao_usd_brl NUMERIC(10, 4) DEFAULT 1.0000 NOT NULL,
    ADD COLUMN IF NOT EXISTS valor_brl NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS data_cotacao TIMESTAMPTZ;

UPDATE public.earnings
SET
    moeda = COALESCE(moeda, 'BRL'),
    valor_original = CASE WHEN valor_original = 0 OR valor_original IS NULL THEN valor ELSE valor_original END,
    cotacao_usd_brl = CASE WHEN cotacao_usd_brl IS NULL OR cotacao_usd_brl = 0 THEN 1.0000 ELSE cotacao_usd_brl END,
    valor_brl = CASE WHEN valor_brl = 0 OR valor_brl IS NULL THEN valor ELSE valor_brl END
WHERE moeda IS NULL OR valor_original = 0 OR cotacao_usd_brl = 0 OR valor_brl = 0;

ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL' NOT NULL,
    ADD COLUMN IF NOT EXISTS valor_original NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS cotacao_usd_brl NUMERIC(10, 4) DEFAULT 1.0000 NOT NULL,
    ADD COLUMN IF NOT EXISTS valor_brl NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS data_cotacao TIMESTAMPTZ;

UPDATE public.expenses
SET
    moeda = COALESCE(moeda, 'BRL'),
    valor_original = CASE WHEN valor_original = 0 OR valor_original IS NULL THEN valor ELSE valor_original END,
    cotacao_usd_brl = CASE WHEN cotacao_usd_brl IS NULL OR cotacao_usd_brl = 0 THEN 1.0000 ELSE cotacao_usd_brl END,
    valor_brl = CASE WHEN valor_brl = 0 OR valor_brl IS NULL THEN valor ELSE valor_brl END
WHERE moeda IS NULL OR valor_original = 0 OR cotacao_usd_brl = 0 OR valor_brl = 0;
`;

export const SUPABASE_MIGRATION_CURRENCY_SQL = `-- ATUALIZAÇÃO PARA SUPORTE A DÓLAR (USD) E MULTIMOEDAS
-- Execute este script no SQL Editor do Supabase se suas tabelas já foram criadas anteriormente.

ALTER TABLE public.earnings
    ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL' NOT NULL,
    ADD COLUMN IF NOT EXISTS valor_original NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS cotacao_usd_brl NUMERIC(10, 4) DEFAULT 1.0000 NOT NULL,
    ADD COLUMN IF NOT EXISTS valor_brl NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS data_cotacao TIMESTAMPTZ;

UPDATE public.earnings
SET
    moeda = COALESCE(moeda, 'BRL'),
    valor_original = CASE WHEN valor_original = 0 OR valor_original IS NULL THEN valor ELSE valor_original END,
    cotacao_usd_brl = CASE WHEN cotacao_usd_brl IS NULL OR cotacao_usd_brl = 0 THEN 1.0000 ELSE cotacao_usd_brl END,
    valor_brl = CASE WHEN valor_brl = 0 OR valor_brl IS NULL THEN valor ELSE valor_brl END
WHERE moeda IS NULL OR valor_original = 0 OR cotacao_usd_brl = 0 OR valor_brl = 0;

ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL' NOT NULL,
    ADD COLUMN IF NOT EXISTS valor_original NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS cotacao_usd_brl NUMERIC(10, 4) DEFAULT 1.0000 NOT NULL,
    ADD COLUMN IF NOT EXISTS valor_brl NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS data_cotacao TIMESTAMPTZ;

UPDATE public.expenses
SET
    moeda = COALESCE(moeda, 'BRL'),
    valor_original = CASE WHEN valor_original = 0 OR valor_original IS NULL THEN valor ELSE valor_original END,
    cotacao_usd_brl = CASE WHEN cotacao_usd_brl IS NULL OR cotacao_usd_brl = 0 THEN 1.0000 ELSE cotacao_usd_brl END,
    valor_brl = CASE WHEN valor_brl = 0 OR valor_brl IS NULL THEN valor ELSE valor_brl END
WHERE moeda IS NULL OR valor_original = 0 OR cotacao_usd_brl = 0 OR valor_brl = 0;
`;
