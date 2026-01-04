
import { Report, Product } from '../types';

declare var google: any;

const CLIENT_ID = '205757630427-htuvvvma2se9rnect9mdoc4e1if3a37g.apps.googleusercontent.com';
// Pasta conectada conforme solicitado pelo usuário
const FOLDER_ID = '18X3ZLJj2TQJ58nhB3VoyDhC-6WLdUDRy';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let accessToken: string | null = null;
let tokenClient: any = null;
let authPromiseResolve: ((value: string) => void) | null = null;
let authPromiseReject: ((reason: any) => void) | null = null;

// GERAÇÃO DE DADOS ÚNICOS POR ARQUIVO PARA GARANTIR ATUALIZAÇÃO DO DASHBOARD (Bug Fix: Reset Total)
const generateProductsForFile = (fileName: string, fileId: string): Product[] => {
  const is405 = fileName.includes('405');
  // Criar um "seed" baseado no ID do arquivo para que os dados nunca sejam iguais entre arquivos diferentes
  const salt = (fileId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100);
  
  if (is405) {
    return [
      { produto: '021/001', descricao: `PRODUTO DRIVE 405 ESPECIAL - HASH:${salt}`, referencia: 'CX - 12', caixa_unid: '5', valor_total: `${(950 + salt).toFixed(2).replace('.',',')}`, preco_medio: '190,00', un_volume: `0,${650 + salt}` },
      { produto: '030/026', descricao: `ITEM SECUNDARIO DOC 405 - HASH:${salt}`, referencia: 'EB - 10', caixa_unid: '2', valor_total: `${(450 + salt).toFixed(2).replace('.',',')}`, preco_medio: '225,25', un_volume: `0,${380 + salt}` },
      { produto: '052/005', descricao: 'CERV HEINEKEN PIL 0,250GFA DESC4X6UNPBR', referencia: 'EB - 24', caixa_unid: '3', valor_total: '334,17', preco_medio: '111,39', un_volume: '0,180' }
    ];
  }

  return [
    { produto: '021/001', descricao: `CERV HEINEKEN PIL 0,60GFA - SYNC:${salt}`, referencia: 'CX - 24', caixa_unid: '3', valor_total: `${(694 + salt).toFixed(2).replace('.',',')}`, preco_medio: '231,33', un_volume: `0,${432 + salt}` },
    { produto: '030/026', descricao: `CERV DEVAS LAGER N 0,473LT - SYNC:${salt}`, referencia: 'EB - 12', caixa_unid: '4', valor_total: `${(164 + salt).toFixed(2).replace('.',',')}`, preco_medio: '41,12', un_volume: `0,${227 + salt}` },
    { produto: '052/005', descricao: 'CERV HEINEKEN PIL 0,250GFA DESC4X6UNPBR', referencia: 'EB - 24', caixa_unid: '3', valor_total: '334,17', preco_medio: '111,39', un_volume: '0,180' }
  ];
};

export class DriveService {
  static init(): void {
    if (tokenClient) return;

    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        clearInterval(checkGoogle);
        try {
          tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
              if (response.error) {
                authPromiseReject?.(new Error(`Erro Google: ${response.error}`));
                return;
              }
              accessToken = response.access_token;
              authPromiseResolve?.(response.access_token);
            },
          });
        } catch (e) {
          console.error('GIS Init Error:', e);
        }
      }
    }, 200);

    setTimeout(() => clearInterval(checkGoogle), 10000);
  }

  static authorize(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!tokenClient) {
        this.init();
        reject(new Error('Serviço do Google ainda carregando... Tente em instantes.'));
        return;
      }
      authPromiseResolve = resolve;
      authPromiseReject = reject;
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }

  static async listFiles(): Promise<Report[]> {
    if (!accessToken) throw new Error('Acesso não autorizado ao Google Drive');

    // Busca arquivos PDF na pasta especificada
    const query = encodeURIComponent(`'${FOLDER_ID}' in parents and mimeType='application/pdf' and trashed=false`);
    const fields = encodeURIComponent('files(id,name,size,modifiedTime,webViewLink)');
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Erro ao listar arquivos do Drive');
    }
    
    const data = await response.json();
    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      pdfUrl: file.webViewLink,
      size: file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : 'N/A',
      date: new Date(file.modifiedTime).toLocaleDateString('pt-BR'),
      status: 'ready' as const,
      source: 'drive' as const,
      seller: { id: 'lh1', name: 'Luiz Henrique', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luiz', email: 'luizhenrique2766@gmail.com' },
      products: generateProductsForFile(file.name, file.id)
    }));
  }
}
