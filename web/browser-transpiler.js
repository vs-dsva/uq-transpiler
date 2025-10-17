// Browser wrapper around existing generator using precompiled Peggy grammar via Vite plugin import
import peggy from 'peggy';
import conceptGrammar from '../concept.peggy?raw'; // Vite raw import of grammar text
import { JavaScriptGenerator } from '../generator.js';

export class BrowserConceptTranspiler {
  constructor(options = {}) {
  this.generator = new JavaScriptGenerator({ ...options, runtimeModule: './concept-runtime-browser.js', browserRuntime: true });
  }

  transpile(source, filename = 'input.uni') {
    if (!this.parser) {
      this.parser = peggy.generate(conceptGrammar);
    }
    const ast = this.parser.parse(source);
    ast.filename = filename;
    const result = this.generator.generate(ast, filename);
    return result.code;
  }
}
