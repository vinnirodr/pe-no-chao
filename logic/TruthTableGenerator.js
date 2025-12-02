const Parser = require("./Parser");

class TruthTableGenerator {
    constructor() {
        this.parser = new Parser();
    }

    /**
     * premisesFormal: array de fórmulas, ex: ["(P -> Q)", "P"]
     * conclusionFormal: string, ex: "Q"
     */
    validate(premisesFormal, conclusionFormal) {
        if (!Array.isArray(premisesFormal) || premisesFormal.length === 0) {
            throw new Error("At least one premise is required");
        }
        if (!conclusionFormal) {
            throw new Error("Conclusion is required");
        }

        // 1. Parse das fórmulas
        const premiseASTs = premisesFormal.map((f) => this.parser.parse(f));
        const conclusionAST = this.parser.parse(conclusionFormal);

        // 2. Coletar átomos (P, Q, R...)
        const atomSet = new Set();
        for (const ast of [...premiseASTs, conclusionAST]) {
            this.collectAtoms(ast, atomSet);
        }
        const atoms = Array.from(atomSet).sort(); // [ "P", "Q", ... ]

        // 3. Gerar tabela verdade
        const truthTable = [];
        const counterexamples = [];

        const totalRows = 1 << atoms.length; // 2^n

        for (let mask = 0; mask < totalRows; mask++) {
            const assignment = {};

            atoms.forEach((name, i) => {
                assignment[name] = !!(mask & (1 << i));
            });

            const premiseValues = premiseASTs.map((ast) =>
                this.evaluate(ast, assignment)
            );
            const conclusionValue = this.evaluate(conclusionAST, assignment);

            const allPremisesTrue = premiseValues.every((v) => v === true);
            const validHere = !allPremisesTrue || conclusionValue === true;

            const row = {
                ...assignment,
                premises: premiseValues,
                conclusion: conclusionValue,
                ALL_PREMISES: allPremisesTrue,
                VALID: validHere,
            };

            truthTable.push(row);

            if (allPremisesTrue && !conclusionValue) {
                counterexamples.push({
                    assignment: { ...assignment },
                    premises: premiseValues,
                    conclusion: conclusionValue,
                    explanation:
                        "Premissas verdadeiras e conclusão falsa neste cenário.",
                });
            }
        }

        const isValid = counterexamples.length === 0;

        return {
            isValid,
            atoms,
            truthTable,
            counterexamples,
            explanation: isValid
                ? "Argumento válido: não há caso em que todas as premissas sejam verdadeiras e a conclusão falsa."
                : "Argumento inválido: existe pelo menos um caso em que todas as premissas são verdadeiras e a conclusão é falsa.",
        };
    }

    collectAtoms(ast, set) {
        switch (ast.type) {
            case "var":
                set.add(ast.name);
                break;
            case "not":
                this.collectAtoms(ast.operand, set);
                break;
            case "and":
            case "or":
            case "imp":
            case "iff":
                this.collectAtoms(ast.left, set);
                this.collectAtoms(ast.right, set);
                break;
        }
    }

    evaluate(ast, env) {
        switch (ast.type) {
            case "var":
                return !!env[ast.name];

            case "not":
                return !this.evaluate(ast.operand, env);

            case "and":
                return (
                    this.evaluate(ast.left, env) &&
                    this.evaluate(ast.right, env)
                );

            case "or":
                return (
                    this.evaluate(ast.left, env) ||
                    this.evaluate(ast.right, env)
                );

            case "imp": {
                const left = this.evaluate(ast.left, env);
                const right = this.evaluate(ast.right, env);
                // P -> Q ≡ ¬P ∨ Q
                return !left || right;
            }

            case "iff": {
                const left = this.evaluate(ast.left, env);
                const right = this.evaluate(ast.right, env);
                return left === right;
            }

            default:
                throw new Error(`Unknown AST node type: ${ast.type}`);
        }
    }
}

module.exports = TruthTableGenerator;
