
export interface Seller {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  driveFolderUrl?: string;
}

export interface OrderOrigins {
  sfa_via_portal: number;
  heishop_b2b: number;
  total_pedidos: number;
}

/**
 * TESTE 5 — ESTRUTURA EXATA DAS COLUNAS (ATUALIZADO)
 * A ordem deve ser rigorosamente: DESCRIÇÃO, REFERÊNCIA, CAIXA/UNID, VALOR TOTAL, PREÇO MÉDIO, UN VOLUME.
 */
export interface Product {
  descricao: string;   // ex: CERV HEINEKEN... (Coluna 0-45)
  referencia: string;  // ex: CX - 24 (Coluna 46-60)
  caixa_unid: string;  // ex: 5 (Coluna 61-75)
  valor_total: string; // ex: 1.167,38 (Coluna 76-95)
  preco_medio: string; // ex: 233,48 (Coluna 96-115)
  un_volume: string;   // ex: 0,720 (Coluna 116-130)
}

export interface Report {
  id: string; 
  name: string;
  size?: string;
  seller: Seller;
  date: string; 
  status: 'ready' | 'processing' | 'error' | 'loading';
  source: 'drive' | 'local';
  file?: File; 
  pdfUrl?: string;
  products?: Product[];
  orderOrigins?: OrderOrigins;
  metrics?: {
    totalSales: number;
    totalVolume: number;
    totalWeight: number;
    totalOrders: number;
    totalItems: number;
    discount: number;
    blockedOrders: number;
    priceDivergence: number;
  };
}

export interface AppState {
  view: 'list' | 'dashboard';
  selectedReportId: string | null;
  searchQuery: string;
  isDarkMode: boolean;
  currentUser: User;
  isLoading: boolean;
  error: string | null;
}
