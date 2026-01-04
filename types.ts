
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

/**
 * TESTE 5 — ESTRUTURA EXATA DAS COLUNAS
 * A ordem e os nomes das propriedades devem ser idênticos aos testes.
 */
export interface Product {
  produto: string;     // ex: 021/001
  descricao: string;   // ex: CERV HEINEKEN...
  referencia: string;  // ex: CX - 24
  caixa_unid: string;  // ex: 5
  valor_total: string; // ex: 1.167,38
  preco_medio: string; // ex: 233,48
  un_volume: string;   // ex: 0,720
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
