// api/analyze.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  console.log('=== REQUEST RECEBIDO ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // CORS Headers - DEVE VIR ANTES DE QUALQUER RETURN
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('✓ OPTIONS request - enviando 200');
    return res.status(200).end();
  }

  // Aceitar GET e POST (para debug)
  if (req.method === 'GET') {
    console.log('✓ GET request - API está funcionando');
    return res.status(200).json({ 
      message: 'API funcionando! Use POST para analisar PDFs.',
      status: 'online'
    });
  }

  if (req.method !== 'POST') {
    console.log('❌ Método não permitido:', req.method);
    return res.status(405).json({ 
      error: 'Método não permitido. Use POST.',
      method: req.method 
    });
  }

  try {
    console.log('=== INICIANDO ANÁLISE ===');

    // API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY não encontrada');
      return res.status(500).json({ 
        error: 'API Key não configurada. Adicione GEMINI_API_KEY no Vercel.',
        hint: 'Vá em: Vercel Dashboard → Settings → Environment Variables'
      });
    }
    console.log('✓ API Key encontrada');

    // Parse body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.log('✓ Body parseado');
    } catch (e) {
      console.error('❌ Erro ao parsear body:', e);
      return res.status(400).json({ error: 'Body inválido. Use JSON.' });
    }

    const { base64Data, fileName } = body;
    
    console.log('Body recebido:', {
      hasBase64Data: !!base64Data,
      fileName: fileName,
      base64Length: base64Data?.length || 0
    });
    
    if (!base64Data) {
      console.error('❌ base64Data não fornecido');
      return res.status(400).json({ 
        error: 'base64Data é obrigatório',
        received: Object.keys(body)
      });
    }

    console.log('✓ Arquivo:', fileName);
    console.log('✓ Tamanho:', base64Data.length, 'chars');

    // Validar se é base64 válido
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data.substring(0, 100))) {
      console.error('❌ base64Data inválido');
      return res.status(400).json({ error: 'base64Data não é base64 válido' });
    }

    // Gemini
    console.log('Inicializando Gemini...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✓ Gemini inicializado');

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
    console.log('✓ Resposta recebida do Gemini');
    console.log('Prévia:', text.substring(0, 100) + '...');

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
      console.error('⚠️ Erro ao parsear JSON do Gemini:', parseError);
      console.log('Retornando rawText para fallback...');
      return res.status(200).json({
        products: [],
        origins: { sfa_via_portal: 0, heishop_b2b: 0, total_pedidos: 0 },
        rawText: text
      });
    }

  } catch (error) {
    console.error('❌ ERRO COMPLETO:', error);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      error: error.message || 'Erro ao processar análise',
      type: error.constructor.name,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
