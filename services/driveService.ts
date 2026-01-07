
import { Report, Product } from '../types';

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
        reject(new Error('Serviço do Google ainda carregando...'));
        return;
      }
      authPromiseResolve = resolve;
      authPromiseReject = reject;
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }

  static async downloadFile(fileId: string): Promise<Blob> {
    if (!accessToken) throw new Error('Acesso não autorizado ao Google Drive');
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      throw new Error('Falha ao baixar o arquivo para extração.');
    }
    
    return await response.blob();
  }

  static async listFiles(): Promise<Report[]> {
    if (!accessToken) throw new Error('Acesso não autorizado ao Google Drive');

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
      products: [] // Será preenchido sob demanda na seleção via Gemini
    }));
  }
}
