// JavaScript Code Generator
// Converts Concept AST to JavaScript code

export class JavaScriptGenerator {
    constructor(options = {}) {
        this.options = {
            indentSize: 2,
            useStrict: true,
            generateComments: true,
            targetES6: true,
            runtimeModule: options.runtimeModule || null,
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
        
        // Calculate relative path to node runtime file (ignore leading '.' segment)
        let runtimePath = "./concept-node-runtime.js";
        if (outputPath) {
            const parts = outputPath.split(/[/\\]/);
            // Remove filename
            parts.pop();
            // Filter out empty and current dir markers
            const dirParts = parts.filter(p => p && p !== '.');
            const nestingLevel = dirParts.length;
            if (nestingLevel > 0) {
                runtimePath = '../'.repeat(nestingLevel) + 'concept-node-runtime.js';
            }
        }
        
    // Decide runtime module path (allow override via options.runtimeModule)
    const runtimeImportPath = this.options.runtimeModule || runtimePath;
    const namedImport = this.options.browserRuntime ? 'ConceptBrowserRuntime as ConceptRuntime' : 'ConceptNodeRuntime as ConceptRuntime';
    this.emit(`import { ${namedImport} } from "${runtimeImportPath}";`);
        this.emit('');
    }

    /**
     * Generate code for program node
     */
    generateProgram(node) {
        // First pass: collect constants, field declarations, event handlers, and xtra functions
        this.eventHandlers = [];
        this.xtraFunctions = [];
        
        for (const stmt of node.body) {
            if (stmt.type === 'ConstantDeclaration') {
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
            } else if (stmt.type === 'XtraDeclaration') {
                // Collect xtra functions
                this.xtraFunctions.push(stmt);
                // Collect fields and event handlers from XTRA function body
                for (const bodyStmt of stmt.body) {
                    if (bodyStmt.type === 'FieldDeclaration') {
                        this.fields.set(bodyStmt.name, bodyStmt);
                    } else if (bodyStmt.type === 'EventHandler') {
                        // Store context information
                        bodyStmt._xtraName = stmt.name;
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
        
        // Generate xtra functions as methods
        for (const xtraFunc of this.xtraFunctions) {
            this.generateXtraFunction(xtraFunc);
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
            const xtraSuffix = eventHandler._xtraName ? `_${this.sanitizeFunctionName(eventHandler._xtraName)}` : '';
            this.emit(`this.runtime.registerEventHandler("${eventHandler.event}", this.handle_${eventName}${xtraSuffix}.bind(this));`);
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
            case 'IncludeDeclaration':
                this.generateInclude(node);
                break;
            case 'OnlineApplication':
                this.generateOnlineApplication(node);
                break;
            case 'XtraDeclaration':
                // Handled separately in xtraFunctions array
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
            case 'WhileStatement':
                this.generateWhileStatement(node);
                break;
            case 'CaseStatement':
                this.generateCaseStatement(node);
                break;
            case 'FieldDeclaration':
                // Already handled in first pass
                break;
            case 'ConstantDeclaration':
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
            const comment = node.text.replace(/^\*\s*/, '');
            this.emit(`${this.getIndent()}// ${comment}`);
        }
    }

    /**
     * Generate include statement
     */
    generateInclude(node) {
        this.emit(`${this.getIndent()}// Include: ${node.name}`);
        this.emit(`${this.getIndent()}// TODO: Load ${node.name}.js`);
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
        this.emit(`${this.getIndent()}// Xtra function: ${node.name}`);
        
        // Generate event handlers in the xtra - they execute the body
        for (const stmt of node.body) {
            if (stmt.type === 'EventHandler' && stmt.event === '@xtra') {
                // Execute xtra body statements directly
                for (const bodyStmt of stmt.body) {
                    this.generateStatement(bodyStmt);
                }
            }
        }
        
        this.decreaseIndent();
        this.emit(`${this.getIndent()}}`);
        this.emit('');
        
        // Generate event handlers as separate methods if they exist
        for (const stmt of node.body) {
            if (stmt.type === 'EventHandler') {
                this.generateEventHandler(stmt, node.name);
            }
        }
    }

    /**
     * Generate event handler
     */
    generateEventHandler(node, xtraName = '') {
        const eventName = this.sanitizeEventName(node.event);
        const xtraSuffix = xtraName ? `_${this.sanitizeFunctionName(xtraName)}` : '';
        
        this.emit(`${this.getIndent()}async handle_${eventName}${xtraSuffix}(event) {`);
        this.increaseIndent();
        this.emit(`${this.getIndent()}// Event handler: ${node.event}${xtraName ? ` (in ${xtraName})` : ''}`);
        
        for (const stmt of node.body) {
            this.generateStatement(stmt);
        }
        
        this.decreaseIndent();
        this.emit(`${this.getIndent()}}`);
        this.emit('');
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
        const args = node.arguments && node.arguments.length > 0 
            ? node.arguments.map(arg => this.generateExpression(arg)).join(', ')
            : '';
        
        this.emit(`${this.getIndent()}await this.runtime.call("${node.name}"${args ? ', ' + args : ''});`);
    }

    /**
     * Generate expression
     */
    generateExpression(node) {
        // Handle primitive values
        if (typeof node === 'number') {
            return node.toString();
        }
        if (typeof node === 'string') {
            // Check if it's a field name
            if (this.fields.has(node)) {
                return this.generateFieldReference(node);
            }
            return `"${this.escapeString(node)}"`;
        }
        if (typeof node === 'boolean') {
            return node.toString();
        }
        if (node === null || node === undefined) {
            return 'null';
        }
        
        // Handle AST nodes
        if (!node.type) {
            return `/* Unknown: ${JSON.stringify(node)} */`;
        }
        
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
            case 'ConstantReference':
                return `this.constants.${node.name}`;
            case 'Identifier':
                return this.sanitizeIdentifier(node.name);
            case 'BinaryExpression':
                return this.generateBinaryExpression(node);
            case 'UnaryExpression':
                return this.generateUnaryExpression(node);
            case 'MembershipExpression':
                return this.generateMembershipExpression(node);
            case 'RangeExpression':
                return this.generateRangeExpression(node);
            case 'SubstringExpression':
                return this.generateSubstringExpression(node);
            case 'FunctionCall':
                // Handle function calls in expressions
                const args = node.arguments && node.arguments.length > 0
                    ? node.arguments.map(arg => this.generateExpression(arg)).join(', ')
                    : '';
                // Intrinsics SUBSTR and WORD map to runtime helpers
                if (node.name.toLowerCase() === 'substr') {
                    return `this.runtime.substr(${args})`;
                }
                if (node.name.toLowerCase() === 'word') {
                    return `this.runtime.word(${args})`;
                }
                return `this.${this.sanitizeFunctionName(node.name)}(${args})`;
            case 'ExportClause':
                return `{ exports: [${node.expressions.map(arg => this.generateExpression(arg)).join(', ')}] }`;
            case 'ImportClause':
                return `{ imports: [${node.expressions.map(arg => this.generateExpression(arg)).join(', ')}] }`;
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
     * Generate membership expression value IN (list)
     */
    generateMembershipExpression(node) {
        const valueExpr = this.generateExpression(node.value);
        const listExprs = node.list.map(item => this.generateExpression(item)).join(', ');
        return `([${listExprs}].includes(${valueExpr}))`;
    }

    /**
     * Generate range expression start : end (represented as object)
     */
    generateRangeExpression(node) {
        const start = this.generateExpression(node.start);
        const end = this.generateExpression(node.end);
        return `{ start: ${start}, end: ${end} }`;
    }

    /**
     * Generate substring expression from # infix operator
     */
    generateSubstringExpression(node) {
        const source = this.generateExpression(node.source);
        const start = this.generateExpression(node.start);
        const end = this.generateExpression(node.end);
        // Convert to runtime.substr(source, start, end-start+1)
        return `this.runtime.substr(${source}, ${start}, (${end} - (${start}) + 1))`;
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
        let initialValue = 'null';
        let fieldType = 'any';
        
        // Field properties is an array of {name, arguments} objects from Peggy
        if (field.properties && Array.isArray(field.properties)) {
            for (const prop of field.properties) {
                if (prop.name === 'initial-value' && prop.arguments && prop.arguments.length > 0) {
                    initialValue = this.generateExpression(prop.arguments[0]);
                }
                if (prop.name === 'storage' && prop.arguments && prop.arguments.length > 0) {
                    const storageType = prop.arguments[0];
                    if (typeof storageType === 'object' && storageType.type === 'FunctionCall') {
                        // Handle storage(a(100)) format
                        fieldType = this.translateStorageType(`${storageType.name}(${storageType.arguments.join(',')})`);
                    } else {
                        fieldType = this.translateStorageType(storageType);
                    }
                }
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
        if (str === undefined || str === null) {
            console.error('escapeString called with:', str);
            console.trace();
            throw new Error(`escapeString called with undefined/null value`);
        }
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
        
        // Handle elseif parts
        if (node.elseIfParts && node.elseIfParts.length > 0) {
            for (const elseIfPart of node.elseIfParts) {
                const elseIfCondition = this.generateExpression(elseIfPart.condition);
                this.emit(`${this.getIndent()}} else if (${elseIfCondition}) {`);
                this.increaseIndent();
                
                for (const stmt of elseIfPart.body) {
                    this.generateStatement(stmt);
                }
                
                this.decreaseIndent();
            }
        }
        
        // Handle else part
        if (node.elsePart && node.elsePart.length > 0) {
            this.emit(`${this.getIndent()}} else {`);
            this.increaseIndent();
            
            for (const stmt of node.elsePart) {
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
        if (node.variable && node.startValue !== null && node.endValue !== null) {
            // For-style loop with variable
            const loopVar = this.generateFieldReference(node.variable);
            const startExpr = this.generateExpression(node.startValue);
            const endExpr = this.generateExpression(node.endValue);
            
            this.emit(`${this.getIndent()}for (${loopVar} = ${startExpr}; ${loopVar} <= ${endExpr}; ${loopVar}++) {`);
        } else if (node.condition) {
            // While-style loop with condition
            const condition = this.generateExpression(node.condition);
            this.emit(`${this.getIndent()}while (${condition}) {`);
        } else {
            this.emit(`${this.getIndent()}// Unknown loop type`);
            this.emit(`${this.getIndent()}while (false) {`);
        }
        
        this.increaseIndent();
        
        for (const stmt of node.body) {
            this.generateStatement(stmt);
        }
        
        this.decreaseIndent();
        this.emit(`${this.getIndent()}}`);
    }

    /**
     * Generate while statement
     */
    generateWhileStatement(node) {
        const condition = this.generateExpression(node.condition);
        this.emit(`${this.getIndent()}while (${condition}) {`);
        this.increaseIndent();
        
        for (const stmt of node.body) {
            this.generateStatement(stmt);
        }
        
        this.decreaseIndent();
        this.emit(`${this.getIndent()}}`);
    }

    /**
     * Generate case statement
     */
    generateCaseStatement(node) {
        const expr = this.generateExpression(node.expression);
        this.emit(`${this.getIndent()}switch (${expr}) {`);
        this.increaseIndent();
        
        // Generate when clauses
        if (node.whenClauses) {
            for (const whenClause of node.whenClauses) {
                const caseValue = this.generateExpression(whenClause.condition);
                this.emit(`${this.getIndent()}case ${caseValue}:`);
                this.increaseIndent();
                
                for (const stmt of whenClause.body) {
                    this.generateStatement(stmt);
                }
                
                this.emit(`${this.getIndent()}break;`);
                this.decreaseIndent();
            }
        }
        
        // Generate otherwise clause
        if (node.otherwiseClause) {
            this.emit(`${this.getIndent()}default:`);
            this.increaseIndent();
            
            for (const stmt of node.otherwiseClause) {
                this.generateStatement(stmt);
            }
            
            this.decreaseIndent();
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