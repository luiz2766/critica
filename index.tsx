
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill crítico para evitar ReferenceError: process is not defined em produção
// Muitas bibliotecas (incluindo @google/genai ou dependências internas) esperam process.env
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {} } as any;
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical: Could not find root element to mount the application.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to render React application:", error);
    // Fallback visual mínimo em caso de crash catastrófico de montagem
    rootElement.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
        <h1 style="color:#0e1a13;">Erro ao carregar aplicação</h1>
        <p style="color:#51946b;">Ocorreu uma falha na inicialização do sistema.</p>
        <button onclick="window.location.reload()" style="padding:10px 20px;background:#39E079;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">Tentar Novamente</button>
      </div>
    `;
  }
}
