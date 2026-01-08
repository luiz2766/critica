
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import ReportList from './components/ReportList';
import DashboardView from './components/DashboardView';
import StatsGrid from './components/StatsGrid';
import Footer from './components/Footer';
import { AppState, Report, Product, OrderOrigins } from './types';
import { DriveService } from './services/driveService';
import { MOCK_REPORTS } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'list',
    selectedReportId: null,
    searchQuery: '',
    isDarkMode: false,
    isLoading: false,
    error: null,
    currentUser: {
      name: 'Luiz Henrique',
      email: 'luizhenrique2766@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luiz',
      driveFolderUrl: 'https://drive.google.com/drive/folders/18X3ZLJj2TQJ58nhB3VoyDhC-6WLdUDRy'
    }
  });

  const [reports, setReports] = useState<Report[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Helper: Conversão de arquivo para Base64 (necessário para o Gemini)
   */
  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  /**
   * PIPELINE ÚNICO: Extração Determinística de Dados
   * Centraliza a lógica de análise do Gemini para Drive e Local.
   * Mantém a ordem exata das colunas: DESCRIÇÃO, REFERÊNCIA, CAIXA/UNID, VALOR TOTAL, PREÇO MÉDIO, UN VOLUME.
   */
  const extractPdfDataPipeline = async (file: File | Blob): Promise<{ products: Product[], origins: OrderOrigins }> => {
const response = await fetch("/api/analisar-pdf", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    base64Pdf: base64Data
  })
});

const result = await response.json();
const text = result.text; `Aja como um extrator de dados altamente preciso. 
Localize o bloco 'RESUMO FINAL' no PDF. 
Para cada produto no bloco, extraia exatamente nesta ordem:
1. Descrição (nome do produto)
2. Referência (ex: CX-24, UN-1)
3. Caixa/Unid (quantidade)
4. Valor Total (monetário)
5. Preço Médio (monetário)
6. Un Volume (valor decimal)

Também extraia as contagens de origens:
- SFA_COUNT: ocorrências de "Origem: R = SFA via portal"
- HEISHOP_COUNT: ocorrências de "Origem: G = Pedido Heishop (B2B)"

Formate a resposta como JSON estrito:
{
  "products": [
    {
      "descricao": "...",
      "referencia": "...",
      "caixa_unid": "...",
      "valor_total": "...",
      "preco_medio": "...",
      "un_volume": "..."
    }
  ],
  "sfa_count": 0,
  "heishop_count": 0
}` },
          { inlineData: { data: base64Data, mimeType: 'application/pdf' } }
        ]
      }
    });

    try {
      // O SDK Gemini retorna a resposta em .text
      const text = response.text;
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const data = JSON.parse(jsonStr);

      return {
        products: data.products || [],
        origins: {
          sfa_via_portal: data.sfa_count || 0,
          heishop_b2b: data.heishop_count || 0,
          total_pedidos: (data.sfa_count || 0) + (data.heishop_count || 0)
        }
      };
    } catch (e) {
      console.error("Falha no parse do JSON da IA, tentando fallback manual:", e);
      // Fallback para o método de linhas caso a IA falhe em retornar JSON limpo
      return fallbackExtraction(response.text);
    }
  };

  /**
   * Fallback: Caso a IA não retorne JSON perfeito
   */
  const fallbackExtraction = (text: string) => {
    const lines = text.split('\n');
    let products: Product[] = [];
    let sfa = 0;
    let b2b = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('SFA_COUNT:')) sfa = parseInt(trimmed.split(':')[1]) || 0;
      if (trimmed.startsWith('HEISHOP_COUNT:')) b2b = parseInt(trimmed.split(':')[1]) || 0;
      
      const product = parseRawLine(trimmed);
      if (product) products.push(product);
    });

    return {
      products,
      origins: { sfa_via_portal: sfa, heishop_b2b: b2b, total_pedidos: sfa + b2b }
    };
  };

  /**
   * Helper: Parsing de linha bruta para objeto Product (usado em fallback)
   */
  const parseRawLine = (line: string): Product | null => {
    const normalized = line.trim();
    if (normalized.length < 30) return null;

    const refMatch = normalized.match(/(CX|EB|UN|LN|SHR|BAR|LAT|LATAS)\s*-\s*\d+/i);
    if (!refMatch) return null;

    const refIndex = normalized.indexOf(refMatch[0]);
    const descricao = normalized.substring(0, refIndex).trim();
    const afterRef = normalized.substring(refIndex + refMatch[0].length).trim();
    const parts = afterRef.split(/\s+/).filter(p => p.length > 0);

    if (parts.length < 4) return null;

    return {
      descricao,
      referencia: refMatch[0],
      caixa_unid: parts[0] || "0",
      valor_total: parts[1] || "0,00",
      preco_medio: parts[2] || "0,00",
      un_volume: parts[3] || "0,000"
    };
  };

  /**
   * Handlers
   */
  const handleSelectReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (report.products && report.products.length > 0) {
        setState(prev => ({ ...prev, selectedReportId: reportId, view: 'dashboard', isLoading: false }));
        return;
      }

      const fileBlob = report.source === 'drive' 
        ? await DriveService.downloadFile(report.id) 
        : report.file as File;
          
      const { products, origins } = await extractPdfDataPipeline(fileBlob);
      
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, products, orderOrigins: origins } : r));
      setState(prev => ({ ...prev, selectedReportId: reportId, view: 'dashboard', isLoading: false }));
    } catch (err: any) {
      console.error("Pipeline Error:", err);
      setState(prev => ({ ...prev, isLoading: false, error: `Erro na análise: ${err.message}` }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { products, origins } = await extractPdfDataPipeline(file);
      const fileId = `local_${Date.now()}`;
      
      const newReport: Report = {
        id: fileId,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        date: new Date().toLocaleDateString('pt-BR'),
        status: 'ready',
        source: 'local',
        file: file,
        seller: { id: 'u1', name: state.currentUser.name, avatar: state.currentUser.avatar, email: state.currentUser.email },
        products,
        orderOrigins: origins
      };

      setReports(prev => [newReport, ...prev]);
      setState(prev => ({ ...prev, selectedReportId: fileId, view: 'dashboard', isLoading: false }));
    } catch (err: any) {
      console.error("Upload Error:", err);
      setState(prev => ({ ...prev, isLoading: false, error: `Falha na importação: ${err.message}` }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const syncDrive = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const driveFiles = await DriveService.listFiles();
      setReports(driveFiles);
    } catch (e: any) {
      console.error('Sync Error:', e);
      if (reports.length === 0) setReports(MOCK_REPORTS);
      setState(prev => ({ ...prev, error: `Erro na sincronização: ${e.message}` }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    DriveService.init();
    document.documentElement.classList.toggle('dark', state.isDarkMode);
  }, [state.isDarkMode]);

  const filteredReports = useMemo(() => 
    reports.filter(r => r.name.toLowerCase().includes(state.searchQuery.toLowerCase())), 
    [reports, state.searchQuery]
  );
  
  const selectedReport = useMemo(() => 
    reports.find(r => r.id === state.selectedReportId) || null, 
    [reports, state.selectedReportId]
  );

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header 
        isDarkMode={state.isDarkMode} 
        toggleDarkMode={() => setState(p => ({ ...p, isDarkMode: !p.isDarkMode }))}
        onLogoClick={() => setState(p => ({ ...p, view: 'list', selectedReportId: null }))}
        currentUser={state.currentUser}
        onSwitchUser={(u) => { setState(prev => ({ ...prev, currentUser: u })); setReports([]); }} 
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-red-700 dark:text-red-400 font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined">report_problem</span>
            {state.error}
            <button onClick={() => setState(p => ({...p, error: null}))} className="ml-auto">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {state.isLoading && (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-500">
            <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="font-black text-primary tracking-widest uppercase text-xs">Analisando documento...</p>
          </div>
        )}

        {!state.isLoading && state.view === 'list' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-3xl font-black text-text-main-light dark:text-text-main-dark">Analytics Dashboard</h1>
                <p className="text-text-secondary-light italic">Selecione um relatório PDF para iniciar a análise.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="px-6 py-3 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl font-bold flex items-center gap-2 hover:border-primary hover:text-primary transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined">upload_file</span> Local
                </button>
                <button 
                  onClick={syncDrive} 
                  className="px-6 py-3 bg-primary text-background-dark rounded-xl font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">sync</span> Sincronizar Drive
                </button>
              </div>
            </div>
            
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary-light">search</span>
              <input 
                type="text" 
                placeholder="Filtrar por nome do relatório..."
                value={state.searchQuery}
                onChange={(e) => setState(p => ({...p, searchQuery: e.target.value}))}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-bold shadow-sm"
              />
            </div>

            <ReportList reports={filteredReports} onAnalyse={handleSelectReport} />
            <StatsGrid />
          </div>
        )}

        {!state.isLoading && state.view === 'dashboard' && selectedReport && (
          <DashboardView report={selectedReport} onBack={() => setState(p => ({ ...p, view: 'list', selectedReportId: null }))} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
