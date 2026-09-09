import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileName: (nome: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());

  const fetchProfile = async (currentUser: User) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      } else if (!error) {
        // Upsert fallback profile if trigger didn't catch it
        const newProfile = {
          user_id: currentUser.id,
          nome: currentUser.user_metadata?.nome || currentUser.email?.split('@')[0] || 'Usuário',
          email: currentUser.email || '',
        };
        const { data: created } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select('*')
          .single();
        if (created) setProfile(created as Profile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: 'Supabase não está configurado. Insira suas credenciais nas configurações.' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        await fetchProfile(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Erro ao realizar login.' };
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    name: string
  ): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: 'Supabase não está configurado. Insira suas credenciais nas configurações.' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            nome: name.trim(),
          },
        },
      });
      if (error) {
        return { error: error.message };
      }
      if (data.user) {
        // Create profile directly in profiles table if needed
        await supabase.from('profiles').upsert({
          user_id: data.user.id,
          nome: name.trim(),
          email: email.trim(),
        });
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Erro ao criar conta.' };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: 'Supabase não está configurado.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Erro ao enviar e-mail de recuperação.' };
    }
  };

  const signOut = async (): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const updateProfileName = async (
    nome: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' };
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase não configurado.' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nome: nome.trim() })
        .eq('user_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      setProfile((prev) =>
        prev
          ? { ...prev, nome: nome.trim() }
          : {
              id: user.id,
              user_id: user.id,
              nome: nome.trim(),
              email: user.email || '',
              moeda_padrao: 'BRL',
              timezone: 'America/Sao_Paulo',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar perfil.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured,
        signIn,
        signUp,
        resetPassword,
        signOut,
        refreshProfile,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
