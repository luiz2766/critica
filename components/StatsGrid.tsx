
import React from 'react';

const StatsGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark flex items-center gap-5 shadow-sm transition-all hover:shadow-md">
        <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-3xl">folder_open</span>
        </div>
        <div>
          <p className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Total de Relatórios</p>
          <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">142</p>
        </div>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark flex items-center gap-5 shadow-sm transition-all hover:shadow-md">
        <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-3xl">update</span>
        </div>
        <div>
          <p className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Última atualização</p>
          <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">Hoje, 10:30</p>
        </div>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark flex items-center gap-5 shadow-sm transition-all hover:shadow-md">
        <div className="size-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-3xl">storage</span>
        </div>
        <div>
          <p className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Espaço no Drive</p>
          <p className="text-2xl font-black text-text-main-light dark:text-text-main-dark">45% Livre</p>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
