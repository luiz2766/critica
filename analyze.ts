// api/analyze.ts
// Crie este arquivo na raiz do projeto: /api/analyze.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('=== INICIANDO ANÁLISE ===');

    // 1. Obter a API Key do ambiente (servidor)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY não encontrada no servidor');
      return res.status(500).json({ 
        error: 'API Key não configurada no servidor. Configure GEMINI_API_KEY no Vercel.' 
      });
    }
    console.log('✓ API Key encontrada');

    // 2. Obter dados do request
    const { base64Data, fileName } = req.body;
    
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data é obrigatório' });
    }

    console.log('✓ Arquivo recebido:', fileName);
    console.log('✓ Tamanho base64:', base64Data.length, 'caracteres');

    // 3. Inicializar Gemini
    console.log('Inicializando Gemini...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✓ Gemini inicializado');

    // 4. Preparar prompt
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

    // 5. Gerar análise
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
    console.log('Prévia:', text.substring(0, 150) + '...');

    // 6. Parsear JSON
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

      console.log('✓ Análise concluída com sucesso');
      console.log('Produtos extraídos:', response.products.length);
      console.log('Origens:', response.origins);

      return res.status(200).json(response);

    } catch (parseError) {
      console.error('⚠️ Erro ao parsear JSON:', parseError);
      console.log('Retornando texto bruto para fallback...');
      
      // Retornar texto bruto para o frontend processar
      return res.status(200).json({
        products: [],
        origins: { sfa_via_portal: 0, heishop_b2b: 0, total_pedidos: 0 },
        rawText: text
      });
    }

  } catch (error: any) {
    console.error('❌ ERRO COMPLETO:', error);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: error.message || 'Erro ao processar análise',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Configuração para aumentar o limite de payload (se necessário)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
