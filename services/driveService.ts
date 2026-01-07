
import { Report } from '../types';

declare var google: any;

const CLIENT_ID = '205757630427-htuvvvma2se9rnect9mdoc4e1if3a37g.apps.googleusercontent.com';
const FOLDER_ID = '18X3ZLJj2TQJ58nhB3VoyDhC-6WLdUDRy';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let accessToken: string | null = null;
let tokenClient: any = null;

export class DriveService {
  static init(): void {
    if (tokenClient) return;

    const attemptInit = () => {
      try {
        if (typeof google !== 'undefined' && google.accounts?.oauth2) {
          tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
              if (response.access_token) accessToken = response.access_token;
            },
          });
          console.log("Drive API Initialized");
        } else {
          setTimeout(attemptInit, 1000);
        }
      } catch (e) {
        console.warn("Retrying Drive Init...");
        setTimeout(attemptInit, 2000);
      }
    };

    attemptInit();
  }

  static async authorize(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!tokenClient) return reject(new Error("API do Google não carregada."));
      
      const prevCallback = tokenClient.callback;
      tokenClient.callback = (resp: any) => {
        if (resp.error) reject(new Error(resp.error));
        accessToken = resp.access_token;
        resolve(resp.access_token);
        tokenClient.callback = prevCallback;
      };
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  }

  static async listFiles(): Promise<Report[]> {
    if (!accessToken) await this.authorize();

    const query = encodeURIComponent(`'${FOLDER_ID}' in parents and mimeType='application/pdf' and trashed=false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,modifiedTime,webViewLink)&orderBy=modifiedTime desc`;
    
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!resp.ok) throw new Error("Falha na listagem do Drive");
    
    const data = await resp.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      pdfUrl: f.webViewLink,
      size: f.size ? `${(parseInt(f.size) / 1024 / 1024).toFixed(2)} MB` : "N/A",
      date: new Date(f.modifiedTime).toLocaleDateString('pt-BR'),
      status: 'ready',
      source: 'drive',
      seller: { id: '1', name: 'Luiz', avatar: '', email: '' },
      products: []
    }));
  }

  static async downloadFile(fileId: string): Promise<Blob> {
    if (!accessToken) await this.authorize();
    const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return resp.blob();
  }
}
