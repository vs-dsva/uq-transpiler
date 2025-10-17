// Concept to JavaScript Transpiler
// Main entry point for the transpiler

// Using Peggy parser instead of hand-coded lexer/parser
import { PeggyConceptParser } from './peggy-transpiler.js';
import { JavaScriptGenerator } from './generator.js';
import fs from 'fs';
import path from 'path';

export class ConceptTranspiler {
    constructor(options = {}) {
        this.options = {
            outputDir: options.outputDir || './output',
            preserveComments: options.preserveComments !== false,
            generateSourceMaps: options.generateSourceMaps || false,
            target: options.target || 'es2018',
            ...options
        };
        
        // Use Peggy-based parser
        this.parser = new PeggyConceptParser();
        this.generator = new JavaScriptGenerator(this.options);
    }

    /**
     * Transpile a single Concept file to JavaScript
     * @param {string} inputPath - Path to the Concept file (.uni, .inc, .uci)
     * @param {string} outputPath - Optional output path for the JavaScript file
     * @returns {Promise<string>} The generated JavaScript code
     */
    async transpileFile(inputPath, outputPath = null) {
        try {
            const sourceCode = await fs.promises.readFile(inputPath, 'utf-8');
            const result = await this.transpile(sourceCode, inputPath, outputPath);
            
            if (outputPath) {
                await fs.promises.writeFile(outputPath, result.code, 'utf-8');
                if (result.sourceMap && this.options.generateSourceMaps) {
                    await fs.promises.writeFile(outputPath + '.map', JSON.stringify(result.sourceMap), 'utf-8');
                }
            }
            
            return result.code;
        } catch (error) {
            throw new Error(`Failed to transpile ${inputPath}: ${error.message}`);
        }
    }

    /**
     * Transpile Concept source code to JavaScript
     * @param {string} sourceCode - The Concept source code
     * @param {string} filename - Original filename for source mapping
     * @param {string} outputPath - Optional output path for calculating relative imports
     * @returns {Promise<{code: string, sourceMap?: object}>}
     */
    async transpile(sourceCode, filename = 'unknown.uni', outputPath = null) {
        try {
            // Step 1: Parse with Ohm (combines lexing and parsing)
            const ast = this.parser.parse(sourceCode, filename);
            
            // Step 2: Code generation
            const result = this.generator.generate(ast, filename, outputPath);
            
            return result;
        } catch (error) {
            throw new Error(`Transpilation failed: ${error.message}`);
        }
    }

    /**
     * Transpile a directory of Concept files
     * @param {string} inputDir - Directory containing Concept files
     * @param {string} outputDir - Directory for generated JavaScript files
     * @returns {Promise<string[]>} Array of generated file paths
     */
    async transpileDirectory(inputDir, outputDir = null) {
        const output = outputDir || this.options.outputDir;
        await fs.promises.mkdir(output, { recursive: true });
        
        const files = await this.findConceptFiles(inputDir);
        const results = [];
        
        for (const file of files) {
            const relativePath = path.relative(inputDir, file);
            const outputPath = path.join(output, relativePath.replace(/\.(uni|inc|uci)$/i, '.js'));
            
            await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
            await this.transpileFile(file, outputPath);
            results.push(outputPath);
        }
        
        return results;
    }

    /**
     * Find all Concept files in a directory
     * @param {string} dir - Directory to search
     * @returns {Promise<string[]>} Array of file paths
     */
    async findConceptFiles(dir) {
        const files = [];
        
        async function scan(currentDir) {
            const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                
                if (entry.isDirectory()) {
                    await scan(fullPath);
                } else if (entry.isFile() && /\.(uni|inc|uci)$/i.test(entry.name)) {
                    files.push(fullPath);
                }
            }
        }
        
        await scan(dir);
        return files;
    }
}

export default ConceptTranspiler;