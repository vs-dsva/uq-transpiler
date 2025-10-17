// Concept Language Lexer
// Tokenizes Concept source code into a stream of tokens

export class ConceptLexer {
    constructor() {
        this.keywords = new Set([
            'online', 'xtra', 'field', 'table', 'stream', 'form', 'element',
            'on', 'endon', 'if', 'endif', 'else', 'elseif', 'loop', 'endloop',
            'while', 'endwhile', 'case', 'endcase', 'when', 'otherwise', 'to',
            'assign', 'call', 'return', 'escape', 'break', 'continue',
            'find', 'insert', 'update', 'delete', 'first', 'last', 'next', 'previous',
            'scroll', 'increment', 'compute', 'execute', 'inquire', 'change',
            'static', 'global', 'storage', 'column', 'key', 'initial-value',
            'import', 'export', 'default-style-prefix', 'title', 'text', 'type',
            'position', 'size', 'connect', 'status', 'show', 'hide', 'lock'
        ]);
        
        this.operators = new Set([
            '=', '<>', '!=', '<', '>', '<=', '>=', '&&', '&', '+', '-', '*', '/', '%',
            'and', 'or', 'not', 'in', 'like'
        ]);
        
        this.tokenPatterns = [
            // Comments
            { type: 'COMMENT', pattern: /^\*.*$/gm },
            { type: 'COMMENT', pattern: /^comment\s*\(['"]([^'"]*)['"]\)/gm },
            
            // Constants and includes
            { type: 'CONSTANT', pattern: /^\$constant\s+(\w+)\s+(.*)$/gm },
            { type: 'INCLUDE', pattern: /^\$include\s+(\w+)$/gm },
            { type: 'DOLLAR_SYMBOL', pattern: /\$/g },
            
            // String literals
            { type: 'STRING', pattern: /'([^'\\]|\\.)*'/g },
            { type: 'STRING', pattern: /"([^"\\]|\\.)*"/g },
            
            // Numbers
            { type: 'NUMBER', pattern: /\b\d+(\.\d+)?\b/g },
            
            // Field names in quotes
            { type: 'FIELD_NAME', pattern: /"([^"]+)"/g },
            
            // Event names (starting with @)
            { type: 'EVENT', pattern: /@[a-zA-Z_][a-zA-Z0-9_-]*/g },
            
            // Identifiers and keywords
            { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_][a-zA-Z0-9_-]*\b/g },
            
            // Operators
            { type: 'OPERATOR', pattern: /(<>|<=|>=|!=|&&|[=<>&+\-*/%])/g },
            
            // Punctuation and special characters
            { type: 'LPAREN', pattern: /\(/g },
            { type: 'RPAREN', pattern: /\)/g },
            { type: 'LBRACE', pattern: /\{/g },
            { type: 'RBRACE', pattern: /\}/g },
            { type: 'LBRACKET', pattern: /\[/g },
            { type: 'RBRACKET', pattern: /\]/g },
            { type: 'COMMA', pattern: /,/g },
            { type: 'SEMICOLON', pattern: /;/g },
            { type: 'COLON', pattern: /:/g },
            { type: 'DOT', pattern: /\./g },
            { type: 'EXCLAMATION', pattern: /!/g },
            { type: 'QUESTION', pattern: /\?/g },
            { type: 'PIPE', pattern: /\|/g },
            { type: 'HASH', pattern: /#/g },
            { type: 'AT', pattern: /@/g },
            { type: 'PERCENT', pattern: /%/g },
            { type: 'CARET', pattern: /\^/g },
            { type: 'TILDE', pattern: /~/g },
            { type: 'BACKTICK', pattern: /`/g },
            
            // Whitespace
            { type: 'WHITESPACE', pattern: /\s+/g },
            
            // Newlines
            { type: 'NEWLINE', pattern: /\r?\n/g }
        ];
    }

    /**
     * Tokenize Concept source code
     * @param {string} source - The source code to tokenize
     * @param {string} filename - The filename for error reporting
     * @returns {Token[]} Array of tokens
     */
    tokenize(source, filename = 'unknown.uni') {
        const tokens = [];
        const lines = source.split(/\r?\n/);
        
        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
            const line = lines[lineNumber];
            let position = 0;
            
            while (position < line.length) {
                let matched = false;
                
                for (const { type, pattern } of this.tokenPatterns) {
                    pattern.lastIndex = position;
                    const match = pattern.exec(line);
                    
                    if (match && match.index === position) {
                        const value = match[0];
                        const token = this.createToken(type, value, lineNumber + 1, position + 1, filename);
                        
                        // Skip whitespace tokens in output (but keep for parsing context)
                        if (type !== 'WHITESPACE') {
                            tokens.push(token);
                        }
                        
                        position += value.length;
                        matched = true;
                        break;
                    }
                }
                
                if (!matched) {
                    throw new Error(
                        `Unexpected character '${line[position]}' at ${filename}:${lineNumber + 1}:${position + 1}`
                    );
                }
            }
            
            // Add newline token at end of each line
            if (lineNumber < lines.length - 1) {
                tokens.push(this.createToken('NEWLINE', '\\n', lineNumber + 1, line.length + 1, filename));
            }
        }
        
        // Add EOF token
        tokens.push(this.createToken('EOF', '', lines.length, 0, filename));
        
        return tokens;
    }

    /**
     * Create a token object
     * @param {string} type - Token type
     * @param {string} value - Token value
     * @param {number} line - Line number
     * @param {number} column - Column number
     * @param {string} filename - Source filename
     * @returns {Token}
     */
    createToken(type, value, line, column, filename) {
        // Determine if identifier is a keyword
        if (type === 'IDENTIFIER' && this.keywords.has(value.toLowerCase())) {
            type = 'KEYWORD';
        }
        
        // Determine if operator
        if (type === 'IDENTIFIER' && this.operators.has(value.toLowerCase())) {
            type = 'OPERATOR';
        }
        
        return {
            type,
            value,
            line,
            column,
            filename,
            raw: value
        };
    }

    /**
     * Check if a string is a keyword
     * @param {string} str - String to check
     * @returns {boolean}
     */
    isKeyword(str) {
        return this.keywords.has(str.toLowerCase());
    }

    /**
     * Check if a string is an operator
     * @param {string} str - String to check
     * @returns {boolean}
     */
    isOperator(str) {
        return this.operators.has(str.toLowerCase());
    }
}

/**
 * Token class representing a lexical token
 */
export class Token {
    constructor(type, value, line, column, filename) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
        this.filename = filename;
        this.raw = value;
    }
    
    toString() {
        return `${this.type}(${this.value}) at ${this.filename}:${this.line}:${this.column}`;
    }
}