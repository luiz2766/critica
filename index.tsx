
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Root mounting logic
const mountApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error("Critical Error: Root element '#root' not found. Ensure index.html contains <div id='root'></div>.");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React Mounting Failure:", error);
    // Visual fallback for catastrophic render failures
    rootElement.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;background:#f8fbfa;color:#0e1a13;">
        <h1 style="font-size:24px;margin-bottom:12px;">Falha na Inicialização</h1>
        <p style="color:#51946b;max-width:400px;margin-bottom:20px;">Ocorreu um erro ao carregar os componentes visuais em seu navegador.</p>
        <button onclick="window.location.reload()" style="padding:12px 24px;background:#39E079;border:none;border-radius:12px;font-weight:800;cursor:pointer;box-shadow:0 4px 6px rgba(0,0,0,0.1);">Recarregar Sistema</button>
      </div>
    `;
  }
};

// Ensure DOM is ready before mounting to prevent White Screen on slow loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
