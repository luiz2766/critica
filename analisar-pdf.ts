import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base64Pdf } = req.body;

    if (!base64Pdf) {
      throw new Error("PDF não recebido");
    }

    if (!process.env.API_KEY) {
      throw new Error("API_KEY não configurada no servidor");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            text: `Aja como um extrator de dados altamente preciso.
Localize o bloco 'RESUMO FINAL' no PDF e retorne JSON estrito conforme especificação.`
          },
          {
            inlineData: {
              data: base64Pdf,
              mimeType: "application/pdf"
            }
          }
        ]
      }
    });

    return res.status(200).json({
      text: response.text
    });

  } catch (err: any) {
    console.error("API Gemini Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
