const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Recebe um texto em linguagem natural e devolve:
 * - premissas (natural + formal)
 * - conclusão (natural + formal)
 * - átomos proposicionais (P, Q, R...)
 */
async function analyzeWithGPT(text) {
    const prompt = `
Você é um analisador lógico formal. Dado o texto abaixo:

1. Extraia até 3 premissas.
2. Extraia a conclusão.
3. Identifique as proposições atômicas (P, Q, R…).
4. Converta cada frase em lógica proposicional:
   - "Se X então Y" → (P -> Q)
   - "X e Y" → (P ∧ Q)
   - "X ou Y" → (P ∨ Q)
   - "Não X" / "É falso que X" → ¬P

Use SEMPRE:
- "->" para implicação
- "∧" para E
- "∨" para OU
- "¬" para NÃO

Retorne SOMENTE um JSON VÁLIDO, no formato EXATO:

{
  "premises": [
    { "label": "P1", "natural": "", "formal": "" },
    { "label": "P2", "natural": "", "formal": "" }
  ],
  "conclusion": { "label": "C", "natural": "", "formal": "" },

  "atoms": {
    "P": "",
    "Q": "",
    "R": ""
  }
}

NÃO explique nada. NÃO escreva comentários. NÃO coloque texto fora do JSON.
NÃO invente fatos que não estejam no texto.

Texto: ${text}
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
