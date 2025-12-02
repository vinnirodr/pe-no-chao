class Parser {
    constructor() {
        this.text = "";
        this.pos = 0;
    }

    parse(input) {
        this.text = (input || "").replace(/\s+/g, "");
        this.pos = 0;

        if (!this.text) {
            throw new Error("Empty formula");
        }

        const expr = this.parseImplication();

        if (this.pos !== this.text.length) {
            throw new Error(
                `Unexpected input at position ${this.pos}: '${this.text.slice(this.pos)}'`
            );
        }

        return expr;
    }

    peek() {
        return this.text[this.pos];
    }

    consume() {
        return this.text[this.pos++];
    }

    match(str) {
        if (this.text.startsWith(str, this.pos)) {
            this.pos += str.length;
            return true;
        }
        return false;
    }

    // implication: orExpr ('->' implication)?
    parseImplication() {
        let left = this.parseOr();
        while (this.match("->")) {
            const right = this.parseImplication();
            left = { type: "imp", left, right };
        }
        return left;
    }

    // orExpr: andExpr (('∨' | 'v') andExpr)*
    parseOr() {
        let left = this.parseAnd();

        while (true) {
            const ch = this.peek();
            if (ch === "∨" || ch === "v") {
                this.consume();
                const right = this.parseAnd();
                left = { type: "or", left, right };
            } else {
                break;
            }
        }

        return left;
    }

    // andExpr: notExpr (('∧' | '&') notExpr)*
    parseAnd() {
        let left = this.parseNot();

        while (true) {
            const ch = this.peek();
            if (ch === "∧" || ch === "&") {
                this.consume();
                const right = this.parseNot();
                left = { type: "and", left, right };
            } else {
                break;
            }
        }

        return left;
    }

    // notExpr: ('¬' | '!') notExpr | atom
    parseNot() {
        const ch = this.peek();
        if (ch === "¬" || ch === "!") {
            this.consume();
            const operand = this.parseNot();
            return { type: "not", operand };
        }

        return this.parseAtom();
    }

    // atom: VAR | '(' implication ')'
    parseAtom() {
        const ch = this.peek();

        if (ch === "(") {
            this.consume();
            const expr = this.parseImplication();
            if (this.peek() !== ")") {
                throw new Error(`Expected ')' at position ${this.pos}`);
            }
            this.consume();
            return expr;
        }

        if (!ch) {
            throw new Error(`Unexpected end of input at position ${this.pos}`);
        }

        // variável proposicional: letra maiúscula
        if (/[A-Z]/.test(ch)) {
            this.consume();
            return { type: "var", name: ch };
        }

        throw new Error(
            `Unexpected character '${ch}' at position ${this.pos}`
        );
    }
}

module.exports = Parser;
