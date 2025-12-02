const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function analyzeWithGPT(text) {
    const prompt = `
Você é um especialista em lógica proposicional.

Receba o argumento abaixo e retorne APENAS JSON válido, seguindo exatamente este formato:

{
  "premises": [
    { "label": "P", "natural": "", "formal": "", "tipo": "" },
    { "label": "Q", "natural": "", "formal": "", "tipo": "" }
  ],
  "conclusion": { "label": "C", "natural": "", "formal": "", "tipo": "" },
  "propositions": {
    "P": "",
    "Q": "",
    "C": ""
  }
}

REGRAS IMPORTANTES:
1. "tipo" pode ser: "simples", "condicional", "conjunção", "disjunção", "bicondicional", "negação".
2. "formal" deve usar símbolos lógicos (→, ∧, ∨, ¬, ↔).
3. Premissas devem ser extraídas SOMENTE do texto — não invente.
4. Use no máximo 3 premissas.
5. SEMPRE retornar JSON puro — sem explicações extras.
6. "propositions" deve mapear label -> frase natural correspondente.

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
        console.error("❌ Erro ao parsear JSON do GPT:", raw);
        throw new Error("GPT returned invalid JSON");
    }
}

module.exports = analyzeWithGPT;
