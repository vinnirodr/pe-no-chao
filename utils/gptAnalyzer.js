const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function analyzeWithGPT(text) {
    const prompt = `
Você é um analisador lógico formal.

Receba o seguinte argumento e retorne APENAS JSON válido com o seguinte formato:

{
  "premises": [
    { "label": "P", "natural": "", "formal": "" },
    { "label": "Q", "natural": "", "formal": "" }
  ],
  "conclusion": { "label": "C", "natural": "", "formal": "" },
  "propositions": {
    "P": "",
    "Q": "",
    "C": ""
  }
}

Regras:
1. "natural" = frase original do argumento.
2. "formal" = tradução para lógica proposicional (ex: "P", "Q", "(P -> Q)", "(P ∧ Q)").
3. Use no máximo 3 premissas.
4. Não invente nada que não esteja no texto.
5. Sempre devolva JSON puro.

Argumento:
${text}
`;

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
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
