require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const TruthTableGenerator = require('./logic/TruthTableGenerator');
const analyzeWithGPT = require('./utils/gptAnalyzer');
const evaluateReliability = require('./utils/gptNewsReliability');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const generator = new TruthTableGenerator();

/* -----------------------------------------------------------
   🔵 Health
------------------------------------------------------------- */
app.get('/', (req, res) => {
    res.json({ message: 'Pé no Chão Backend API is running — no DB mode!' });
});

/* -----------------------------------------------------------
   🔍 Validação Lógica
------------------------------------------------------------- */
app.post('/api/v1/validate-logic', (req, res) => {
    const { premises, conclusion } = req.body;

    if (!premises || !conclusion) {
        return res.status(400).json({ error: 'Missing premises or conclusion' });
    }

    const result = generator.validate(premises, conclusion);
    res.json(result);
});

/* -----------------------------------------------------------
   🧠 Análise completa (GPT + lógica formal)
------------------------------------------------------------- */
app.post('/api/v1/analyses', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Missing text' });
    }

    try {
        // 1. GPT extrai premissas, conclusão e fórmulas
        const gptData = await analyzeWithGPT(text);

        // protege premissas (garante array)
        const premises = Array.isArray(gptData.premises) ? gptData.premises : [];

        // protege proposições (garante objeto)
        const propositions = gptData.propositions || {};

        // extrai forma lógica das premissas
        const formalPremises = premises.map(p => p.formal || null);

        // protege conclusão
        const formalConclusion = gptData.conclusion?.formal || null;

        // 2. Análise lógica
        let logicResult = {
            isValid: false,
            steps: [],
            message: "Sem conclusão — não é possível validar argumento lógico"
        };

        if (formalConclusion !== null) {
            logicResult = generator.validate(formalPremises, formalConclusion);
        }

        // 3. Confiabilidade das premissas com GPT
        const newsReliability = await Promise.all(
            premises.map(p => evaluateReliability(p.natural))
        );

        const meanReliability =
            newsReliability.reduce((acc, item) => acc + (item.nota_confiabilidade || 0), 0) /
            (newsReliability.length || 1);

        // 4. Veredito geral
        let verdict = "SUSPEITO";

        if (logicResult.isValid && meanReliability > 0.75) {
            verdict = "CONFIÁVEL";
        } else if (logicResult.isValid && meanReliability >= 0.4) {
            verdict = "SUSPEITO (confiabilidade parcial)";
        } else if (meanReliability < 0.4) {
            verdict = "FALSO OU ENGANOSO";
        }

        // 5. Resposta final
        res.json({
            input: text,
            gpt: gptData,
            propositions,
            premises, // devolve a lista processada
            logic: logicResult,
            noticias: newsReliability,
            confiabilidade_media: meanReliability,
            verdict
        });

    } catch (err) {
        console.error("❌ ERROR:", err);
        res.status(500).json({ error: 'Analysis error', details: err.message });
    }
});

/* -----------------------------------------------------------
   🚀 Start server
------------------------------------------------------------- */
app.listen(port, () => {
    console.log(`Server running on port ${port} (NO DB MODE)`);
});
