
import React, { useState, useEffect, useMemo } from 'react';
import { Report, Product } from '../types';

interface DashboardViewProps {
  report: Report | null;
  onBack: () => void;
}

// TABELA MESTRE - PRODUTOS, MARCAS, FUNDAMENTOS E UN VOLUME (HL)
const MASTER_TABLE: Record<string, { marca: string; fundamentos: string; volUnit: number }> = {
  // Cerveja 600ml
  "CERV SCHIN PILS 0,60LGFA 24UN": { marca: "ECONOMY", fundamentos: "RGB", volUnit: 0.144 },
  "CERV HEINEKEN PIL 0,60GFA RT 24UN": { marca: "PREMIUM", fundamentos: "RGB", volUnit: 0.144 },
  "CERV AMSTEL LAGER 0,60L GFA RT 24UN": { marca: "MAINSTREAM", fundamentos: "RGB", volUnit: 0.144 },
  "CERV DEVASSA LAGER N 0,60LGFA RT24UNPH": { marca: "MAINSTREAM", fundamentos: "RGB", volUnit: 0.144 },
  // Cerveja Litrão
  "CERV SCHIN PILS 1LGFA 12UN": { marca: "ECONOMY", fundamentos: "RGB", volUnit: 0.120 },
  "CERV DEVASSA LAGER N 1LGFA RT 12UN PT1": { marca: "MAINSTREAM", fundamentos: "RGB", volUnit: 0.120 },
  "CERV AMSTEL PIL 1LGFA RT 12UN": { marca: "MAINSTREAM", fundamentos: "RGB", volUnit: 0.120 },
  // Cerveja Litrinho
  "CERV DEVASSA LAGER N 0,30LGFA RT 24UN": { marca: "MAINSTREAM", fundamentos: "RGB", volUnit: 0.072 },
  "CERV AMSTEL LAGER 0,30LGFA RT 24UN": { marca: "MAINSTREAM", fundamentos: "RGB", volUnit: 0.072 },
  // Cerveja Lata 350ml
  "CERV SCHIN PILS 0,350LT 12UN PBR": { marca: "ECONOMY", fundamentos: "N/A", volUnit: 0.042 },
  "CERV BADEN PILCRIST 0,350LT SLEK2X6UNPBR": { marca: "MAINSTREAM", fundamentos: "N/A", volUnit: 0.042 },
  "CERV HEINEKEN PIL 0,350LT SLEEKDES12UNPB": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.042 },
  "CERV HEINEKEN 0,0% 0,350LTSLEEKDES12UNPB": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.042 },
  "CERV BADEN WITBIER 0,350LT SLEEK2X6UNPBR": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.042 },
  "CERV BADEN IPA 0,350LT SLEK2X6UNPBR": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.042 },
  "CERV LAGUNITAS IPA 0,350LT SLE": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.042 },
  "CERV BLUE MOON 0,350LT SLEEK CART12UNPBR": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.042 },
  "CERV DEVAS LAGER N 0,350LTSLEEKDES12UNPB": { marca: "MAINSTREAM", fundamentos: "N/A", volUnit: 0.042 },
  "CERV AMSTEL LAGER 0,350LT SLEEK 12UN PBR": { marca: "MAINSTREAM", fundamentos: "N/A", volUnit: 0.042 },
  // Cerveja Lata 269ml / 473ml
  "CERV SCHIN PILS 0,473LT 12UN PBR": { marca: "ECONOMY", fundamentos: "N/A", volUnit: 0.057 },
  "CERV DEVAS LAGER N 0,473LT DES 12UN PBR": { marca: "MAINSTREAM", fundamentos: "N/A", volUnit: 0.057 },
  "CERV AMSTEL LAGER 0,473LT DES 12UNPBR": { marca: "MAINSTREAM", fundamentos: "N/A", volUnit: 0.057 },
  "CERV HEINEKEN PIL 0,269LT DESC 8UN PB": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.022 },
  "CERV HEINEKEN 0,0% 0,269LT DESC 8UN PBR": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.022 },
  "CERV AMSTEL ULTRA 0,269LT 12UNPBR": { marca: "MAINSTREAM", fundamentos: "N/A", volUnit: 0.032 },
  "CERV AMSTEL LAGER 0,269LT SHR 12UNPBR": { marca: "MAINSTREAM", fundamentos: "N/A", volUnit: 0.032 },
  // Cervejas Especiais
  "CERV BADEN PILSCRIST 0,60LGFA 12UN PB": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.072 },
  "CERV BADEN GOLDEN ALE 0,60LGFA 12UN PBR": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.072 },
  "CERV BADEN WITBIER 0,60LGFA 12UN PBR": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.072 },
  "CERV BADEN AMERICAN IPA 0,60LGFA 12UN": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.072 },
  "CERV HEINEKEN PIL 0,6GFA DESC 12UNPBR": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.072 },
  "CERV LAGUNITAS IPA 0,355LN DES 12UN PBR": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.043 },
  "CERV BLUE MOON 0,350LT SLEEK CART 12 UN": { marca: "CRAFT", fundamentos: "N/A", volUnit: 0.085 },
  "DRAFT BEER HEINEKEN PIL 5L DESC 2UNPBR": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.100 },
  "CERV HEINEKEN PIL 0,250GFA DESC4X6UNPBR": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.060 },
  "CERV HEINEKEN PIL 0,330GFA DESC 4X6UN PB": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.079 },
  "CERV PRAYA LAGER 0,330GFA DESC 4X6UNPBR": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.079 },
  "CERV HEINEKEN 0,0% 0,330GFA DES 4X6UNPBR": { marca: "PREMIUM", fundamentos: "N/A", volUnit: 0.079 },
  "CERV AMSTEL ULTRA 0,275LN DES 2X6UN PBR": { marca: "MAINSTREAM", fundamentos: "N/A", volUnit: 0.033 },
  // Chopp
  "CHOP HEINEKEN PIL 30LBARRIL RT": { marca: "PREMIUM", fundamentos: "RGB", volUnit: 0.300 },
  "CHOP HEINEKEN PIL 50LBARRIL RT": { marca: "PREMIUM", fundamentos: "RGB", volUnit: 0.500 },
  "DRAFT BEER AMSTEL LAGER 30L PBR2": { marca: "MAINSTREAM", fundamentos: "RGB", volUnit: 0.300 },
  "DRAFT BEER AMSTEL LAGER 50L PBR2": { marca: "MAINSTREAM", fundamentos: "RGB", volUnit: 0.500 },
  // Refrigerante FYS
  "REFR FYS GUARANA 0,350LT DES 12UN PBR": { marca: "FYS", fundamentos: "SINGLE SERVE", volUnit: 0.042 },
  "REFR FYS LARANJA 0,350LT DES 12UN PBR": { marca: "FYS", fundamentos: "SINGLE SERVE", volUnit: 0.042 },
  "REFR FYS LIMAO 0,350LT DES 12UN PBR": { marca: "FYS", fundamentos: "SINGLE SERVE", volUnit: 0.042 },
  "REFR FYS GUARANA ZERO 0,350LT DESC12UNPB": { marca: "FYS", fundamentos: "SINGLE SERVE", volUnit: 0.042 },
  "REFR FYS TONICA 0,350LT DES 12UN PBR": { marca: "FYS", fundamentos: "SINGLE SERVE", volUnit: 0.042 },
  "REFR FYS TONICA ZERO 0,350LT DES 12UN PB": { marca: "FYS", fundamentos: "SINGLE SERVE", volUnit: 0.042 },
  "REFR FYS LIMAO ZERO 0,350LT DESC 12UNPBR":{ marca: "FYS", fundamentos: "SINGLE SERVE", volUnit: 0.042 },
  // Água Mineral
  "AGUA SCHIN MINER S/GAS 0,50LPET 12UN PBR": { marca: "AGUA SCHIN", fundamentos: "SINGLE SERVE", volUnit: 0.060 },
  "AGUA SCHIN MINER C/GAS 0,50LPET 12UN PBR": { marca: "AGUA SCHIN", fundamentos: "SINGLE SERVE", volUnit: 0.060 },
  // Skinka
  "BBMI SKINKA FRUTCITRIC 0,45LPET 12UN PBR": { marca: "SKINKA", fundamentos: "SINGLE SERVE", volUnit: 0.054 },
  "BBMI SKINKA FRUTVERM 0,45LPET 12UN PBR": { marca: "SKINKA", fundamentos: "SINGLE SERVE", volUnit: 0.054 },
  "BBMI SKINKA UVA 0,45LPET DES 12UN PBR": { marca: "SKINKA", fundamentos: "SINGLE SERVE", volUnit: 0.054 },
};

const DashboardView: React.FC<DashboardViewProps> = ({ report, onBack }) => {
  const [pdfLocalUrl, setPdfLocalUrl] = useState<string | null>(null);
  const [selectedDescriptions, setSelectedDescriptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (report?.products) {
      const allDescs = report.products.map(p => p.descricao);
      setSelectedDescriptions(new Set(allDescs));
    }
  }, [report?.id]);

  useEffect(() => {
    if (report?.source === 'local' && report.file) {
      const url = URL.createObjectURL(report.file);
      setPdfLocalUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [report?.id]);

  const parseVolume = (value: string): number => {
    return Number(value.replace(",", "."));
  };

  const parseVal = (value: string): number => {
    return Number(value.replace(".", "").replace(",", "."));
  };

  const summaryData = useMemo(() => {
    if (!report?.products) return [];
    return report.products.filter(p => selectedDescriptions.has(p.descricao));
  }, [report?.products, selectedDescriptions]);

  const metrics = useMemo(() => {
    if (summaryData.length === 0) return { total: 0, vol: 0, items: 0 };
    return {
      total: summaryData.reduce((acc, p) => acc + parseVal(p.valor_total), 0),
      vol: summaryData.reduce((acc, p) => acc + parseVolume(p.un_volume), 0),
      items: summaryData.length
    };
  }, [summaryData]);

  const analytics = useMemo(() => {
    const brandData: Record<string, { cases: number; hl: number }> = {};
    const fundamentalsData: Record<string, { some: number; hl: number }> = {};

    summaryData.forEach(p => {
      const mapping = MASTER_TABLE[p.descricao.toUpperCase()];
      if (mapping) {
        const cases = parseInt(p.caixa_unid) || 0;
        const hl = parseVolume(p.un_volume);

        if (!brandData[mapping.marca]) brandData[mapping.marca] = { cases: 0, hl: 0 };
        brandData[mapping.marca].cases += cases;
        brandData[mapping.marca].hl += hl;

        if (!fundamentalsData[mapping.fundamentos]) fundamentalsData[mapping.fundamentos] = { some: 0, hl: 0 };
        fundamentalsData[mapping.fundamentos].some += cases;
        fundamentalsData[mapping.fundamentos].hl += hl;
      }
    });

    return {
      brands: Object.entries(brandData).sort((a, b) => b[1].hl - a[1].hl),
      fundamentals: Object.entries(fundamentalsData).sort((a, b) => b[1].hl - a[1].hl),
    };
  }, [summaryData]);

  const toggleProduct = (desc: string) => {
    const newSet = new Set(selectedDescriptions);
    if (newSet.has(desc)) {
      newSet.delete(desc);
    } else {
      newSet.add(desc);
    }
    setSelectedDescriptions(newSet);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
          <p className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase mb-1">VALOR TOTAL (PDF)</p>
          <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">R$ {metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border-2 border-primary/20 shadow-sm">
          <p className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase mb-1">SOMA UN VOLUME (HL)</p>
          <p className="text-2xl font-black text-primary">{metrics.vol.toFixed(3).replace(".", ",")} HL</p>
        </div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
          <p className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase mb-1">ORIGEM DOS PEDIDOS</p>
          <div className="space-y-1 mt-1 font-mono text-[10px]">
            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
              <span className="font-bold">SFA PORTAL:</span>
              <span className="font-black text-sm">{report.orderOrigins?.sfa_via_portal || 0}</span>
            </div>
            <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
              <span className="font-bold">HEISHOP B2B:</span>
              <span className="font-black text-sm">{report.orderOrigins?.heishop_b2b || 0}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border-light dark:border-border-dark pt-1 mt-1 font-black text-primary">
              <span>TOTAL:</span>
              <span className="text-sm">{report.orderOrigins?.total_pedidos || 0}</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
          <p className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase mb-1">ITENS FILTRADOS</p>
          <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">{metrics.items} / {report.products?.length || 0}</p>
        </div>
      </div>

      {/* ANALÍTICO MARCA / FUNDAMENTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
            <h4 className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">stars</span>
              Resumo por MARCA
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark text-text-secondary-light">
                  <th className="px-4 py-2 font-black uppercase">MARCA</th>
                  <th className="px-4 py-2 font-black uppercase text-center">CX/UNID</th>
                  <th className="px-4 py-2 font-black uppercase text-right">VOLUME (HL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light/40 dark:divide-border-dark/40">
                {analytics.brands.map(([brand, data]) => (
                  <tr key={brand} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-2 font-bold text-text-main-light dark:text-text-main-dark">{brand}</td>
                    <td className="px-4 py-2 text-center">{data.cases}</td>
                    <td className="px-4 py-2 text-right font-black text-primary">{data.hl.toFixed(3).replace(".", ",")}</td>
                  </tr>
                ))}
                {analytics.brands.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-text-secondary-light italic">Processando resumo por marca...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
            <h4 className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">foundation</span>
              Resumo por FUNDAMENTOS
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark text-text-secondary-light">
                  <th className="px-4 py-2 font-black uppercase">TIPO</th>
                  <th className="px-4 py-2 font-black uppercase text-center">CX/UNID</th>
                  <th className="px-4 py-2 font-black uppercase text-right">VOLUME (HL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light/40 dark:divide-border-dark/40">
                {analytics.fundamentals.map(([type, data]) => (
                  <tr key={type} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-2 font-bold text-text-main-light dark:text-text-main-dark">{type}</td>
                    <td className="px-4 py-2 text-center">{data.some}</td>
                    <td className="px-4 py-2 text-right font-black text-primary">{data.hl.toFixed(3).replace(".", ",")}</td>
                  </tr>
                ))}
                {analytics.fundamentals.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-text-secondary-light italic">Processando resumo por fundamentos...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RESUMO DETERMINÍSTICO HL */}
      <section className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-xl overflow-hidden">
        <div className="p-4 bg-background-light/30 dark:bg-background-dark/30 border-b border-border-light dark:border-border-dark flex justify-between items-center">
           <h3 className="font-black text-xs uppercase tracking-tighter flex items-center gap-2 text-text-main-light dark:text-text-main-dark">
             <span className="material-symbols-outlined text-sm">inventory_2</span>
             RESUMO DETERMINÍSTICO (HL)
           </h3>
           <span className="text-[9px] font-black bg-primary/10 text-primary-dark dark:text-primary px-2 py-1 rounded">ESTADO: SINCRONIZADO</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full font-mono text-[11px] border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark border-b border-border-light dark:border-border-dark">
                <th className="px-6 py-3 text-center w-10">#</th>
                <th className="px-10 py-3 text-left">DESCRIÇÃO</th>
                <th className="px-10 py-3 text-left">REFERÊNCIA</th>
                <th className="px-10 py-3 text-center">CAIXA/UNID</th>
                <th className="px-10 py-3 text-right">VALOR TOTAL</th>
                <th className="px-10 py-3 text-right">PREÇO MÉDIO</th>
                <th className="px-10 py-3 text-right">UN VOLUME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light/40 dark:divide-border-dark/40">
              {report.products?.map((p, idx) => {
                const isSelected = selectedDescriptions.has(p.descricao);
                return (
                  <tr 
                    key={`${report.id}-line-${idx}`} 
                    className={`transition-all ${isSelected ? 'bg-primary/5' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                    onClick={() => toggleProduct(p.descricao)}
                  >
                    <td className="px-6 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleProduct(p.descricao)}
                        className="rounded border-border-light text-primary focus:ring-primary size-4 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-10 py-3 font-medium uppercase truncate max-w-[400px]">{p.descricao}</td>
                    <td className="px-10 py-3 text-text-secondary-light dark:text-text-secondary-dark">{p.referencia}</td>
                    <td className="px-10 py-3 text-center font-bold">{p.caixa_unid}</td>
                    <td className="px-10 py-3 text-right font-black">R$ {p.valor_total}</td>
                    <td className="px-10 py-3 text-right">{p.preco_medio}</td>
                    <td className="px-10 py-3 text-right font-black text-primary">{p.un_volume}</td>
                  </tr>
                );
              })}
              {(!report.products || report.products.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-10 py-20 text-center text-text-secondary-light italic font-bold">
                    Nenhum dado extraído do PDF. Verifique o layout ou as coordenadas de slicing.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-background-light/50 dark:bg-background-dark/50 border-t-2 border-border-light dark:border-border-dark font-bold text-sm text-text-main-light dark:text-text-main-dark">
              <tr>
                <td colSpan={4} className="px-10 py-6 text-xs uppercase font-black text-text-secondary-light">
                  MÉTRICA FINAL (CROSS-CHECK VOLUME):
                </td>
                <td className="text-right px-10 font-black">
                  R$ {metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
                <td className="text-right px-10 text-primary font-black">
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