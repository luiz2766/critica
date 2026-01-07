
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Função de montagem resiliente.
 * Se o React ou ReactDOM não estiverem disponíveis (falha de importmap), 
 * o catch captura e exibe o fallback visual imediatamente.
 */
const mountApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error("Critical: Root element not found.");
    return;
  }

  try {
    // Verificação de segurança de runtime
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      throw new Error("React ou ReactDOM não carregados pelo Import Map.");
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Application mounted successfully.");
  } catch (error) {
    console.error("React Bootstrap Failure:", error);
    
    // UI de Recuperação Crítica (exibida apenas se o bundle quebrar)
    rootElement.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:40px;background:#f8fbfa;color:#0e1a13;">
        <div style="font-size:48px;margin-bottom:20px;">⚠️</div>
        <h1 style="font-size:22px;font-weight:900;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Erro de Inicialização</h1>
        <p style="color:#51946b;max-width:400px;margin-bottom:24px;line-height:1.5;font-size:14px;">
          O ambiente de produção falhou ao carregar as dependências principais do sistema. 
          Isso pode ser causado por instabilidades na rede ou bloqueios de CDN.
        </p>
        <button onclick="window.location.reload()" style="padding:14px 28px;background:#39E079;border:none;border-radius:12px;font-weight:800;cursor:pointer;color:#122017;box-shadow:0 10px 15px -3px rgba(57,224,121,0.3);">
          RECARREGAR DASHBOARD
        </button>
      </div>
    `;
  }
};

// Inicialização garantida após carregamento do DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
