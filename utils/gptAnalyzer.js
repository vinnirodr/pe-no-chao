const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extrai premissas e conclusão + gera justificativas.
 */
async function analyzeWithGPT(text) {

    const prompt = `
Você é um analisador lógico. Receba o seguinte argumento e:

1. Separe em premissas (1 a 3 no máximo).
2. Identifique a conclusão.
3. Construa formalmente (P, Q, R, C).
4. Diga o que cada uma significa (mapa de proposições).
5. Não invente coisas que não estão no texto.
6. Retorne SOMENTE JSON válido no formato:

{
  "premises": [
    { "label": "P", "text": "" },
    { "label": "Q", "text": "" }
  ],
  "conclusion": { "label": "C", "text": "" },
  "propositions": {
    "P": "",
    "Q": "",
    "C": ""
  }
}

Texto: ${text}
`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "user", content: prompt }
        ],
        temperature: 0
    });

    const raw = response.choices[0].message.content.trim();

    try {
        return JSON.parse(raw);
    } catch (err) {
        console.error("Erro ao parsear JSON do GPT:", raw);
        throw new Error("GPT returned invalid JSON");
    }
}

module.exports = analyzeWithGPT;
