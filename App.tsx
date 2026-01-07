
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import ReportList from './components/ReportList';
import DashboardView from './components/DashboardView';
import StatsGrid from './components/StatsGrid';
import Footer from './components/Footer';
import { AppState, Report, Product, OrderOrigins } from './types';
import { DriveService } from './services/driveService';
import { MOCK_REPORTS } from './constants';
import { GoogleGenAI } from "@google/genai";

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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const extractDataWithGemini = async (file: File | Blob): Promise<{ tableLines: string[], origins: OrderOrigins }> => {
    const base64Data = await fileToBase64(file);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Usando tipagem genérica para evitar erros de importação de classes/interfaces específicas do SDK
    const response: any = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: `Extraia o 'RESUMO FINAL' deste PDF. 
Retorne as linhas brutas preservando a ordem: Descrição, Referência, Caixa/Unid, Valor Total, Preço Médio, Un Volume.
Localize as quantidades de origens:
- "Origem: R = SFA via portal"
- "Origem: G = Pedido Heishop (B2B)"

FORMATO:
[TABELA_INI]
(dados)
[TABELA_FIM]
SFA_COUNT: (total)
HEISHOP_COUNT: (total)` },
          { inlineData: { data: base64Data, mimeType: 'application/pdf' } }
        ]
      }
    });

    const text = response.text || "";
    const lines = text.split('\n');
    
    let tableLines: string[] = [];
    let inTable = false;
    let sfa = 0;
    let b2b = 0;

    lines.forEach((line: string) => {
      if (line.includes('[TABELA_INI]')) { inTable = true; return; }
      if (line.includes('[TABELA_FIM]')) { inTable = false; return; }
      if (inTable) tableLines.push(line);
      else {
        const trimmed = line.trim();
        if (trimmed.startsWith('SFA_COUNT:')) sfa = parseInt(trimmed.split(':')[1]) || 0;
        if (trimmed.startsWith('HEISHOP_COUNT:')) b2b = parseInt(trimmed.split(':')[1]) || 0;
      }
    });

    return { 
      tableLines, 
      origins: { sfa_via_portal: sfa, heishop_b2b: b2b, total_pedidos: sfa + b2b } 
    };
  };

  const parseRawLine = (line: string): Product | null => {
    const normalized = line.trim();
    if (normalized.length < 30) return null;

    // Âncora: Referência (CX-24, EB-12, etc)
    const refMatch = normalized.match(/(CX|EB|UN|LN|SHR|BAR|LAT|LATAS)\s*-\s*\d+/i);
    if (!refMatch) return null;

    const refIndex = normalized.indexOf(refMatch[0]);
    const descricao = normalized.substring(0, refIndex).trim();
    const afterRef = normalized.substring(refIndex + refMatch[0].length).trim();
    const parts = afterRef.split(/\s+/).filter(p => p.length > 0);

    return {
      descricao,
      referencia: refMatch[0],
      caixa_unid: parts[0] || "0",
      valor_total: parts[1] || "0,00",
      preco_medio: parts[2] || "0,00",
      un_volume: parts[3] || "0,000"
    };
  };

  const handleSelectReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let products = report.products || [];
      let orderOrigins = report.orderOrigins;

      if (products.length === 0) {
        const fileBlob = report.source === 'drive' 
          ? await DriveService.downloadFile(report.id) 
          : report.file as File;
          
        const { tableLines, origins } = await extractDataWithGemini(fileBlob);
        products = tableLines.map(parseRawLine).filter((p): p is Product => p !== null);
        orderOrigins = origins;
        
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, products, orderOrigins } : r));
      }

      setState(prev => ({ ...prev, selectedReportId: reportId, view: 'dashboard', isLoading: false }));
    } catch (err: any) {
      console.error("Selection Error:", err);
      setState(prev => ({ ...prev, isLoading: false, error: `Erro na análise do PDF: ${err.message}` }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { tableLines, origins } = await extractDataWithGemini(file);
      const products = tableLines.map(parseRawLine).filter((p): p is Product => p !== null);

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
      setState(prev => ({ ...prev, isLoading: false, error: `Falha na importação: ${err.message}` }));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const syncDrive = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const driveFiles = await DriveService.listFiles();
      setReports(driveFiles);
      setIsAuthorized(true);
    } catch (e: any) {
      console.error('Sync Error:', e);
      // Fallback para mock apenas se for erro de autorização cancelada ou similar
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
    <div className="min-h-screen flex flex-col">
      <Header 
        isDarkMode={state.isDarkMode} 
        toggleDarkMode={() => setState(p => ({ ...p, isDarkMode: !p.isDarkMode }))}
        onLogoClick={() => setState(p => ({ ...p, view: 'list', selectedReportId: null }))}
        currentUser={state.currentUser}
        onSwitchUser={(u) => { setState(prev => ({ ...prev, currentUser: u })); setReports([]); }} 
      />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-red-700 dark:text-red-400 font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-sm animate-in fade-in duration-300">
            <span className="material-symbols-outlined">report_problem</span>
            {state.error}
            <button onClick={() => setState(p => ({...p, error: null}))} className="ml-auto hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {state.isLoading && (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-500">
            <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="font-black text-primary tracking-widest uppercase text-xs">Comunicando com Google Drive & Gemini AI...</p>
          </div>
        )}

        {!state.isLoading && state.view === 'list' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-3xl font-black text-text-main-light dark:text-text-main-dark">Analytics Dashboard</h1>
                <p className="text-text-secondary-light italic">Selecione um relatório PDF para iniciar a análise determinística.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="px-6 py-3 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl font-bold flex items-center gap-2 hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined">upload_file</span> Local
                </button>
                <button 
                  onClick={syncDrive} 
                  className="px-6 py-3 bg-primary text-background-dark rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
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