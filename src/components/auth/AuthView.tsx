import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSupabaseConfigStatus } from '../../lib/supabase';
import { KeyRound, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle, Database } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface AuthViewProps {
  onOpenSettings?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onOpenSettings }) => {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();
  const configStatus = getSupabaseConfigStatus();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      const res = await resetPassword(email);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      }
      return;
    }

    if (!senha) {
      setError('Por favor, informe sua senha.');
      return;
    }

    if (mode === 'register') {
      if (!nome) {
        setError('Por favor, informe seu nome completo.');
        return;
      }
      if (senha.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (senha !== confirmarSenha) {
        setError('As senhas não conferem.');
        return;
      }

      setLoading(true);
      const res = await signUp(email, senha, nome);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage('Conta criada com sucesso! Você já pode entrar.');
        setMode('login');
      }
      return;
    }

    // Login
    setLoading(true);
    const res = await signIn(email, senha);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle showLabel={false} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xl tracking-tight">PM</span>
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900">
          PageMoney
        </h2>
        <p className="mt-1.5 text-center text-sm text-neutral-500">
          Controle financeiro e crescimento para páginas de conteúdo
        </p>

        {!isConfigured && (
          <div className="mt-4 mx-4 p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Supabase não configurado no .env</p>
                <p className="text-amber-800 mt-0.5">
                  Para ativar o login e salvar os dados na nuvem, defina as variáveis no ambiente:
                </p>
                <div className="mt-2 space-y-1 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className={configStatus.hasUrl && configStatus.urlValid ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                      {configStatus.hasUrl && configStatus.urlValid ? '✓' : '✗'}
                    </span>
                    <span>VITE_SUPABASE_URL</span>
                    <span className="text-neutral-500 font-sans text-[10px]">
                      {configStatus.hasUrl ? (configStatus.urlValid ? '(configurado)' : '(deve ser https://...)') : '(ausente)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={configStatus.hasKey ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                      {configStatus.hasKey ? '✓' : '✗'}
                    </span>
                    <span>VITE_SUPABASE_PUBLISHABLE_KEY</span>
                    <span className="text-neutral-500 font-sans text-[10px]">
                      {configStatus.hasKey ? '(configurado)' : '(ausente)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {onOpenSettings && (
              <div className="self-end">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium text-[11px] transition-colors"
                >
                  Ver Instruções
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 border border-neutral-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
            <h3 className="text-lg font-semibold text-neutral-900">
              {mode === 'login' && 'Entrar na sua conta'}
              {mode === 'register' && 'Criar conta no PageMoney'}
              {mode === 'forgot' && 'Recuperar senha'}
            </h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              Supabase Auth
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-sm text-rose-800">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-sm text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Nome completo
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome ou criador"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                E-mail
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden transition"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-700">
                    Senha
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden transition"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Confirmar senha
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'register' && 'Criar conta'}
                  {mode === 'forgot' && 'Enviar link de recuperação'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-100 text-center text-xs text-neutral-500">
            {mode === 'login' && (
              <p>
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  Criar conta
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p>
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  Entrar
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <p>
                Lembrou da senha?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  Voltar ao login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
