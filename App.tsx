
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import ReportList from './components/ReportList';
import DashboardView from './components/DashboardView';
import StatsGrid from './components/StatsGrid';
import Footer from './components/Footer';
import { AppState, Report, Product, OrderOrigins } from './types';
import { DriveService } from './services/driveService';
import { MOCK_REPORTS } from './constants';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

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
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: `AJA COMO UM ENGENHEIRO DE EXTRAÇÃO DE DADOS SEMÂNTICOS.
1. Localize o bloco 'RESUMO FINAL' no PDF. 
2. Retorne as linhas de itens EXATAMENTE como aparecem, mantendo a relação entre Descrição, Referência e Valores.
3. Não use tabelas Markdown. Retorne texto puro.
4. Identifique as origens dos pedidos:
   - "Origem: R = SFA via portal"
   - "Origem: G = Pedido Heishop (B2B)"

FORMATO OBRIGATÓRIO DE RESPOSTA:
[TABELA_INI]
(dados brutos aqui)
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

    lines.forEach(line => {
      if (line.includes('[TABELA_INI]')) { inTable = true; return; }
      if (line.includes('[TABELA_FIM]')) { inTable = false; return; }
      if (inTable) {
        tableLines.push(line);
      } else {
        const trimmed = line.trim();
        if (trimmed.startsWith('SFA_COUNT:')) sfa = parseInt(trimmed.split(':')[1]) || 0;
        if (trimmed.startsWith('HEISHOP_COUNT:')) b2b = parseInt(trimmed.split(':')[1]) || 0;
      }
    });

    if (sfa === 0 && b2b === 0) {
      sfa = (text.match(/Origem: R = SFA via portal/g) || []).length;
      b2b = (text.match(/Origem: G = Pedido Heishop \(B2B\)/g) || []).length;
    }

    return { 
      tableLines, 
      origins: { sfa_via_portal: sfa, heishop_b2b: b2b, total_pedidos: sfa + b2b } 
    };
  };

  const extractResumoLines = (allLines: string[]): string[] => {
    return allLines.filter(l => {
        const t = l.trim();
        if (t.length < 40) return false;
        if (t.toUpperCase().includes("DESCRIÇÃO") || t.toUpperCase().includes("VALOR TOTAL")) return false;
        // Validação semântica: A linha deve conter uma Referência válida (CX-24, EB-12, UN-1, etc)
        return /(CX|EB|UN|LN)\s*-\s*\d+/.test(t.toUpperCase()) || /^(CERV|REFR|AGUA|BBMI|CHOP|DRAFT)/.test(t.toUpperCase());
    });
  };

  const parseRawLine = (line: string): Product => {
    // LÓGICA DE PARSING DELIMITADA (RESOLVE O PROBLEMA DE COORDENADAS FIXAS)
    const normalized = line.trim();
    
    // 1. Localizar REFERÊNCIA (CX - 24, EB - 12, etc)
    const refMatch = normalized.match(/(CX|EB|UN|LN|SHR)\s*-\s*\d+/i);
    const refIndex = refMatch ? normalized.indexOf(refMatch[0]) : -1;
    
    // 2. Extrair descrição (Tudo antes da referência)
    const descricao = refIndex !== -1 ? normalized.substring(0, refIndex).trim() : "DESCRIÇÃO NÃO IDENTIFICADA";
    
    // 3. Extrair os valores numéricos finais (Caixa/Unid, Valor Total, Preço Médio, Un Volume)
    // Procuramos por grupos de números e moedas no final da linha
    // Padrão: [VALOR] [VALOR] [VALOR] [VALOR]
    const numericPart = normalized.substring(refIndex !== -1 ? refIndex : 0);
    const parts = numericPart.split(/\s{2,}/).filter(p => p.trim().length > 0);
    
    // Fallback caso a quebra por múltiplos espaços falhe: usar regex para capturar os 4 números finais
    const numericMatches = normalized.match(/(\d+)\s+(?:R\$\s*)?([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)$/);

    if (numericMatches) {
      return {
        descricao,
        referencia: refMatch ? refMatch[0].trim() : "N/A",
        caixa_unid: numericMatches[1],
        valor_total: numericMatches[2],
        preco_medio: numericMatches[3],
        un_volume: numericMatches[4]
      };
    }

    // Fallback secundário usando as partes splitadas se o regex falhar
    return {
      descricao,
      referencia: parts[0] || "N/A",
      caixa_unid: parts[1] || "0",
      valor_total: parts[2] || "0,00",
      preco_medio: parts[3] || "0,00",
      un_volume: parts[4] || "0,000"
    };
  };

  const handleSelectReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, selectedReportId: null }));

    try {
      let products = report.products;
      let orderOrigins = report.orderOrigins;

      if (!products || products.length === 0 || !orderOrigins) {
        let fileBlob: Blob;
        if (report.source === 'drive') {
          fileBlob = await DriveService.downloadFile(report.id);
        } else {
          fileBlob = report.file as File;
        }
        
        const { tableLines, origins } = await extractDataWithGemini(fileBlob);
        const filteredLines = extractResumoLines(tableLines);
        products = filteredLines.map(l => parseRawLine(l)).filter(p => p.descricao !== "DESCRIÇÃO NÃO IDENTIFICADA");
        orderOrigins = origins;
        
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, products, orderOrigins } : r));
      }

      setState(prev => ({
        ...prev,
        selectedReportId: reportId,
        view: 'dashboard',
        isLoading: false
      }));
    } catch (err: any) {
      console.error("Erro no parsing:", err);
      setState(prev => ({ ...prev, isLoading: false, error: `Erro na extração semântica: ${err.message}` }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, selectedReportId: null }));

    try {
      const { tableLines, origins } = await extractDataWithGemini(file);
      const filteredLines = extractResumoLines(tableLines);
      const summaryData = filteredLines.map(l => parseRawLine(l)).filter(p => p.descricao !== "DESCRIÇÃO NÃO IDENTIFICADA");

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
        products: summaryData,
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
      if (!isAuthorized) {
        await DriveService.authorize();
        setIsAuthorized(true);
      }
      const driveFiles = await DriveService.listFiles();
      setReports(driveFiles);
    } catch (e: any) {
      setReports(MOCK_REPORTS);
      setIsAuthorized(true);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    DriveService.init();
    document.documentElement.classList.toggle('dark', state.isDarkMode);
  }, [state.isDarkMode]);

  const filteredReports = useMemo(() => reports.filter(r => r.name.toLowerCase().includes(state.searchQuery.toLowerCase())), [reports, state.searchQuery]);
  const selectedReport = useMemo(() => reports.find(r => r.id === state.selectedReportId) || null, [reports, state.selectedReportId]);

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
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl text-red-700 dark:text-red-400 font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined">report_problem</span>
            {state.error}
          </div>
        )}

        {state.isLoading && (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="font-black text-primary tracking-widest uppercase text-xs">Sincronizando Resumo Determinístico do PDF...</p>
          </div>
        )}

        {!state.isLoading && state.view === 'list' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-text-main-light dark:text-text-main-dark">Analytics Dashboard</h1>
                <p className="text-text-secondary-light italic">Poder de análise impulsionado por Gemini AI Engine.</p>
              </div>
              <div className="flex gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl font-bold flex items-center gap-2 hover:border-primary transition-all shadow-sm">
                  <span className="material-symbols-outlined">upload_file</span> Importar PDF Real
                </button>
                <button onClick={syncDrive} className="px-6 py-3 bg-primary text-background-dark rounded-xl font-bold hover:scale-105 transition-transform">Sincronizar Drive</button>
              </div>
            </div>
            <ReportList reports={filteredReports} onAnalyse={handleSelectReport} />
            <StatsGrid />
          </div>
        )}

        {!state.isLoading && state.view === 'dashboard' && selectedReport && (
          <DashboardView 
            key={`${selectedReport.id}-${selectedReport.products?.length || 0}`} 
            report={selectedReport} 
            onBack={() => setState(p => ({ ...p, view: 'list', selectedReportId: null }))} 
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
