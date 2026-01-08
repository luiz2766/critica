
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Função de montagem do aplicativo.
 * Removidas verificações de variáveis globais que causavam falha em ambientes bundler.
 */
const mountApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error("Critical: Root element '#root' not found.");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Application mounted successfully.");
  } catch (error) {
    console.error("React Bootstrap Failure:", error);
    
    // UI de Recuperação Crítica
    rootElement.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:40px;background:#f8fbfa;color:#0e1a13;">
        <div style="font-size:48px;margin-bottom:20px;">⚠️</div>
        <h1 style="font-size:22px;font-weight:900;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Erro de Renderização</h1>
        <p style="color:#51946b;max-width:400px;margin-bottom:24px;line-height:1.5;font-size:14px;">
          Ocorreu uma falha ao montar os componentes visuais. Verifique o console para mais detalhes.
        </p>
        <button onclick="window.location.reload()" style="padding:14px 28px;background:#39E079;border:none;border-radius:12px;font-weight:800;cursor:pointer;color:#122017;box-shadow:0 10px 15px -3px rgba(57,224,121,0.3);">
          RECARREGAR
        </button>
      </div>
    `;
  }
};

// Inicialização segura
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
