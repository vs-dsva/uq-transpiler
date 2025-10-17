import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import peggy from 'peggy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PeggyConceptParser {
    constructor() {
        // Load and compile the grammar
        const grammarPath = join(__dirname, 'concept.peggy');
        const grammarSource = readFileSync(grammarPath, 'utf-8');
        
        try {
            this.parser = peggy.generate(grammarSource);
        } catch (error) {
            console.error('Failed to compile Peggy grammar:', error);
            throw error;
        }
    }

    parse(source, filename = 'unknown') {
        try {
            const ast = this.parser.parse(source);
            ast.filename = filename;
            return ast;
        } catch (error) {
            if (error.location) {
                const { start } = error.location;
                throw new Error(
                    `Parse error in ${filename}:\n` +
                    `Line ${start.line}, column ${start.column}:\n` +
                    `${error.message}`
                );
            }
            throw error;
        }
    }
}
