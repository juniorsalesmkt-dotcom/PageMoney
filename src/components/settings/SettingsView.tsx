import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Settings,
  Database,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SettingsViewProps {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onToast }) => {
  const { user, profile, isConfigured, updateProfileName } = useAuth();
  const { refreshData } = useData();
  const { theme, setTheme, isDark } = useTheme();

  const [nome, setNome] = useState(profile?.nome || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const res = await updateProfileName(nome);
    setSavingProfile(false);
    if (res.success) {
      onToast('Perfil atualizado com sucesso!');
    } else {
      onToast(res.error || 'Erro ao atualizar perfil.', 'error');
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
    onToast('Dados sincronizados com o banco de dados.');
  };

  const schemaTables = [
    { name: 'profiles', desc: 'Perfis de usuário e metadados' },
    { name: 'pages', desc: 'Páginas, canais, plataformas e nichos' },
    { name: 'earnings', desc: 'Lançamentos de faturamento (Geral e por página)' },
    { name: 'expenses', desc: 'Despesas e custos operacionais' },
    { name: 'follower_history', desc: 'Histórico diário de seguidores/inscritos' },
    { name: 'financial_goals', desc: 'Metas mensais de faturamento' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
          Configurações do Sistema
        </h2>
        <p className="text-xs text-neutral-500">
          Gerencie suas preferências de conta, integridade do banco de dados e conexão Supabase
        </p>
      </div>

      {/* Appearance / Theme Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-6">
        <h3 className="text-sm font-bold text-neutral-900 tracking-tight mb-1">
          Aparência e Tema
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Escolha entre o tema claro ou escuro para a interface do PageMoney. Sua preferência é salva automaticamente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          {/* Light Theme Option */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              !isDark
                ? 'border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900/10 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 block">Tema Claro</span>
                <span className="text-[10px] text-neutral-500">Interface nítida e clara</span>
              </div>
            </div>
            {!isDark && (
              <CheckCircle2 className="w-4 h-4 text-neutral-900 shrink-0" />
            )}
          </button>

          {/* Dark Theme Option */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              isDark
                ? 'border-sky-500 bg-slate-800 ring-2 ring-sky-500/20 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 block">Tema Escuro</span>
                <span className="text-[10px] text-neutral-500">Visual escuro e confortável</span>
              </div>
            </div>
            {isDark && (
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900">
                  Status do Banco de Dados (Supabase PostgreSQL)
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isConfigured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isConfigured ? 'Conectado & Real' : 'Modo Demonstração'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {isConfigured
                  ? 'O PageMoney está conectado a um banco PostgreSQL do Supabase com Row Level Security (RLS) ativo.'
                  : 'As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não foram preenchidas no ambiente. Adicione suas credenciais do Supabase para persistência permanente.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Sincronizar Banco
          </button>
        </div>

        {/* Database Tables Overview */}
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <span className="text-xs font-bold text-neutral-800 block mb-2">
            Tabelas Estruturadas no Banco de Dados
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {schemaTables.map((t) => (
              <div
                key={t.name}
                className="p-2.5 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-neutral-900 block">
                    {t.name}
                  </span>
                  <span className="text-[10px] text-neutral-500">{t.desc}</span>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-6">
        <h3 className="text-sm font-bold text-neutral-900 tracking-tight mb-1">
          Perfil do Usuário
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Informações cadastrais e credenciais do PageMoney
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Seu Nome Completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="block w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              E-mail de Acesso
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="block w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Moeda Padrão
              </label>
              <input
                type="text"
                disabled
                value="BRL (R$ - Real Brasileiro)"
                className="block w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Fuso Horário
              </label>
              <input
                type="text"
                disabled
                value="America/Sao_Paulo"
                className="block w-full px-3 py-2 text-xs border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 active:scale-[0.98] transition shadow-xs disabled:opacity-50"
            >
              {savingProfile ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </form>
      </div>

      {/* SQL Script Quick Access */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs p-6">
        <h3 className="text-sm font-bold text-neutral-900 tracking-tight mb-1">
          Arquivo de Schema SQL (`/supabase/schema.sql`)
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          O script SQL completo com todas as tabelas, índices e políticas de Row Level Security (RLS) está salvo no projeto em <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono">/supabase/schema.sql</code> para você executar no SQL Editor do seu projeto Supabase.
        </p>
        <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl text-xs text-neutral-700 space-y-1">
          <p className="font-semibold text-neutral-900">Como conectar seu banco Supabase:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-600">
            <li>Crie um projeto no Supabase (gratuito).</li>
            <li>No Supabase, acesse o <strong>SQL Editor</strong> e execute o script contido em <code className="font-mono">/supabase/schema.sql</code>.</li>
            <li>Obtenha sua <strong>Project URL</strong> e <strong>Publishable API Key</strong> (ou Anon Key) em <em>Settings &gt; API</em>.</li>
            <li>Preencha as variáveis de ambiente <code className="font-mono">VITE_SUPABASE_URL</code> e <code className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
