
import React, { useState } from 'react';
import { User } from '../types';

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogoClick: () => void;
  currentUser: User;
  onSwitchUser: (newUser: User) => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, onLogoClick, currentUser, onSwitchUser }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const switchAccount = () => {
    const otherUser: User = currentUser.email === 'luizhenrique2766@gmail.com' 
      ? {
          name: 'Admin Global',
          email: 'admin@company.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        }
      : {
          name: 'Luiz Henrique',
          email: 'luizhenrique2766@gmail.com',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luiz',
          driveFolderUrl: 'https://drive.google.com/drive/folders/18X3ZLJj2TQJ58nhB3VoyDhC-6WLdUDRy'
        };
    
    onSwitchUser(otherUser);
    setIsMenuOpen(false);
  };

  return (
    <header className="w-full bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-4 sticky top-0 z-20 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={onLogoClick}>
          <div className="size-10 text-primary flex items-center justify-center bg-primary/10 rounded-xl transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-background-dark">
            <span className="material-symbols-outlined text-3xl">analytics</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black tracking-tight text-text-main-light dark:text-text-main-dark">Analytics Dashboard</h2>
            {currentUser.driveFolderUrl && (
              <span className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                <span className="size-1 bg-primary rounded-full animate-pulse"></span>
                Drive Conectado
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-background-light dark:hover:bg-background-dark transition-all active:scale-95"
            aria-label="Toggle Dark Mode"
          >
            <span className="material-symbols-outlined">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <div className="relative">
            <div 
              className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-border-light dark:border-border-dark cursor-pointer group"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold leading-none text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  {currentUser.email}
                </p>
              </div>
              <div 
                className="bg-center bg-no-repeat bg-cover rounded-full size-10 ring-2 ring-primary/20 shadow-inner overflow-hidden border border-border-light dark:border-border-dark transition-transform group-hover:scale-105"
              >
                <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-2xl py-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-border-light dark:border-border-dark mb-2">
                  <p className="text-[10px] font-black text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">Configurações de Acesso</p>
                </div>
                
                {currentUser.driveFolderUrl && (
                  <a 
                    href={currentUser.driveFolderUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-primary">folder_shared</span>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark group-hover:text-primary">Ver Pasta no Drive</p>
                      <p className="text-[10px] text-text-secondary-light truncate italic">Ir para o repositório original</p>
                    </div>
                  </a>
                )}

                <button 
                  onClick={switchAccount}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-background-light dark:hover:bg-background-dark transition-colors group"
                >
                  <span className="material-symbols-outlined text-text-secondary-light group-hover:text-primary">sync_alt</span>
                  <div>
                    <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">Trocar de Usuário</p>
                    <p className="text-[10px] text-text-secondary-light">Mudar credenciais de sincronização</p>
                  </div>
                </button>
                <div className="px-2 mt-2 pt-2 border-t border-border-light dark:border-border-dark">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                    <span className="material-symbols-outlined text-text-secondary-light group-hover:text-red-500 text-xl">logout</span>
                    <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark group-hover:text-red-500">Encerrar Sessão</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
