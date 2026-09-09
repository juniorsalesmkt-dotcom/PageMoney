export type PlatformType = 'Facebook' | 'Instagram' | 'TikTok' | 'YouTube' | 'Outra';

export type EarningOrigin = 'geral' | 'especifica';

export type RevenueSource =
  | 'Shopee Afiliados'
  | 'E-books'
  | 'Monetização de conteúdo'
  | 'Afiliados'
  | 'Publicidade'
  | 'Produtos próprios'
  | 'Outros';

export type ExpenseCategory =
  | 'Anúncios'
  | 'Ferramentas'
  | 'Design'
  | 'Edição'
  | 'Freelancer'
  | 'Domínio'
  | 'Hospedagem'
  | 'Outros';

export type PageStatus = 'Ativa' | 'Pausada' | 'Inativa';

export interface Profile {
  id: string;
  user_id: string;
  nome: string | null;
  email: string | null;
  created_at: string;
}

export interface ContentPage {
  id: string;
  user_id: string;
  nome: string;
  plataforma: PlatformType;
  nicho?: string | null;
  username?: string | null;
  url?: string | null;
  status: PageStatus;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Earning {
  id: string;
  user_id: string;
  page_id: string | null; // NULL when origem = 'geral'
  origem: EarningOrigin;
  fonte_receita: string;
  valor: number;
  data: string; // YYYY-MM-DD
  horario?: string | null;
  descricao?: string | null;
  created_at: string;
  updated_at: string;
  // Join helper
  page?: ContentPage | null;
}

export interface Expense {
  id: string;
  user_id: string;
  page_id: string | null;
  categoria: string;
  valor: number;
  data: string; // YYYY-MM-DD
  descricao?: string | null;
  created_at: string;
  updated_at: string;
  page?: ContentPage | null;
}

export interface FollowerHistory {
  id: string;
  user_id: string;
  page_id: string;
  data: string; // YYYY-MM-DD
  quantidade_seguidores: number;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  mes: string; // YYYY-MM
  meta_faturamento: number;
  created_at: string;
  updated_at: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'pages'
  | 'growth'
  | 'earnings'
  | 'expenses'
  | 'reports'
  | 'goals'
  | 'settings';

export interface DashboardMetrics {
  faturamentoHoje: number;
  faturamentoOntem: number;
  variacaoHojeOntemReais: number;
  variacaoHojeOntemPercentual: number | null;
  mensagemHojeOntem: string;
  faturamentoMes: number;
  faturamentoMesAnterior: number;
  variacaoMesReais: number;
  variacaoMesPercentual: number | null;
  mediaDiariaMes: number;
  diferencaHojeMediaDiaria: number;
  percentualHojeMediaDiaria: number | null;
  despesasMes: number;
  lucroLiquidoMes: number;
  margemLiquidaMes: number;
  totalGeralMes: number;
  totalAtribuidoMes: number;
}
