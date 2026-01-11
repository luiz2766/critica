// api/analyze.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('=== INICIANDO ANÁLISE ===');

    // API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY não encontrada');
      return res.status(500).json({ 
        error: 'API Key não configurada. Adicione GEMINI_API_KEY no Vercel.' 
      });
    }
    console.log('✓ API Key encontrada');

    // Dados
    const { base64Data, fileName } = req.body;
    
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data é obrigatório' });
    }

    console.log('✓ Arquivo:', fileName);
    console.log('✓ Tamanho:', base64Data.length, 'chars');

    // Gemini
    console.log('Inicializando Gemini...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✓ Gemini OK');

    // Prompt
    const prompt = `Aja como um extrator de dados altamente preciso. 
Localize o bloco 'RESUMO FINAL' no PDF. 
Para cada produto no bloco, extraia exatamente nesta ordem:
1. Descrição (nome do produto)
2. Referência (ex: CX-24, UN-1)
3. Caixa/Unid (quantidade)
4. Valor Total (monetário)
5. Preço Médio (monetário)
6. Un Volume (valor decimal)

Também extraia as contagens de origens:
- SFA_COUNT: ocorrências de "Origem: R = SFA via portal"
- HEISHOP_COUNT: ocorrências de "Origem: G = Pedido Heishop (B2B)"

Formate a resposta como JSON estrito:
{
  "products": [
    {
      "descricao": "...",
      "referencia": "...",
      "caixa_unid": "...",
      "valor_total": "...",
      "preco_medio": "...",
      "un_volume": "..."
    }
  ],
  "sfa_count": 0,
  "heishop_count": 0
}`;

    // Análise
    console.log('Enviando para Gemini...');
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      },
      prompt
    ]);

    const text = result.response.text();
    console.log('✓ Resposta recebida');

    // Parse JSON
    try {
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const data = JSON.parse(jsonStr);

      const response = {
        products: data.products || [],
        origins: {
          sfa_via_portal: data.sfa_count || 0,
          heishop_b2b: data.heishop_count || 0,
          total_pedidos: (data.sfa_count || 0) + (data.heishop_count || 0)
        }
      };

      console.log('✓ Sucesso! Produtos:', response.products.length);
      return res.status(200).json(response);

    } catch (parseError) {
      console.error('⚠️ Erro parse:', parseError);
      return res.status(200).json({
        products: [],
        origins: { sfa_via_portal: 0, heishop_b2b: 0, total_pedidos: 0 },
        rawText: text
      });
    }

  } catch (error) {
    console.error('❌ ERRO:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro ao processar',
      details: error.stack
    });
  }
};
