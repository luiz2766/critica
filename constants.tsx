
import { Report } from './types';

export const MOCK_REPORTS: Report[] = [
  {
    id: 'p1',
    name: 'Projeto_Executivo_Residencial_V1.pdf',
    size: '4.5 MB',
    date: '18 Mai, 2024',
    status: 'ready',
    source: 'drive',
    seller: {
      id: 'lh1',
      name: 'Luiz Henrique',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luiz',
      email: 'luizhenrique2766@gmail.com'
    },
    // Fix: Updated metrics to match the required fields in types.ts
    metrics: {
      totalSales: 85000,
      totalVolume: 15.5,
      totalWeight: 1200,
      totalOrders: 10,
      totalItems: 5,
      discount: 100,
      blockedOrders: 0,
      priceDivergence: 0
    }
  },
  {
    id: 'p2',
    name: 'Cronograma_Geral_Obras_Fase2.pdf',
    size: '1.2 MB',
    date: '15 Mai, 2024',
    status: 'ready',
    source: 'drive',
    seller: {
      id: 'lh1',
      name: 'Luiz Henrique',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luiz',
      email: 'luizhenrique2766@gmail.com'
    },
    // Fix: Updated metrics to match the required fields in types.ts
    metrics: {
      totalSales: 0,
      totalVolume: 0,
      totalWeight: 0,
      totalOrders: 0,
      totalItems: 0,
      discount: 0,
      blockedOrders: 0,
      priceDivergence: 0
    }
  },
  {
    id: 'p3',
    name: 'Orcamento_Material_Construcao_A3.pdf',
    size: '890 KB',
    date: '12 Mai, 2024',
    status: 'ready',
    source: 'drive',
    seller: {
      id: 's3',
      name: 'Carlos Pereira',
      avatar: 'https://picsum.photos/id/66/100/100',
      email: 'carlos.pereira@company.com'
    },
    // Fix: Updated metrics to match the required fields in types.ts
    metrics: {
      totalSales: 12400,
      totalVolume: 22.1,
      totalWeight: 450,
      totalOrders: 5,
      totalItems: 3,
      discount: 50,
      blockedOrders: 1,
      priceDivergence: 0
    }
  }
];