const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/analisar", async (req, res) => {
    try {
        const { texto } = req.body;

        if (!texto) {
            return res.status(400).json({ erro: "O campo 'texto' é obrigatório." });
        }

        const prompt = `
Extraia premissas (P1, P2) e conclusão (C) do texto:
"${texto}"

Depois verifique:
1. A lógica é válida (P1 ∧ P2 → C)?
2. A conclusão é verdadeira segundo fontes confiáveis?

Responda em JSON:
{
  "premissas": { "P1": "", "P2": "" },
  "conclusao": "",
  "valido": true/false,
  "factual": "confiavel/suspeito/falso",
  "fontes": ["...", "..."]
}
`;

        const resposta = await axios.post(
            "https://api.perplexity.ai/chat/completions",
            {
                model: "sonar",
                messages: [{ role: "user", content: prompt }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const output = resposta.data.choices[0].message.content;
        res.json({ resultado: output });

    } catch (erro) {
        console.error("Erro na API:", erro);
        res.status(500).json({ erro: "Erro interno ao analisar." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT} 🔥`);
});
