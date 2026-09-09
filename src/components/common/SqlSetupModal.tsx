import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { SUPABASE_SCHEMA_SQL } from '../../data/schemaSql';
import { useData } from '../../context/DataContext';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const SqlSetupModal: React.FC<SqlSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const { checkSchema, syncLocalDataToSupabase, isSchemaMissing } = useData();
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [showSqlCode, setShowSqlCode] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = SUPABASE_SCHEMA_SQL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleCheckConnection = async () => {
    setTesting(true);
    setTestResult({ status: 'idle', message: '' });
    try {
      const ok = await checkSchema();
      if (ok) {
        // Run sync
        const syncRes = await syncLocalDataToSupabase();
        setTestResult({
          status: 'success',
          message: syncRes.count
            ? `Tabelas detectadas! ${syncRes.count} registros locais foram sincronizados com a nuvem.`
            : 'Tabelas detectadas com sucesso no Supabase! Seu banco está 100% ativo.',
        });
        onSuccessToast?.('Supabase configurado e sincronizado com sucesso!');
      } else {
        setTestResult({
          status: 'error',
          message:
            "As tabelas ainda não foram encontradas. Certifique-se de ter colado o SQL no SQL Editor do Supabase e clicado em 'Run'.",
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Erro ao verificar tabelas.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Ativar Tabelas no Supabase
              </h3>
              <p className="text-xs text-neutral-500">
                Projeto: <span className="font-mono">jzxvgeaxeftwicavvbeb</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Safe Mode Notice */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Seus dados estão protegidos</p>
              <p className="text-emerald-700 mt-0.5">
                O PageMoney continua funcionando perfeitamente salvando todas as páginas,
                faturamentos e despesas no seu navegador. Ao executar o script SQL abaixo, todos os dados locais serão sincronizados com a nuvem automaticamente.
              </p>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Como ativar em 3 passos simples
            </h4>

            <div className="space-y-2.5 text-xs text-neutral-700">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    1
                  </span>
                  <span>Copie o script com a estrutura completa das tabelas</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-xs'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar SQL
                    </>
                  )}
                </button>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    2
                  </span>
                  <span>Abra o SQL Editor do seu projeto Supabase e cole o código</span>
                </div>
                <a
                  href="https://supabase.com/dashboard/project/jzxvgeaxeftwicavvbeb/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Editor
                </a>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  3
                </span>
                <span>
                  No Supabase, clique no botão verde <strong className="text-emerald-700">Run</strong> no canto inferior direito.
                </span>
              </div>
            </div>
          </div>

          {/* SQL Preview Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowSqlCode(!showSqlCode)}
              className="text-xs text-neutral-600 hover:text-neutral-900 font-medium underline cursor-pointer"
            >
              {showSqlCode ? 'Ocultar código SQL' : 'Visualizar código SQL completo'}
            </button>

            {showSqlCode && (
              <div className="mt-2 relative">
                <pre className="p-3 bg-neutral-900 text-neutral-200 text-[11px] rounded-xl font-mono overflow-x-auto max-h-48">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 bg-neutral-800 text-neutral-200 hover:text-white rounded-lg text-xs flex items-center gap-1 border border-neutral-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            )}
          </div>

          {/* Test Status feedback */}
          {testResult.status === 'success' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}

          {testResult.status === 'error' && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Fechar e Continuar em Modo Local
          </button>

          <button
            type="button"
            onClick={handleCheckConnection}
            disabled={testing}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Verificando tabelas...' : 'Verificar e Sincronizar'}
          </button>
        </div>
      </div>
    </div>
  );
};
