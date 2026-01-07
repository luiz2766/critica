
import { Report } from '../types';

declare var google: any;

const CLIENT_ID = '205757630427-htuvvvma2se9rnect9mdoc4e1if3a37g.apps.googleusercontent.com';
const FOLDER_ID = '18X3ZLJj2TQJ58nhB3VoyDhC-6WLdUDRy';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let accessToken: string | null = null;
let tokenClient: any = null;
let authPromiseResolve: ((value: string) => void) | null = null;
let authPromiseReject: ((reason: any) => void) | null = null;

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
                console.error('OAuth Error:', response.error);
                authPromiseReject?.(new Error(`Erro Google Auth: ${response.error}`));
                return;
              }
              accessToken = response.access_token;
              if (authPromiseResolve) {
                authPromiseResolve(response.access_token);
                authPromiseResolve = null;
                authPromiseReject = null;
              }
            },
          });
          console.log('Google Identity Services Initialized');
        } catch (e) {
          console.error('GIS Init Error:', e);
        }
      }
    }, 500);

    // Timeout de 10 segundos para desistir de carregar o script do Google
    setTimeout(() => clearInterval(checkGoogle), 10000);
  }

  static authorize(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!tokenClient) {
        this.init();
        // Dá uma pequena margem para o init tentar carregar antes de rejeitar
        setTimeout(() => {
          if (!tokenClient) reject(new Error('Serviço do Google ainda não está disponível. Recarregue a página.'));
          else {
            authPromiseResolve = resolve;
            authPromiseReject = reject;
            tokenClient.requestAccessToken({ prompt: 'select_account' });
          }
        }, 1000);
        return;
      }
      authPromiseResolve = resolve;
      authPromiseReject = reject;
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }

  static async downloadFile(fileId: string): Promise<Blob> {
    if (!accessToken) throw new Error('Sessão expirada ou não autorizada. Sincronize novamente.');
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Não foi possível baixar o PDF para análise.`);
    }
    
    return await response.blob();
  }

  static async listFiles(): Promise<Report[]> {
    if (!accessToken) {
      // Tenta autorizar caso o token não exista
      await this.authorize();
    }

    // Query para buscar PDFs na pasta específica
    const query = encodeURIComponent(`'${FOLDER_ID}' in parents and mimeType='application/pdf' and trashed=false`);
    const fields = encodeURIComponent('files(id,name,size,modifiedTime,webViewLink)');
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      const err = await response.json();
      if (response.status === 401) {
        accessToken = null; // Token expirado
        return this.listFiles(); // Tenta re-autorizar
      }
      throw new Error(err.error?.message || 'Erro ao comunicar com Google Drive API');
    }
    
    const data = await response.json();
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      pdfUrl: file.webViewLink,
      size: file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : 'Tamanho desconhecido',
      date: new Date(file.modifiedTime).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      status: 'ready' as const,
      source: 'drive' as const,
      seller: { 
        id: 'lh1', 
        name: 'Luiz Henrique', 
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luiz', 
        email: 'luizhenrique2766@gmail.com' 
      },
      products: [] 
    }));
  }
}
