const axios = require('axios');

class FactChecker {
    constructor() {
        // Redis removido — versão simplificada
    }

    async verify(premiseText) {
        // 1. Check Sources in Parallel
        const results = await Promise.all([
            this._checkIBGE(premiseText),
            this._checkWikidata(premiseText)
        ]);

        const sources = results.filter(r => r !== null);
        const isVerified = sources.some(s => s.confidence > 0.7);

        return {
            premise_text: premiseText,
            verified: isVerified,
            status: isVerified ? "VERIFIED" : "UNVERIFIED",
            sources: sources,
            overall_confidence: sources.length > 0 ? Math.max(...sources.map(s => s.confidence)) : 0,
            cached: false,
            last_verified: new Date().toISOString()
        };
    }

    async _checkIBGE(text) {
        try {
            const keywords = text.split(' ').filter(w => w.length > 4).join(' ');
            const url = `http://servicodados.ibge.gov.br/api/v3/noticias/?busca=${encodeURIComponent(keywords)}`;

            const res = await axios.get(url, { timeout: 5000 });
            if (res.data.items && res.data.items.length > 0) {
                const topItem = res.data.items[0];
                return {
                    name: "IBGE Notícias",
                    url: topItem.link,
                    data: topItem.titulo,
                    confidence: 0.8
                };
            }
        } catch (e) {
            console.error("IBGE API Error:", e.message);
        }
        return null;
    }

    async _checkWikidata(text) {
        try {
            const keywords = text.split(' ').filter(w => w.length > 5);
            if (keywords.length === 0) return null;

            const keyword = keywords[0];
            const sparql = `
                SELECT ?item ?itemLabel ?itemDescription WHERE {
                  ?item ?label "${keyword}"@pt.
                  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt". }
                } LIMIT 1
            `;

            const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;

            const res = await axios.get(url, { timeout: 5000 });
            if (res.data.results.bindings.length > 0) {
                const item = res.data.results.bindings[0];
                return {
                    name: "Wikidata",
                    url: item.item.value,
                    data: item.itemDescription ? item.itemDescription.value : item.itemLabel.value,
                    confidence: 0.6
                };
            }
        } catch (e) {
            console.error("Wikidata API Error:", e.message);
        }
        return null;
    }
}

module.exports = FactChecker;
