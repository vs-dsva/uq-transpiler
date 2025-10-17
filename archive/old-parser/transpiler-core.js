// Transpiler Core - Browser-compatible ES module
// Shared between CLI and Web versions

import { ConceptLexer } from './lexer.js';
import { ConceptParser } from './parser.js';
import { JavaScriptGenerator } from './generator.js';

export class ConceptTranspilerCore {
    constructor(options = {}) {
        this.options = {
            preserveComments: options.preserveComments !== false,
            generateSourceMaps: options.generateSourceMaps || false,
            target: options.target || 'es2018',
            ...options
        };
        
        this.lexer = new ConceptLexer();
        this.parser = new ConceptParser();
        this.generator = new JavaScriptGenerator(this.options);
    }

    /**
     * Transpile Concept source code to JavaScript
     * @param {string} sourceCode - The Concept source code
     * @param {string} filename - Original filename for source mapping
     * @returns {Promise<{code: string, sourceMap?: object, ast?: object, tokens?: array}>}
     */
    async transpile(sourceCode, filename = 'unknown.uni') {
        try {
            // Step 1: Lexical analysis
            const tokens = this.lexer.tokenize(sourceCode, filename);
            
            // Step 2: Parsing
            const ast = this.parser.parse(tokens);
            
            // Step 3: Code generation
            const result = this.generator.generate(ast, filename);
            
            return {
                success: true,
                code: result.code,
                sourceMap: result.sourceMap,
                ast: ast,
                tokens: tokens,
                filename: filename
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                stack: error.stack,
                filename: filename
            };
        }
    }

    /**
     * Analyze Concept source code without generating JavaScript
     * @param {string} sourceCode - The Concept source code
     * @param {string} filename - Original filename
     * @returns {Promise<{tokens: array, ast: object, stats: object}>}
     */
    async analyze(sourceCode, filename = 'unknown.uni') {
        try {
            // Step 1: Lexical analysis
            const tokens = this.lexer.tokenize(sourceCode, filename);
            
            // Step 2: Parsing
            const ast = this.parser.parse(tokens);
            
            // Generate statistics
            const stats = this.generateStats(sourceCode, tokens, ast);
            
            return {
                success: true,
                tokens: tokens,
                ast: ast,
                stats: stats,
                filename: filename
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                stack: error.stack,
                filename: filename
            };
        }
    }

    /**
     * Generate statistics about the source code
     * @param {string} sourceCode - The source code
     * @param {array} tokens - Tokenized code
     * @param {object} ast - Abstract syntax tree
     * @returns {object} Statistics object
     */
    generateStats(sourceCode, tokens, ast) {
        const lines = sourceCode.split('\n').length;
        const characters = sourceCode.length;
        const size = characters / 1024; // KB
        
        // Count token types
        const tokenCounts = {};
        tokens.forEach(token => {
            tokenCounts[token.type] = (tokenCounts[token.type] || 0) + 1;
        });
        
        // Count AST node types
        const astCounts = {};
        this.countASTNodes(ast, astCounts);
        
        return {
            lines,
            characters,
            size: parseFloat(size.toFixed(2)),
            tokens: {
                total: tokens.length,
                types: tokenCounts
            },
            ast: {
                nodes: astCounts
            }
        };
    }

    /**
     * Recursively count AST node types
     * @param {object} node - AST node
     * @param {object} counts - Counts object to update
     */
    countASTNodes(node, counts) {
        if (!node || typeof node !== 'object') return;
        
        if (node.type) {
            counts[node.type] = (counts[node.type] || 0) + 1;
        }
        
        // Recursively count children
        Object.keys(node).forEach(key => {
            const value = node[key];
            if (Array.isArray(value)) {
                value.forEach(item => this.countASTNodes(item, counts));
            } else if (typeof value === 'object') {
                this.countASTNodes(value, counts);
            }
        });
    }
}

// Browser-specific wrapper for easy web usage
export class BrowserConceptTranspiler extends ConceptTranspilerCore {
    constructor(options = {}) {
        super({
            target: 'browser',
            generateSourceMaps: false,
            ...options
        });
    }

    /**
     * Simple transpile method compatible with the old web interface
     * @param {string} sourceCode - Concept source code
     * @returns {Promise<{success: boolean, code?: string, error?: string, ast?: object}>}
     */
    async transpileSync(sourceCode) {
        const result = await this.transpile(sourceCode, 'web-input.uni');
        
        if (result.success) {
            return {
                success: true,
                code: result.code,
                ast: result.ast
            };
        } else {
            return {
                success: false,
                error: result.error
            };
        }
    }
}