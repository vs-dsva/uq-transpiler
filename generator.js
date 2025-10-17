// JavaScript Code Generator
// Converts Concept AST to JavaScript code

export class JavaScriptGenerator {
    constructor(options = {}) {
        this.options = {
            indentSize: 2,
            useStrict: true,
            generateComments: true,
            targetES6: true,
            ...options
        };
        
        this.indent = 0;
        this.output = [];
        this.constants = new Map();
        this.fields = new Map();
        this.currentFunction = null;
    }

    /**
     * Generate JavaScript code from AST
     * @param {ASTNode} ast - The root AST node
     * @param {string} filename - Source filename
     * @param {string} outputPath - Optional output path for calculating relative imports
     * @returns {{code: string, sourceMap?: object}}
     */
    generate(ast, filename = 'unknown.uni', outputPath = null) {
        this.output = [];
        this.indent = 0;
        this.constants.clear();
        this.fields.clear();
        
        // Add file header
        this.addHeader(filename, outputPath);
        
        // Generate code for the program
        this.generateProgram(ast);
        
        return {
            code: this.output.join('\n')
        };
    }

    /**
     * Add header comments and imports
     */
    addHeader(filename, outputPath = null) {
        this.emit(`// Generated from ${filename}`);
        this.emit(`// Concept to JavaScript transpiler`);
        this.emit('');
        
        if (this.options.useStrict) {
            this.emit('"use strict";');
            this.emit('');
        }
        
        // Calculate relative path to concept-runtime.js
        let runtimePath = "./concept-runtime.js";
        if (outputPath) {
            // Simple path calculation for subdirectories
            const outputPathParts = outputPath.split(/[/\\]/);
            const nestingLevel = outputPathParts.length - 1;
            
            if (nestingLevel > 0) {
                // If we're in a subdirectory, go back to parent
                runtimePath = "../concept-runtime.js";
                // Add additional ../ for deeper nesting
                for (let i = 1; i < nestingLevel; i++) {
                    runtimePath = "../" + runtimePath;
                }
            }
        }
        
        // Add concept runtime imports
        this.emit(`import { ConceptRuntime } from "${runtimePath}";`);
        this.emit('');
    }

    /**
     * Generate code for program node
     */
    generateProgram(node) {
        // First pass: collect constants, field declarations, and event handlers
        this.eventHandlers = [];
        
        for (const stmt of node.body) {
            if (stmt.type === 'Constant') {
                this.constants.set(stmt.name, stmt.value);
            } else if (stmt.type === 'FieldDeclaration') {
                this.fields.set(stmt.name, stmt);
            } else if (stmt.type === 'OnlineApplication') {
                // Collect fields and event handlers from online application body
                for (const bodyStmt of stmt.body) {
                    if (bodyStmt.type === 'FieldDeclaration') {
                        this.fields.set(bodyStmt.name, bodyStmt);
                    } else if (bodyStmt.type === 'EventHandler') {
                        this.eventHandlers.push(bodyStmt);
                    }
                }
            } else if (stmt.type === 'XtraFunction') {
                // Collect event handlers from XTRA function body
                const functionName = this.sanitizeFunctionName(stmt.name);
                for (const bodyStmt of stmt.body) {
                    if (bodyStmt.type === 'EventHandler') {
                        // Store context information
                        bodyStmt._context = functionName;
                        this.eventHandlers.push(bodyStmt);
                    }
                }
            } else if (stmt.type === 'EventHandler') {
                this.eventHandlers.push(stmt);
            }
        }
        
        this.emit('class ConceptApplication {');
        this.increaseIndent();
        
        this.emit('constructor() {');
        this.increaseIndent();
        this.emit('this.runtime = new ConceptRuntime();');
        this.emit('this.runtime.setApplication(this);');
        this.emit('this.fields = {};');
        this.emit('this.constants = {};');
        this.emit('this.eventHandlers = {};');
        this.emit('');
        
        // Generate constants inside constructor
        if (this.constants.size > 0) {
            this.emit('// Initialize constants');
            for (const [name, value] of this.constants) {
                this.emit(`this.constants.${name} = ${this.generateConstantValue(value)};`);
            }
            this.emit('');
        }
        
        this.decreaseIndent();
        this.emit('}');
        this.emit('');
        
        // Add field initializations
        if (this.fields.size > 0) {
            this.emit('initializeFields() {');
            this.increaseIndent();
            for (const [name, field] of this.fields) {
                this.generateFieldInitialization(field);
            }
            this.decreaseIndent();
            this.emit('}');
            this.emit('');
        }
        
        // Second pass: generate other statements
        for (const stmt of node.body) {
            this.generateStatement(stmt);
        }
        
        // Add main method
        this.emit('async run() {');
        this.increaseIndent();
        if (this.fields.size > 0) {
            this.emit('this.initializeFields();');
        }
        
        // Register all event handlers
        this.emit('// Register event handlers');
        for (const eventHandler of this.eventHandlers) {
            const eventName = this.sanitizeEventName(eventHandler.event);
            const contextSuffix = eventHandler._context ? `_${eventHandler._context}` : '';
            const eventToRegister = eventHandler._specificEventName || eventHandler.event;
            this.emit(`this.runtime.registerEventHandler("${eventToRegister}", this.handle_${eventName}${contextSuffix}.bind(this));`);
        }
        
        this.emit('await this.runtime.triggerEvent("@START");');
        this.emit('return this;');
        this.decreaseIndent();
        this.emit('}');
        this.emit('');
        
        // Add static factory method
        this.emit('static async create() {');
        this.increaseIndent();
        this.emit('const app = new ConceptApplication();');
        this.emit('return await app.run();');
        this.decreaseIndent();
        this.emit('}');
        
        this.decreaseIndent();
        this.emit('}');
        this.emit('');
        this.emit('export default ConceptApplication;');
    }

    /**
     * Generate code for a statement
     */
    generateStatement(node) {
        if (!node) return;
        
        switch (node.type) {
            case 'Comment':
                this.generateComment(node);
                break;
            case 'Include':
                this.generateInclude(node);
                break;
            case 'OnlineApplication':
                this.generateOnlineApplication(node);
                break;
            case 'XtraFunction':
                this.generateXtraFunction(node);
                break;
            case 'EventHandler':
                this.generateEventHandler(node);
                break;
            case 'Assignment':
                this.generateAssignment(node);
                break;
            case 'FunctionCall':
                this.generateFunctionCall(node);
                break;
            case 'IfStatement':
                this.generateIfStatement(node);
                break;
            case 'LoopStatement':
                this.generateLoopStatement(node);
                break;
            case 'FieldDeclaration':
                // Already handled in first pass
                break;
            case 'Constant':
                // Already handled in first pass
                break;
            default:
                this.emit(`${this.getIndent()}// TODO: Generate ${node.type}`);
        }
    }

    /**
     * Generate comment
     */
    generateComment(node) {
        if (this.options.generateComments) {
            const comment = node.value.replace(/^\*\s*/, '');
            this.emit(`${this.getIndent()}// ${comment}`);
        }
    }

    /**
     * Generate include statement
     */
    generateInclude(node) {
        this.emit(`${this.getIndent()}// Include: ${node.filename}`);
        this.emit(`${this.getIndent()}// TODO: Load ${node.filename}.js`);
    }

    /**
     * Generate online application
     */
    generateOnlineApplication(node) {
        this.emit(`${this.getIndent()}// Online Application: ${node.name}`);
        this.emit(`${this.getIndent()}setApplicationName(name) {`);
        this.increaseIndent();
        this.emit(`${this.getIndent()}this.applicationName = "${node.name}";`);
        this.decreaseIndent();
        this.emit(`${this.getIndent()}}`);
        this.emit('');
        
        for (const stmt of node.body) {
            this.generateStatement(stmt);
        }
    }

    /**
     * Generate xtra function
     */
    generateXtraFunction(node) {
        const functionName = this.sanitizeFunctionName(node.name);
        
        this.emit(`${this.getIndent()}async ${functionName}(params = {}) {`);
        this.increaseIndent();
        this.emit(`${this.getIndent()}// XTRA function: ${node.name}`);
        
        // Generate non-event-handler statements directly in the function
        for (const stmt of node.body) {
            if (stmt.type !== 'EventHandler') {
                this.generateStatement(stmt);
            }
        }
        
        // For event handlers in XTRA functions, trigger the specific event for this function
        for (const stmt of node.body) {
            if (stmt.type === 'EventHandler') {
                const specificEvent = `${stmt.event}_${functionName}`;
                this.emit(`${this.getIndent()}await this.runtime.triggerEvent("${specificEvent}");`);
            }
        }
        
        this.decreaseIndent();
        this.emit(`${this.getIndent()}}`);
        this.emit('');
        
        // Generate event handlers as separate class methods with XTRA function context
        for (const stmt of node.body) {
            if (stmt.type === 'EventHandler') {
                // Store the specific event name for registration
                const specificEvent = `${stmt.event}_${functionName}`;
                stmt._specificEventName = specificEvent;
                this.generateEventHandler(stmt, functionName);
            }
        }
    }

    /**
     * Generate event handler
     */
    generateEventHandler(node, context = '') {
        const eventName = this.sanitizeEventName(node.event);
        const contextSuffix = context ? `_${context}` : '';
        
        this.emit(`${this.getIndent()}async handle_${eventName}${contextSuffix}(event) {`);
        this.increaseIndent();
        this.emit(`${this.getIndent()}// Event handler: ${node.event}${context ? ` (${context})` : ''}`);
        
        for (const stmt of node.body) {
            this.generateStatement(stmt);
        }
        
        this.decreaseIndent();
        this.emit(`${this.getIndent()}}`);
        this.emit('');
        
        // Register event handler in constructor
        this.emit(`${this.getIndent()}// Register event handler for ${node.event}`);
    }

    /**
     * Generate assignment
     */
    generateAssignment(node) {
        const target = this.generateFieldReference(node.target);
        const value = this.generateExpression(node.value);
        this.emit(`${this.getIndent()}${target} = ${value};`);
    }

    /**
     * Generate function call
     */
    generateFunctionCall(node) {
        const functionName = this.sanitizeFunctionName(node.name);
        const args = node.arguments.map(arg => this.generateExpression(arg)).join(', ');
        
        this.emit(`${this.getIndent()}await this.runtime.call("${node.name}", ${args});`);
    }

    /**
     * Generate expression
     */
    generateExpression(node) {
        switch (node.type) {
            case 'NumberLiteral':
                return node.value.toString();
            case 'StringLiteral':
                // Check if this string literal should be treated as a field reference
                if (this.fields.has(node.value)) {
                    return this.generateFieldReference(node.value);
                }
                return `"${this.escapeString(node.value)}"`;
            case 'FieldReference':
                return this.generateFieldReference(node.name);
            case 'Identifier':
                return this.sanitizeIdentifier(node.name);
            case 'BinaryExpression':
                return this.generateBinaryExpression(node);
            case 'UnaryExpression':
                return this.generateUnaryExpression(node);
            case 'ExportClause':
                return `{ exports: [${node.arguments.map(arg => this.generateExpression(arg)).join(', ')}] }`;
            case 'ImportClause':
                return `{ imports: [${node.arguments.map(arg => this.generateExpression(arg)).join(', ')}] }`;
            default:
                return `/* TODO: Generate ${node.type} */`;
        }
    }

    /**
     * Generate binary expression
     */
    generateBinaryExpression(node) {
        const left = this.generateExpression(node.left);
        const right = this.generateExpression(node.right);
        const operator = this.translateOperator(node.operator);
        
        return `(${left} ${operator} ${right})`;
    }

    /**
     * Generate unary expression
     */
    generateUnaryExpression(node) {
        const operand = this.generateExpression(node.operand);
        const operator = this.translateOperator(node.operator);
        
        return `${operator}${operand}`;
    }

    /**
     * Generate field initialization
     */
    generateFieldInitialization(field) {
        const fieldName = this.sanitizeIdentifier(field.name);
        let initialValue = 'null';
        let fieldType = 'any';
        
        if (field.properties) {
            if (field.properties['initial-value']) {
                initialValue = field.properties['initial-value'];
            }
            if (field.properties.storage) {
                fieldType = this.translateStorageType(field.properties.storage);
            }
        }
        
        this.emit(`${this.getIndent()}this.fields["${field.name}"] = ${initialValue}; // ${fieldType}`);
    }

    /**
     * Generate field reference
     */
    generateFieldReference(fieldName) {
        return `this.fields["${fieldName}"]`;
    }

    /**
     * Generate constant value
     */
    generateConstantValue(value) {
        // Try to parse as number
        if (/^\d+(\.\d+)?$/.test(value)) {
            return value;
        }
        
        // Try to parse as string
        if (value.startsWith('"') && value.endsWith('"')) {
            return value;
        }
        
        // Default to string
        return `"${this.escapeString(value)}"`;
    }

    /**
     * Translate Concept operators to JavaScript
     */
    translateOperator(operator) {
        const operatorMap = {
            '&&': '+', // String concatenation in Concept
            '&': '+',  // String concatenation in Concept
            '<>': '!==',
            '=': '===',
            'and': '&&',
            'or': '||',
            'not': '!'
        };
        
        return operatorMap[operator] || operator;
    }

    /**
     * Translate Concept storage types to JavaScript comments
     */
    translateStorageType(storage) {
        const typeMap = {
            'i1': 'number (int8)',
            'i2': 'number (int16)',
            'i4': 'number (int32)',
            'bit': 'boolean',
            'a': 'string'
        };
        
        // Handle a(n) format
        const alphaMatch = storage.match(/^a\((\d+)\)$/);
        if (alphaMatch) {
            return `string (max ${alphaMatch[1]} chars)`;
        }
        
        return typeMap[storage] || 'any';
    }

    /**
     * Sanitize function names for JavaScript
     */
    sanitizeFunctionName(name) {
        return name.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    /**
     * Sanitize event names for JavaScript
     */
    sanitizeEventName(eventName) {
        return eventName.replace(/[@\s\-+]/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    }

    /**
     * Sanitize identifiers for JavaScript
     */
    sanitizeIdentifier(name) {
        return name.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    /**
     * Escape string literals
     */
    escapeString(str) {
        return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    }

    /**
     * Emit a line of code
     */
    emit(line) {
        this.output.push(line);
    }

    /**
     * Get current indentation
     */
    getIndent() {
        return ' '.repeat(this.indent * this.options.indentSize);
    }

    /**
     * Generate if statement
     */
    generateIfStatement(node) {
        const condition = this.generateExpression(node.condition);
        this.emit(`${this.getIndent()}if (${condition}) {`);
        this.increaseIndent();
        
        for (const stmt of node.thenBody) {
            this.generateStatement(stmt);
        }
        
        this.decreaseIndent();
        
        if (node.elseBody && node.elseBody.length > 0) {
            this.emit(`${this.getIndent()}} else {`);
            this.increaseIndent();
            
            for (const stmt of node.elseBody) {
                this.generateStatement(stmt);
            }
            
            this.decreaseIndent();
        }
        
        this.emit(`${this.getIndent()}}`);
    }

    /**
     * Generate loop statement
     */
    generateLoopStatement(node) {
        if (node.loopVar && node.startValue && node.endValue) {
            // For-style loop
            const loopVar = this.generateFieldReference(node.loopVar);
            const startExpr = this.generateExpression(node.startValue);
            const endExpr = this.generateExpression(node.endValue);
            
            this.emit(`${this.getIndent()}for (${loopVar} = ${startExpr}; ${loopVar} <= ${endExpr}; ${loopVar}++) {`);
        } else if (node.condition) {
            // While-style loop
            const condition = this.generateExpression(node.condition);
            this.emit(`${this.getIndent()}while (${condition}) {`);
        }
        
        this.increaseIndent();
        
        for (const stmt of node.body) {
            this.generateStatement(stmt);
        }
        
        this.decreaseIndent();
        this.emit(`${this.getIndent()}}`);
    }

    /**
     * Increase indentation level
     */
    increaseIndent() {
        this.indent++;
    }

    /**
     * Decrease indentation level
     */
    decreaseIndent() {
        this.indent = Math.max(0, this.indent - 1);
    }
}