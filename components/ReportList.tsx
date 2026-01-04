
import React from 'react';
import { Report } from '../types';

interface ReportListProps {
  reports: Report[];
  onAnalyse: (id: string) => void;
}

const ReportList: React.FC<ReportListProps> = ({ reports, onAnalyse }) => {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
        <div className="bg-background-light dark:bg-background-dark rounded-full p-6 mb-6">
          <span className="material-symbols-outlined text-6xl text-text-secondary-light/40">folder_off</span>
        </div>
        <h3 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">Nenhum relatório encontrado</h3>
        <p className="text-text-secondary-light dark:text-text-secondary-dark max-w-sm mt-2 mx-auto">
          Tente ajustar sua busca ou verifique se os arquivos foram sincronizados corretamente.
        </p>
      </div>
    );
  }

  return (
    <section className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden transition-colors duration-300">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background-light dark:bg-surface-dark/80 border-b border-border-light dark:border-border-dark">
              <th className="px-6 py-5 text-xs font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest w-[40%]">
                Nome do PDF
              </th>
              <th className="px-6 py-5 text-xs font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest w-[20%]">
                Origem
              </th>
              <th className="px-6 py-5 text-xs font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest w-[20%]">
                Data
              </th>
              <th className="px-6 py-5 text-xs font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest text-right">
                Ação
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {reports.map((report) => (
              <tr 
                key={report.id}
                onClick={() => report.status !== 'loading' && onAnalyse(report.id)}
                className={`group transition-all ${report.status === 'loading' ? 'cursor-wait opacity-60' : 'hover:bg-primary/5 cursor-pointer'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                      report.status === 'loading' 
                      ? 'animate-pulse bg-surface-light dark:bg-surface-dark border-border-light' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-900/40'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">
                        {report.status === 'loading' ? 'sync' : 'picture_as_pdf'}
                      </span>
                    </div>
                    <div className="overflow-hidden">
                      <p className={`font-bold text-text-main-light dark:text-text-main-dark truncate ${report.status !== 'loading' && 'group-hover:text-primary-dark dark:group-hover:text-primary'}`}>
                        {report.name}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{report.size}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center">
                      {report.source === 'drive' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary-dark dark:text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
                          <span className="material-symbols-outlined text-[14px]">cloud</span>
                          Google Drive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-900/40">
                          <span className="material-symbols-outlined text-[14px]">upload_file</span>
                          Local
                        </span>
                      )}
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  {report.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {report.status === 'loading' ? (
                    <div className="flex items-center justify-end gap-2 text-text-secondary-light animate-pulse">
                      <span className="text-xs font-bold italic">Processando...</span>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyse(report.id);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all text-sm font-bold shadow-sm group-hover:bg-primary group-hover:border-primary group-hover:text-background-dark"
                    >
                      <span>Analisar</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ReportList;
