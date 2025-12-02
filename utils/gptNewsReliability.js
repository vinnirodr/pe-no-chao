const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Avalia a confiabilidade factual de uma premissa
 * usando o conhecimento interno do modelo + referências de fontes reais.
 */
async function evaluateReliability(premise) {
    const prompt = `
Você é um verificador de fatos profissional.

Avalie a seguinte premissa consultando seu conhecimento INTERNO
sobre o que é afirmado por fontes amplamente reconhecidas, como:

- Organização Mundial da Saúde (OMS) → https://www.who.int/
- CDC (Centers for Disease Control and Prevention) → https://www.cdc.gov/
- Nature → https://www.nature.com/
- Science → https://www.science.org/
- Reuters → https://www.reuters.com/
- BBC → https://www.bbc.com/news
- Fiocruz → https://portal.fiocruz.br/
- USP → https://www5.usp.br/

IMPORTANTE:
- NÃO invente domínios estranhos.
- Use apenas os domínios oficiais listados acima.
- Se não houver posição clara de uma fonte, escreva "Sem posição clara conhecida".
- NÃO crie URLs ultra específicas; use a home ou páginas temáticas gerais que existam mesmo.

Retorne APENAS JSON VÁLIDO no formato:

{
  "premise": "",
  "sources": [
    { "fonte": "", "opniao": "", "link": "" },
    { "fonte": "", "opniao": "", "link": "" },
    { "fonte": "", "opniao": "", "link": "" }
  ],
  "consenso": 0.00,
  "nota_confiabilidade": 0.00,
  "analise": ""
}

Regras:
- Use no mínimo 3 fontes da lista acima.
- "consenso" = nível de concordância entre as fontes (0 a 1).
- "nota_confiabilidade" = quão confiável é a premissa baseada nesse conjunto de fontes (0 a 1).
- Se a ciência não tem consenso, diga explicitamente e reduza a nota.
- Seja neutro, honesto e objetivo.
- Não escreva NADA fora do JSON.

Premissa:
"${premise}"
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
        console.error("Erro ao parsear JSON de confiabilidade:", raw);
        throw new Error("GPT returned invalid reliability JSON");
    }
}

module.exports = evaluateReliability;
