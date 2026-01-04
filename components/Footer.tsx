
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
            © 2023 Analytics Dashboard. Connected to <span className="font-bold text-text-main-light dark:text-text-main-dark">Google Drive</span>.
          </p>
          <p className="text-xs text-text-secondary-light/60 dark:text-text-secondary-dark/40">
            Powered by Gemini AI Engine
          </p>
        </div>
        
        <div className="flex items-center gap-8">
          <a href="#" className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">Termos</a>
          <a href="#" className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">Privacidade</a>
          <a href="#" className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">Suporte</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
