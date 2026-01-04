
import React, { useState, useEffect, useMemo } from 'react';
import { Report, Product } from '../types';

interface DashboardViewProps {
  report: Report | null;
  onBack: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ report, onBack }) => {
  const [pdfLocalUrl, setPdfLocalUrl] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (report?.products) {
      const allCodes = report.products.map(p => p.produto);
      setSelectedCodes(new Set(allCodes));
    }
  }, [report?.id]);

  useEffect(() => {
    if (report?.source === 'local' && report.file) {
      const url = URL.createObjectURL(report.file);
      setPdfLocalUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [report?.id]);

  /**
   * FUNÇÃO DE SUPORTE OBRIGATÓRIA (TESTE 11)
   */
  const parseVolume = (value: string): number => {
    return Number(value.replace(",", "."));
  };

  const parseVal = (value: string): number => {
    return Number(value.replace(".", "").replace(",", "."));
  };

  /**
   * FILTRAGEM DETERMINÍSTICA
   * Mantém a ordem original do array products (Teste 4).
   */
  const summaryData = useMemo(() => {
    if (!report?.products) return [];
    return report.products.filter(p => selectedCodes.has(p.produto));
  }, [report?.products, selectedCodes]);

  const metrics = useMemo(() => {
    if (summaryData.length === 0) return { total: 0, vol: 0, items: 0 };
    return {
      total: summaryData.reduce((acc, p) => acc + parseVal(p.valor_total), 0),
      vol: summaryData.reduce((acc, p) => acc + parseVolume(p.un_volume), 0),
      items: summaryData.length
    };
  }, [summaryData]);

  const toggleProduct = (code: string) => {
    const newSet = new Set(selectedCodes);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setSelectedCodes(newSet);
  };

  if (!report) return null;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="size-10 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center bg-white dark:bg-surface-dark shadow-sm hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined font-bold">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-text-main-light dark:text-text-main-dark">{report.name}</h1>
            <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Pipeline: Sincronização Absoluta por Arquivo</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase">Cross-Check Métrico</p>
          <div className="flex items-center gap-2 text-primary font-mono text-[10px] font-bold">
            <span className="size-1.5 bg-primary rounded-full animate-ping"></span>
            UN VOLUME TOTAL: {metrics.vol.toFixed(3).replace(".", ",")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
          <p className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase mb-1">VALOR TOTAL (PDF)</p>
          <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">R$ {metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border-2 border-primary/20 shadow-sm">
          <p className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase mb-1">SOMA UN VOLUME (HL)</p>
          <p className="text-2xl font-black text-primary">{metrics.vol.toFixed(3).replace(".", ",")} HL</p>
        </div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
          <p className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase mb-1">ITENS FILTRADOS</p>
          <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">{metrics.items} / {report.products?.length}</p>
        </div>
      </div>

      <section className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-xl overflow-hidden">
        <div className="p-4 bg-background-light/30 dark:bg-background-dark/30 border-b border-border-light dark:border-border-dark flex justify-between items-center">
           <h3 className="font-black text-xs uppercase tracking-tighter flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
             <span className="material-symbols-outlined text-sm">inventory_2</span>
             RESUMO DETERMINÍSTICO (HL)
           </h3>
           <span className="text-[9px] font-black bg-primary/10 text-primary-dark dark:text-primary px-2 py-1 rounded">ESTADO: SINCRONIZADO</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full font-mono text-[11px] border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark">
                <th className="px-4 py-3 text-center w-10">#</th>
                <th className="px-4 py-3 text-left">PRODUTO</th>
                <th className="px-4 py-3 text-left">DESCRIÇÃO</th>
                <th className="px-4 py-3 text-left">REFERÊNCIA</th>
                <th className="px-4 py-3 text-center">CAIXA/UNID</th>
                <th className="px-4 py-3 text-right">VALOR TOTAL</th>
                <th className="px-4 py-3 text-right">PREÇO MÉDIO</th>
                <th className="px-4 py-3 text-right">UN VOLUME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/40 dark:divide-border-dark/40">
              {report.products?.map((p, idx) => {
                const isSelected = selectedCodes.has(p.produto);
                return (
                  <tr 
                    key={`${report.id}-line-${idx}`} 
                    className={`transition-all ${isSelected ? 'bg-primary/5' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                    onClick={() => toggleProduct(p.produto)}
                  >
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleProduct(p.produto)}
                        className="rounded border-border-light text-primary focus:ring-primary size-4 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">{p.produto}</td>
                    <td className="px-4 py-3 font-medium uppercase truncate max-w-[280px]">{p.descricao}</td>
                    <td className="px-4 py-3 text-text-secondary-light dark:text-text-secondary-dark">{p.referencia}</td>
                    <td className="px-4 py-3 text-center font-bold">{p.caixa_unid}</td>
                    <td className="px-4 py-3 text-right font-black">R$ {p.valor_total}</td>
                    <td className="px-4 py-3 text-right">{p.preco_medio}</td>
                    <td className="px-4 py-3 text-right font-black text-primary">{p.un_volume}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-background-light/50 dark:bg-background-dark/50 border-t-2 border-border-light dark:border-border-dark font-bold text-sm text-text-main-light dark:text-text-main-dark">
              <tr>
                <td colSpan={5} className="px-4 py-6 text-xs uppercase font-black text-text-secondary-light">
                  MÉTRICA FINAL (CROSS-CHECK VOLUME):
                </td>
                <td className="text-right px-4 font-black">
                  R$ {metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
                <td className="text-right px-4 text-primary font-black">
                  {metrics.vol.toFixed(3).replace(".", ",")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="w-full h-[600px] rounded-2xl border-2 border-border-light dark:border-border-dark overflow-hidden shadow-inner bg-white dark:bg-surface-dark relative">
        <div className="absolute top-2 left-2 px-3 py-1 bg-background-dark/80 text-white rounded-full text-[9px] font-black tracking-widest z-10 border border-white/10 uppercase">
          Documento Original (Validação UN VOLUME Sincronizada)
        </div>
        {report.source === 'local' ? (
          <iframe src={pdfLocalUrl || ''} className="w-full h-full border-none" title="PDF Local" />
        ) : (
          <iframe src={report.pdfUrl?.replace('/view', '/preview') || ''} className="w-full h-full border-none" title="PDF Drive" />
        )}
      </div>
    </div>
  );
};

export default DashboardView;
