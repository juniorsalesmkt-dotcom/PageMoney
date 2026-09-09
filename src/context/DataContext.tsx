import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSupabase } from '../lib/supabase';
import {
  ContentPage,
  Earning,
  Expense,
  FollowerHistory,
  FinancialGoal,
  DashboardMetrics,
} from '../types';
import { calculateDashboardMetrics } from '../utils/calcUtils';
import { getTodaySP } from '../utils/dateUtils';

export function isTableMissingError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  const details = String(err.details || '').toLowerCase();
  const hint = String(err.hint || '').toLowerCase();
  const str = JSON.stringify(err).toLowerCase();
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    code === 'PGRST200' ||
    code === 'PGRST204' ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    details.includes('schema cache') ||
    details.includes('could not find the table') ||
    details.includes('does not exist') ||
    hint.includes('schema cache') ||
    str.includes('schema cache') ||
    str.includes('could not find the table')
  );
}

interface DataContextType {
  pages: ContentPage[];
  earnings: Earning[];
  expenses: Expense[];
  followerHistory: FollowerHistory[];
  goals: FinancialGoal[];
  metrics: DashboardMetrics;
  loading: boolean;
  error: string | null;
  isSchemaMissing: boolean;
  refreshData: () => Promise<void>;
  checkSchema: () => Promise<boolean>;
  syncLocalDataToSupabase: () => Promise<{ success: boolean; count?: number; error?: string }>;
  // Pages CRUD
  createPage: (data: Omit<ContentPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string; savedLocally?: boolean }>;
  updatePage: (id: string, data: Partial<ContentPage>) => Promise<{ success: boolean; error?: string }>;
  deletePage: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Earnings CRUD
  createEarning: (data: {
    origem: 'geral' | 'especifica';
    page_id?: string | null;
    fonte_receita: string;
    valor: number;
    data: string;
    horario?: string | null;
    descricao?: string | null;
  }) => Promise<{ success: boolean; error?: string; savedLocally?: boolean }>;
  updateEarning: (id: string, data: Partial<Earning>) => Promise<{ success: boolean; error?: string }>;
  deleteEarning: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Expenses CRUD
  createExpense: (data: {
    categoria: string;
    page_id?: string | null;
    valor: number;
    data: string;
    descricao?: string | null;
  }) => Promise<{ success: boolean; error?: string; savedLocally?: boolean }>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<{ success: boolean; error?: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Follower History
  recordFollowers: (page_id: string, data: string, quantidade_seguidores: number) => Promise<{ success: boolean; error?: string; updated?: boolean }>;
  deleteFollowerRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Goals
  setMonthlyGoal: (mes: string, meta_faturamento: number) => Promise<{ success: boolean; error?: string }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [pages, setPages] = useState<ContentPage[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [followerHistory, setFollowerHistory] = useState<FollowerHistory[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSchemaMissing, setIsSchemaMissing] = useState(false);

  const userStorageKey = useCallback(
    (prefix: string) => `pagemoney_${user ? user.id : 'anon'}_${prefix}`,
    [user]
  );

  const saveLocalBackup = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(userStorageKey(key), JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [userStorageKey]);

  // Load all data from Supabase, or fall back to localStorage gracefully
  const loadAllData = useCallback(async () => {
    if (!user) {
      setPages([]);
      setEarnings([]);
      setExpenses([]);
      setFollowerHistory([]);
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = getSupabase();

    if (!supabase) {
      try {
        const p = JSON.parse(localStorage.getItem(userStorageKey('pages')) || '[]');
        const e = JSON.parse(localStorage.getItem(userStorageKey('earnings')) || '[]');
        const ex = JSON.parse(localStorage.getItem(userStorageKey('expenses')) || '[]');
        const f = JSON.parse(localStorage.getItem(userStorageKey('followers')) || '[]');
        const g = JSON.parse(localStorage.getItem(userStorageKey('goals')) || '[]');
        setPages(p);
        setEarnings(e);
        setExpenses(ex);
        setFollowerHistory(f);
        setGoals(g);
      } catch {
        // start empty
      }
      setLoading(false);
      return;
    }

    try {
      // Fetch pages
      const { data: pagesData, error: pagesErr } = await supabase
        .from('pages')
        .select('*')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });

      if (pagesErr) {
        if (isTableMissingError(pagesErr)) {
          setIsSchemaMissing(true);
          throw pagesErr;
        }
        throw pagesErr;
      }

      setIsSchemaMissing(false);

      // Fetch earnings with page details
      const { data: earningsData, error: earningsErr } = await supabase
        .from('earnings')
        .select('*, page:pages(*)')
        .eq('user_id', user.id)
        .order('data', { ascending: false });
      if (earningsErr) throw earningsErr;

      // Fetch expenses with page details
      const { data: expensesData, error: expensesErr } = await supabase
        .from('expenses')
        .select('*, page:pages(*)')
        .eq('user_id', user.id)
        .order('data', { ascending: false });
      if (expensesErr) throw expensesErr;

      // Fetch follower history
      const { data: followerData, error: followerErr } = await supabase
        .from('follower_history')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: true });
      if (followerErr) throw followerErr;

      // Fetch goals
      const { data: goalsData, error: goalsErr } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id);
      if (goalsErr) throw goalsErr;

      setPages(pagesData || []);
      setEarnings(earningsData || []);
      setExpenses(expensesData || []);
      setFollowerHistory(followerData || []);
      setGoals(goalsData || []);
    } catch (err: any) {
      if (isTableMissingError(err)) {
        setIsSchemaMissing(true);
        console.info('[PageMoney] Tabelas do Supabase ainda não criadas. Operando com armazenamento local seguro.');
      } else {
        console.warn('Error fetching Supabase data, checking local fallback:', err);
        setError(err.message || 'Erro ao carregar dados do Supabase');
      }

      // If tables don't exist yet, fall back gracefully to local storage
      try {
        const p = JSON.parse(localStorage.getItem(userStorageKey('pages')) || '[]');
        const e = JSON.parse(localStorage.getItem(userStorageKey('earnings')) || '[]');
        const ex = JSON.parse(localStorage.getItem(userStorageKey('expenses')) || '[]');
        const f = JSON.parse(localStorage.getItem(userStorageKey('followers')) || '[]');
        const g = JSON.parse(localStorage.getItem(userStorageKey('goals')) || '[]');
        setPages(p);
        setEarnings(e);
        setExpenses(ex);
        setFollowerHistory(f);
        setGoals(g);
      } catch {
        // empty
      }
    } finally {
      setLoading(false);
    }
  }, [user, userStorageKey]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Check if tables are now available in Supabase
  const checkSchema = async (): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('pages').select('id').limit(1);
      if (error) {
        if (isTableMissingError(error)) {
          setIsSchemaMissing(true);
          return false;
        }
      }
      setIsSchemaMissing(false);
      return true;
    } catch {
      return false;
    }
  };

  // Sync local data up to Supabase once tables are created
  const syncLocalDataToSupabase = async (): Promise<{ success: boolean; count?: number; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase indisponível' };

    try {
      let count = 0;

      // 1. Pages
      if (pages.length > 0) {
        const pagesPayload = pages.map((p) => ({
          id: p.id,
          user_id: user.id,
          nome: p.nome,
          plataforma: p.plataforma,
          nicho: p.nicho,
          username: p.username,
          url: p.url,
          status: p.status,
          observacoes: p.observacoes,
        }));
        const { error: pErr } = await supabase.from('pages').upsert(pagesPayload);
        if (pErr) throw pErr;
        count += pages.length;
      }

      // 2. Earnings
      if (earnings.length > 0) {
        const earningsPayload = earnings.map((e) => ({
          id: e.id,
          user_id: user.id,
          page_id: e.page_id,
          origem: e.origem,
          fonte_receita: e.fonte_receita,
          valor: e.valor,
          data: e.data,
          horario: e.horario,
          descricao: e.descricao,
        }));
        const { error: eErr } = await supabase.from('earnings').upsert(earningsPayload);
        if (eErr) throw eErr;
        count += earnings.length;
      }

      // 3. Expenses
      if (expenses.length > 0) {
        const expensesPayload = expenses.map((ex) => ({
          id: ex.id,
          user_id: user.id,
          page_id: ex.page_id,
          categoria: ex.categoria,
          valor: ex.valor,
          data: ex.data,
          descricao: ex.descricao,
        }));
        const { error: exErr } = await supabase.from('expenses').upsert(expensesPayload);
        if (exErr) throw exErr;
        count += expenses.length;
      }

      // 4. Followers
      if (followerHistory.length > 0) {
        const followersPayload = followerHistory.map((f) => ({
          id: f.id,
          user_id: user.id,
          page_id: f.page_id,
          data: f.data,
          quantidade_seguidores: f.quantidade_seguidores,
        }));
        const { error: fErr } = await supabase.from('follower_history').upsert(followersPayload);
        if (fErr) throw fErr;
        count += followerHistory.length;
      }

      // 5. Goals
      if (goals.length > 0) {
        const goalsPayload = goals.map((g) => ({
          id: g.id,
          user_id: user.id,
          mes: g.mes,
          meta_faturamento: g.meta_faturamento,
        }));
        const { error: gErr } = await supabase.from('financial_goals').upsert(goalsPayload);
        if (gErr) throw gErr;
        count += goals.length;
      }

      setIsSchemaMissing(false);
      await loadAllData();
      return { success: true, count };
    } catch (err: any) {
      console.error('Error syncing local data to Supabase:', err);
      return { success: false, error: err.message };
    }
  };

  // ==========================
  // PAGES CRUD
  // ==========================
  const createPage = async (
    pageData: Omit<ContentPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string; savedLocally?: boolean }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();

    const newPageObj: ContentPage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      nome: pageData.nome.trim(),
      plataforma: pageData.plataforma,
      nicho: pageData.nicho?.trim() || null,
      username: pageData.username?.trim() || null,
      url: pageData.url?.trim() || null,
      status: pageData.status || 'Ativa',
      observacoes: pageData.observacoes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase && !isSchemaMissing) {
      try {
        const { data, error: sbError } = await supabase
          .from('pages')
          .insert({
            user_id: user.id,
            nome: newPageObj.nome,
            plataforma: newPageObj.plataforma,
            nicho: newPageObj.nicho,
            username: newPageObj.username,
            url: newPageObj.url,
            status: newPageObj.status,
            observacoes: newPageObj.observacoes,
          })
          .select('*')
          .single();

        if (sbError) {
          if (isTableMissingError(sbError)) {
            setIsSchemaMissing(true);
            throw sbError;
          }
          throw sbError;
        }

        const saved = (data as ContentPage) || newPageObj;
        setPages((prev) => {
          const updated = [...prev, saved].sort((a, b) => a.nome.localeCompare(b.nome));
          saveLocalBackup('pages', updated);
          return updated;
        });
        return { success: true };
      } catch (err: any) {
        if (isTableMissingError(err)) {
          setIsSchemaMissing(true);
          setPages((prev) => {
            const updated = [...prev, newPageObj].sort((a, b) => a.nome.localeCompare(b.nome));
            saveLocalBackup('pages', updated);
            return updated;
          });
          return { success: true, savedLocally: true };
        }
        console.error('Supabase error creating page:', err);
        return { success: false, error: err.message || 'Erro ao criar página no Supabase.' };
      }
    } else {
      // Local fallback
      setPages((prev) => {
        const updated = [...prev, newPageObj].sort((a, b) => a.nome.localeCompare(b.nome));
        saveLocalBackup('pages', updated);
        return updated;
      });
      return { success: true, savedLocally: true };
    }
  };

  const updatePage = async (
    id: string,
    data: Partial<ContentPage>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();

    if (supabase && !isSchemaMissing) {
      try {
        const { error: sbError } = await supabase
          .from('pages')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id);
        if (sbError) {
          if (isTableMissingError(sbError)) {
            setIsSchemaMissing(true);
          } else {
            throw sbError;
          }
        }
      } catch (err: any) {
        if (!isTableMissingError(err)) {
          return { success: false, error: err.message || 'Erro ao atualizar página.' };
        }
      }
    }

    setPages((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
      );
      saveLocalBackup('pages', updated);
      return updated;
    });
    return { success: true };
  };

  const deletePage = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();

    if (supabase && !isSchemaMissing) {
      try {
        const { error: sbError } = await supabase
          .from('pages')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (sbError) {
          if (isTableMissingError(sbError)) {
            setIsSchemaMissing(true);
          } else {
            throw sbError;
          }
        }
      } catch (err: any) {
        if (!isTableMissingError(err)) {
          return { success: false, error: err.message || 'Erro ao excluir página.' };
        }
      }
    }

    setPages((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveLocalBackup('pages', updated);
      return updated;
    });
    // Set page_id to null in earnings and expenses referencing this page
    setEarnings((prev) =>
      prev.map((e) => (e.page_id === id ? { ...e, page_id: null, page: null } : e))
    );
    setExpenses((prev) =>
      prev.map((ex) => (ex.page_id === id ? { ...ex, page_id: null, page: null } : ex))
    );
    setFollowerHistory((prev) => prev.filter((f) => f.page_id !== id));
    return { success: true };
  };

  // ==========================
  // EARNINGS CRUD
  // ==========================
  const createEarning = async (data: {
    origem: 'geral' | 'especifica';
    page_id?: string | null;
    fonte_receita: string;
    valor: number;
    data: string;
    horario?: string | null;
    descricao?: string | null;
  }): Promise<{ success: boolean; error?: string; savedLocally?: boolean }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    const finalPageId = data.origem === 'geral' ? null : data.page_id || null;
    if (data.origem === 'especifica' && !finalPageId) {
      return { success: false, error: 'Selecione uma página para ganhos específicos.' };
    }
    if (!data.valor || data.valor <= 0) {
      return { success: false, error: 'O valor do ganho deve ser maior que zero.' };
    }
    if (!data.data) {
      return { success: false, error: 'A data do lançamento é obrigatória.' };
    }
    if (!data.fonte_receita) {
      return { success: false, error: 'A fonte de receita é obrigatória.' };
    }

    const supabase = getSupabase();
    const associatedPage = finalPageId ? pages.find((p) => p.id === finalPageId) || null : null;

    const newEarning: Earning = {
      id: crypto.randomUUID(),
      user_id: user.id,
      page_id: finalPageId,
      origem: data.origem,
      fonte_receita: data.fonte_receita,
      valor: Number(data.valor),
      data: data.data,
      horario: data.horario || null,
      descricao: data.descricao?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      page: associatedPage,
    };

    if (supabase && !isSchemaMissing) {
      try {
        const { data: sbData, error: sbErr } = await supabase
          .from('earnings')
          .insert({
            user_id: user.id,
            page_id: finalPageId,
            origem: data.origem,
            fonte_receita: data.fonte_receita,
            valor: Number(data.valor),
            data: data.data,
            horario: data.horario || null,
            descricao: data.descricao?.trim() || null,
          })
          .select('*, page:pages(*)')
          .single();

        if (sbErr) {
          if (isTableMissingError(sbErr)) {
            setIsSchemaMissing(true);
            throw sbErr;
          }
          throw sbErr;
        }

        const saved = (sbData as Earning) || newEarning;
        setEarnings((prev) => {
          const updated = [saved, ...prev].sort((a, b) => b.data.localeCompare(a.data));
          saveLocalBackup('earnings', updated);
          return updated;
        });
        return { success: true };
      } catch (err: any) {
        if (isTableMissingError(err)) {
          setIsSchemaMissing(true);
          setEarnings((prev) => {
            const updated = [newEarning, ...prev].sort((a, b) => b.data.localeCompare(a.data));
            saveLocalBackup('earnings', updated);
            return updated;
          });
          return { success: true, savedLocally: true };
        }
        console.error('Supabase error inserting earning:', err);
        return { success: false, error: err.message || 'Não foi possível salvar o ganho no Supabase.' };
      }
    } else {
      setEarnings((prev) => {
        const updated = [newEarning, ...prev].sort((a, b) => b.data.localeCompare(a.data));
        saveLocalBackup('earnings', updated);
        return updated;
      });
      return { success: true, savedLocally: true };
    }
  };

  const updateEarning = async (
    id: string,
    data: Partial<Earning>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();

    const finalData = { ...data };
    if (finalData.origem === 'geral') {
      finalData.page_id = null;
    }

    if (supabase && !isSchemaMissing) {
      try {
        const { error: sbError } = await supabase
          .from('earnings')
          .update({
            ...finalData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id);
        if (sbError) {
          if (isTableMissingError(sbError)) {
            setIsSchemaMissing(true);
          } else {
            throw sbError;
          }
        }
      } catch (err: any) {
        if (!isTableMissingError(err)) {
          return { success: false, error: err.message || 'Erro ao atualizar ganho.' };
        }
      }
    }

    setEarnings((prev) => {
      const updated = prev.map((e) => {
        if (e.id === id) {
          const merged = { ...e, ...finalData, updated_at: new Date().toISOString() };
          merged.page = merged.page_id ? pages.find((p) => p.id === merged.page_id) || null : null;
          return merged;
        }
        return e;
      });
      saveLocalBackup('earnings', updated);
      return updated;
    });
    return { success: true };
  };

  const deleteEarning = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();

    if (supabase && !isSchemaMissing) {
      try {
        const { error: sbError } = await supabase
          .from('earnings')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (sbError) {
          if (isTableMissingError(sbError)) {
            setIsSchemaMissing(true);
          } else {
            throw sbError;
          }
        }
      } catch (err: any) {
        if (!isTableMissingError(err)) {
          return { success: false, error: err.message || 'Erro ao excluir ganho.' };
        }
      }
    }

    setEarnings((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveLocalBackup('earnings', updated);
      return updated;
    });
    return { success: true };
  };

  // ==========================
  // EXPENSES CRUD
  // ==========================
  const createExpense = async (data: {
    categoria: string;
    page_id?: string | null;
    valor: number;
    data: string;
    descricao?: string | null;
  }): Promise<{ success: boolean; error?: string; savedLocally?: boolean }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    if (!data.valor || data.valor <= 0) {
      return { success: false, error: 'O valor da despesa deve ser maior que zero.' };
    }
    if (!data.data) {
      return { success: false, error: 'A data da despesa é obrigatória.' };
    }
    if (!data.categoria) {
      return { success: false, error: 'A categoria da despesa é obrigatória.' };
    }

    const supabase = getSupabase();
    const associatedPage = data.page_id ? pages.find((p) => p.id === data.page_id) || null : null;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      user_id: user.id,
      page_id: data.page_id || null,
      categoria: data.categoria,
      valor: Number(data.valor),
      data: data.data,
      descricao: data.descricao?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      page: associatedPage,
    };

    if (supabase && !isSchemaMissing) {
      try {
        const { data: sbData, error: sbErr } = await supabase
          .from('expenses')
          .insert({
            user_id: user.id,
            page_id: data.page_id || null,
            categoria: data.categoria,
            valor: Number(data.valor),
            data: data.data,
            descricao: data.descricao?.trim() || null,
          })
          .select('*, page:pages(*)')
          .single();

        if (sbErr) {
          if (isTableMissingError(sbErr)) {
            setIsSchemaMissing(true);
            throw sbErr;
          }
          throw sbErr;
        }

        const saved = (sbData as Expense) || newExpense;
        setExpenses((prev) => {
          const updated = [saved, ...prev].sort((a, b) => b.data.localeCompare(a.data));
          saveLocalBackup('expenses', updated);
          return updated;
        });
        return { success: true };
      } catch (err: any) {
        if (isTableMissingError(err)) {
          setIsSchemaMissing(true);
          setExpenses((prev) => {
            const updated = [newExpense, ...prev].sort((a, b) => b.data.localeCompare(a.data));
            saveLocalBackup('expenses', updated);
            return updated;
          });
          return { success: true, savedLocally: true };
        }
        return { success: false, error: err.message || 'Erro ao registrar despesa no Supabase.' };
      }
    } else {
      setExpenses((prev) => {
        const updated = [newExpense, ...prev].sort((a, b) => b.data.localeCompare(a.data));
        saveLocalBackup('expenses', updated);
        return updated;
      });
      return { success: true, savedLocally: true };
    }
  };

  const updateExpense = async (
    id: string,
    data: Partial<Expense>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();

    if (supabase && !isSchemaMissing) {
      try {
        const { error: sbError } = await supabase
          .from('expenses')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id);
        if (sbError) {
          if (isTableMissingError(sbError)) {
            setIsSchemaMissing(true);
          } else {
            throw sbError;
          }
        }
      } catch (err: any) {
        if (!isTableMissingError(err)) {
          return { success: false, error: err.message || 'Erro ao atualizar despesa.' };
        }
      }
    }

    setExpenses((prev) => {
      const updated = prev.map((ex) => {
        if (ex.id === id) {
          const merged = { ...ex, ...data, updated_at: new Date().toISOString() };
          merged.page = merged.page_id ? pages.find((p) => p.id === merged.page_id) || null : null;
          return merged;
        }
        return ex;
      });
      saveLocalBackup('expenses', updated);
      return updated;
    });
    return { success: true };
  };

  const deleteExpense = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();

    if (supabase && !isSchemaMissing) {
      try {
        const { error: sbError } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (sbError) {
          if (isTableMissingError(sbError)) {
            setIsSchemaMissing(true);
          } else {
            throw sbError;
          }
        }
      } catch (err: any) {
        if (!isTableMissingError(err)) {
          return { success: false, error: err.message || 'Erro ao excluir despesa.' };
        }
      }
    }

    setExpenses((prev) => {
      const updated = prev.filter((ex) => ex.id !== id);
      saveLocalBackup('expenses', updated);
      return updated;
    });
    return { success: true };
  };

  // ==========================
  // FOLLOWER HISTORY
  // ==========================
  const recordFollowers = async (
    page_id: string,
    dataDate: string,
    quantidade_seguidores: number
  ): Promise<{ success: boolean; error?: string; updated?: boolean; savedLocally?: boolean }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    if (quantidade_seguidores < 0 || isNaN(quantidade_seguidores)) {
      return { success: false, error: 'Quantidade de seguidores inválida.' };
    }
    if (!dataDate) {
      return { success: false, error: 'Data é obrigatória.' };
    }

    const supabase = getSupabase();
    const existing = followerHistory.find(
      (f) => f.page_id === page_id && f.data === dataDate
    );

    if (supabase && !isSchemaMissing) {
      try {
        if (existing) {
          const { error: sbError } = await supabase
            .from('follower_history')
            .update({ quantidade_seguidores: Math.round(quantidade_seguidores) })
            .eq('id', existing.id)
            .eq('user_id', user.id);
          if (sbError) throw sbError;

          setFollowerHistory((prev) => {
            const updated = prev.map((f) =>
              f.id === existing.id
                ? { ...f, quantidade_seguidores: Math.round(quantidade_seguidores) }
                : f
            );
            saveLocalBackup('followers', updated);
            return updated;
          });
          return { success: true, updated: true };
        } else {
          const { data: sbData, error: sbError } = await supabase
            .from('follower_history')
            .insert({
              user_id: user.id,
              page_id,
              data: dataDate,
              quantidade_seguidores: Math.round(quantidade_seguidores),
            })
            .select('*')
            .single();
          if (sbError) throw sbError;

          setFollowerHistory((prev) => {
            const updated = [...prev, sbData as FollowerHistory].sort((a, b) =>
              a.data.localeCompare(b.data)
            );
            saveLocalBackup('followers', updated);
            return updated;
          });
          return { success: true, updated: false };
        }
      } catch (err: any) {
        if (isTableMissingError(err)) {
          setIsSchemaMissing(true);
          // Fallback to local
        } else {
          console.error('Supabase follower save error:', err);
          return { success: false, error: err.message || 'Erro ao registrar seguidores no Supabase.' };
        }
      }
    }

    // Local mode
    if (existing) {
      setFollowerHistory((prev) => {
        const updated = prev.map((f) =>
          f.id === existing.id
            ? { ...f, quantidade_seguidores: Math.round(quantidade_seguidores) }
            : f
        );
        saveLocalBackup('followers', updated);
        return updated;
      });
      return { success: true, updated: true, savedLocally: true };
    } else {
      const newRecord: FollowerHistory = {
        id: crypto.randomUUID(),
        user_id: user.id,
        page_id,
        data: dataDate,
        quantidade_seguidores: Math.round(quantidade_seguidores),
        created_at: new Date().toISOString(),
      };
      setFollowerHistory((prev) => {
        const updated = [...prev, newRecord].sort((a, b) => a.data.localeCompare(b.data));
        saveLocalBackup('followers', updated);
        return updated;
      });
      return { success: true, updated: false, savedLocally: true };
    }
  };

  const deleteFollowerRecord = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();

    if (supabase && !isSchemaMissing) {
      try {
        const { error: sbError } = await supabase
          .from('follower_history')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (sbError) {
          if (isTableMissingError(sbError)) {
            setIsSchemaMissing(true);
          } else {
            throw sbError;
          }
        }
      } catch (err: any) {
        if (!isTableMissingError(err)) {
          return { success: false, error: err.message || 'Erro ao excluir registro de seguidores.' };
        }
      }
    }

    setFollowerHistory((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      saveLocalBackup('followers', updated);
      return updated;
    });
    return { success: true };
  };

  // ==========================
  // FINANCIAL GOALS
  // ==========================
  const setMonthlyGoal = async (
    mes: string,
    meta_faturamento: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();

    const existing = goals.find((g) => g.mes === mes);

    if (supabase && !isSchemaMissing) {
      try {
        if (existing) {
          const { error: sbError } = await supabase
            .from('financial_goals')
            .update({
              meta_faturamento: Number(meta_faturamento),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .eq('user_id', user.id);
          if (sbError) {
            if (isTableMissingError(sbError)) {
              setIsSchemaMissing(true);
            } else {
              throw sbError;
            }
          }

          setGoals((prev) => {
            const updated = prev.map((g) =>
              g.id === existing.id ? { ...g, meta_faturamento: Number(meta_faturamento) } : g
            );
            saveLocalBackup('goals', updated);
            return updated;
          });
        } else {
          const { data: sbData, error: sbError } = await supabase
            .from('financial_goals')
            .insert({
              user_id: user.id,
              mes,
              meta_faturamento: Number(meta_faturamento),
            })
            .select('*')
            .single();
          if (sbError) {
            if (isTableMissingError(sbError)) {
              setIsSchemaMissing(true);
            } else {
              throw sbError;
            }
          }

          setGoals((prev) => {
            const updated = [...prev, (sbData as FinancialGoal) || {
              id: crypto.randomUUID(),
              user_id: user.id,
              mes,
              meta_faturamento: Number(meta_faturamento),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }];
            saveLocalBackup('goals', updated);
            return updated;
          });
        }
        return { success: true };
      } catch (err: any) {
        if (!isTableMissingError(err)) {
          return { success: false, error: err.message || 'Erro ao salvar meta no Supabase.' };
        }
      }
    }

    // Local fallback for goals
    if (existing) {
      setGoals((prev) => {
        const updated = prev.map((g) =>
          g.id === existing.id ? { ...g, meta_faturamento: Number(meta_faturamento) } : g
        );
        saveLocalBackup('goals', updated);
        return updated;
      });
    } else {
      const newGoal: FinancialGoal = {
        id: crypto.randomUUID(),
        user_id: user.id,
        mes,
        meta_faturamento: Number(meta_faturamento),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setGoals((prev) => {
        const updated = [...prev, newGoal];
        saveLocalBackup('goals', updated);
        return updated;
      });
    }
    return { success: true };
  };

  // Re-calculate dashboard metrics automatically whenever earnings or expenses change
  const metrics = calculateDashboardMetrics(earnings, expenses);

  return (
    <DataContext.Provider
      value={{
        pages,
        earnings,
        expenses,
        followerHistory,
        goals,
        metrics,
        loading,
        error,
        isSchemaMissing,
        refreshData: loadAllData,
        checkSchema,
        syncLocalDataToSupabase,
        createPage,
        updatePage,
        deletePage,
        createEarning,
        updateEarning,
        deleteEarning,
        createExpense,
        updateExpense,
        deleteExpense,
        recordFollowers,
        deleteFollowerRecord,
        setMonthlyGoal,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser utilizado dentro de um DataProvider');
  }
  return context;
};
