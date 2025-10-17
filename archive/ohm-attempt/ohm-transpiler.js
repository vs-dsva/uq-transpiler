// Ohm-based Concept Transpiler
// Replaces the hand-coded lexer and parser with Ohm.js grammar

import * as ohm from 'ohm-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSemantics } from './concept-semantics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class OhmConceptParser {
    constructor() {
        // Load the grammar file
        const grammarPath = path.join(__dirname, 'concept.ohm');
        const grammarSource = fs.readFileSync(grammarPath, 'utf8');
        
        // Create the grammar and semantics
        this.grammar = ohm.grammar(grammarSource);
        this.semantics = createSemantics(this.grammar);
    }

    /**
     * Parse Concept source code into an AST
     * @param {string} source - The source code to parse
     * @param {string} filename - Optional filename for error reporting
     * @returns {ASTNode} The root AST node
     * @throws {Error} If parsing fails
     */
    parse(source, filename = 'unknown.uni') {
        // Normalize line endings to \n
        const normalizedSource = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Match the source against the grammar
        const matchResult = this.grammar.match(normalizedSource);
        
        if (matchResult.failed()) {
            // Generate a helpful error message
            const error = this.formatError(matchResult, filename);
            throw new Error(error);
        }
        
        // Generate the AST using semantic actions
        const ast = this.semantics(matchResult).toAST();
        
        // Add filename to the AST
        if (ast) {
            ast.filename = filename;
        }
        
        return ast;
    }

    /**
     * Format a parse error with helpful context
     * @param {MatchResult} matchResult - The failed match result
     * @param {string} filename - The source filename
     * @returns {string} Formatted error message
     */
    formatError(matchResult, filename) {
        const message = matchResult.message;
        
        // Extract line and column information from the message
        const lines = message.split('\n');
        const firstLine = lines[0];
        
        // Ohm provides line:col in the message
        return `Parse error in ${filename}:\n${message}`;
    }

    /**
     * Check if source code would parse successfully (for validation)
     * @param {string} source - The source code to check
     * @returns {boolean} True if parsing would succeed
     */
    isValid(source) {
        try {
            const normalizedSource = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const matchResult = this.grammar.match(normalizedSource);
            return matchResult.succeeded();
        } catch (e) {
            return false;
        }
    }

    /**
     * Get detailed match information for debugging
     * @param {string} source - The source code
     * @returns {object} Match result with details
     */
    getMatchDetails(source) {
        const normalizedSource = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const matchResult = this.grammar.match(normalizedSource);
        
        return {
            succeeded: matchResult.succeeded(),
            message: matchResult.message,
            shortMessage: matchResult.shortMessage,
            // Include more details if available
            matchResult: matchResult
        };
    }
}

/**
 * Backward compatibility layer
 * Provides the same interface as the old lexer/parser
 */
export class ConceptLexer {
    tokenize(source, filename = 'unknown.uni') {
        // For backward compatibility, we can return a simplified token list
        // However, with Ohm, we skip the tokenization step
        // Return an empty array or throw an error suggesting to use the new parser
        console.warn('ConceptLexer.tokenize() is deprecated. Use OhmConceptParser.parse() directly.');
        return [];
    }
}

export class ConceptParser {
    constructor() {
        this.ohmParser = new OhmConceptParser();
    }

    parse(tokens) {
        // For backward compatibility, if called with tokens array
        // This shouldn't happen with the new flow, but provide a helpful error
        if (Array.isArray(tokens)) {
            throw new Error(
                'ConceptParser.parse() no longer accepts token arrays. ' +
                'Use OhmConceptParser with source code directly.'
            );
        }
        
        // If called with source string (new way)
        return this.ohmParser.parse(tokens);
    }
}

/**
 * Helper function to create a parser instance
 * @returns {OhmConceptParser}
 */
export function createParser() {
    return new OhmConceptParser();
}

/**
 * Quick parse function for convenience
 * @param {string} source - Source code
 * @param {string} filename - Optional filename
 * @returns {ASTNode}
 */
export function parseConceptCode(source, filename = 'unknown.uni') {
    const parser = new OhmConceptParser();
    return parser.parse(source, filename);
}
