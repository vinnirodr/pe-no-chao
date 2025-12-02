const axios = require("axios");

class FactChecker {
    constructor() {
        this.apiKey = process.env.PERPLEXITY_API_KEY;
        this.model = "sonar-reasoning";
    }

    async verify(text) {
        if (!this.apiKey) {
            console.warn("⚠️ PERPLEXITY_API_KEY não encontrada. Retornando fallback.");
            return this.fakeResponse(text);
        }

        try {
            console.log(`🔍 Verificando premissa (Perplexity): "${text}"`);

            const response = await axios.post(
                "https://api.perplexity.ai/chat/completions",
                {
                    model: this.model,
                    messages: [
                        {
                            role: "system",
                            content:
                                "Você é um verificador de fatos rigoroso. Sempre pesquise antes de responder.\n" +
                                "Use fontes confiáveis e verificáveis, como órgãos oficiais, instituições científicas, dados governamentais,\n" +
                                "jornais de credibilidade e pesquisas acadêmicas.\n\n" +
                                "Sua missão:\n" +
                                "1) Pesquisar informações relevantes.\n" +
                                "2) Comparar com a afirmação enviada.\n" +
                                "3) Classificar como: VERDADEIRO, FALSO ou SUSPEITO.\n" +
                                "4) Explicar de forma simples para o usuário (linguagem humana, clara e direta).\n\n" +
                                "Retorne SEMPRE um JSON no formato:\n" +
                                "{\n" +
                                '  "veredito": "VERDADEIRO | FALSO | SUSPEITO",\n' +
                                '  "explicacao": "texto explicando em linguagem amigável",\n' +
                                '  "confidence": 0.0 a 1.0\n' +
                                "}"
                        },
                        {
                            role: "user",
                            content: `Verifique a factualidade da afirmação abaixo utilizando fontes confiáveis.\nRetorne APENAS o JSON.\n\nPremissa: "${text}"`
                        }
                    ],
                    max_tokens: 300
                },
                {
                    headers: {
                        "Authorization": `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const raw = response.data?.choices?.[0]?.message?.content?.trim() || "";

            let parsed;
            try {
                parsed = JSON.parse(raw);
            } catch (err) {
                console.warn("⚠️ Perplexity não retornou JSON puro. Raw:", raw);
                parsed = {
                    veredito: "SUSPEITO",
                    explicacao:
                        "Não consegui confirmar essa afirmação com segurança. Ela pode ser verdadeira ou falsa dependendo do contexto.",
                    confidence: 0.5
                };
            }

            return {
                text,
                verified: parsed.veredito === "VERDADEIRO",
                veredito: parsed.veredito,
                explicacao: parsed.explicacao,
                confidence: parsed.confidence ?? 0.5
            };

        } catch (err) {
            console.error("❌ Erro ao chamar Perplexity:", err.message);
            return this.fakeResponse(text);
        }
    }

    fakeResponse(text) {
        return {
            text,
            verified: false,
            veredito: "SUSPEITO",
            explicacao:
                "Não foi possível verificar essa informação agora. Tente novamente mais tarde.",
            confidence: 0.2
        };
    }
}

module.exports = FactChecker;
