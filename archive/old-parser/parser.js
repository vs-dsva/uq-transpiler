// Concept Language Parser
// Converts tokens into an Abstract Syntax Tree (AST)

export class ConceptParser {
    constructor() {
        this.tokens = [];
        this.current = 0;
        this.filename = '';
    }

    /**
     * Parse tokens into an AST
     * @param {Token[]} tokens - Array of tokens from lexer
     * @returns {ASTNode} Root AST node
     */
    parse(tokens) {
        this.tokens = tokens;
        this.current = 0;
        this.filename = tokens[0]?.filename || 'unknown';
        
        return this.parseProgram();
    }

    /**
     * Parse the entire program
     * @returns {ProgramNode}
     */
    parseProgram() {
        const statements = [];
        
        while (!this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) {
                statements.push(stmt);
            }
        }
        
        return {
            type: 'Program',
            body: statements,
            filename: this.filename
        };
    }

    /**
     * Parse a single statement
     * @returns {ASTNode|null}
     */
    parseStatement() {
        this.skipNewlines();
        
        if (this.isAtEnd()) return null;
        
        const token = this.peek();
        
        switch (token.type) {
            case 'COMMENT':
                return this.parseComment();
            case 'CONSTANT':
                return this.parseConstant();
            case 'INCLUDE':
                return this.parseInclude();
            case 'KEYWORD':
                return this.parseKeywordStatement();
            case 'IDENTIFIER':
                return this.parseIdentifierStatement();
            default:
                this.advance(); // Skip unknown tokens
                return null;
        }
    }

    /**
     * Parse comment
     * @returns {CommentNode}
     */
    parseComment() {
        const token = this.advance();
        return {
            type: 'Comment',
            value: token.value,
            line: token.line,
            column: token.column
        };
    }

    /**
     * Parse constant declaration
     * @returns {ConstantNode}
     */
    parseConstant() {
        const token = this.advance();
        const match = token.value.match(/^\$constant\s+(\w+)\s+(.*)$/);
        
        if (!match) {
            throw new Error(`Invalid constant declaration at ${token.filename}:${token.line}`);
        }
        
        return {
            type: 'Constant',
            name: match[1],
            value: match[2].trim(),
            line: token.line,
            column: token.column
        };
    }

    /**
     * Parse include statement
     * @returns {IncludeNode}
     */
    parseInclude() {
        const token = this.advance();
        const match = token.value.match(/^\$include\s+(\w+)$/);
        
        if (!match) {
            throw new Error(`Invalid include statement at ${token.filename}:${token.line}`);
        }
        
        return {
            type: 'Include',
            filename: match[1],
            line: token.line,
            column: token.column
        };
    }

    /**
     * Parse keyword-based statements
     * @returns {ASTNode}
     */
    parseKeywordStatement() {
        const keyword = this.peek().value.toLowerCase();
        
        switch (keyword) {
            case 'online':
                return this.parseOnlineApplication();
            case 'xtra':
                return this.parseXtraFunction();
            case 'field':
                return this.parseFieldDeclaration();
            case 'table':
                return this.parseTableDeclaration();
            case 'stream':
                return this.parseStreamDeclaration();
            case 'form':
                return this.parseFormDeclaration();
            case 'element':
                return this.parseElementDeclaration();
            case 'on':
                return this.parseEventHandler();
            case 'if':
                return this.parseIfStatement();
            case 'loop':
                return this.parseLoopStatement();
            case 'assign':
                return this.parseAssignment();
            case 'call':
                return this.parseFunctionCall();
            case 'return':
                return this.parseReturnStatement();
            case 'find':
            case 'insert':
            case 'update':
            case 'delete':
                return this.parseDatabaseOperation();
            default:
                return this.parseGenericStatement();
        }
    }

    /**
     * Parse online application declaration
     * @returns {OnlineApplicationNode}
     */
    parseOnlineApplication() {
        this.advance(); // consume 'online'
        this.expect('OPERATOR', '=');
        const name = this.expectString();
        
        const statements = [];
        // Parse fields and event handlers until we hit top-level constructs
        while (!this.isAtEnd()) {
            // Skip newlines manually
            while (this.check('NEWLINE') && !this.isAtEnd()) {
                this.advance();
            }
            
            // Check for end conditions
            if (this.isAtEnd() || 
                this.check('KEYWORD', 'online') || 
                this.check('KEYWORD', 'xtra')) {
                break;
            }
            
            const token = this.peek();
            if (token.type === 'KEYWORD') {
                const keyword = token.value.toLowerCase();
                // Only parse field declarations and event handlers
                if (keyword === 'field') {
                    const stmt = this.parseFieldDeclaration();
                    if (stmt) statements.push(stmt);
                } else if (keyword === 'on') {
                    const stmt = this.parseEventHandler();
                    if (stmt) statements.push(stmt);
                } else {
                    // Unknown keyword in OnlineApplication context, stop
                    break;
                }
            } else {
                // Skip non-keyword tokens or parse them as needed
                this.advance();
            }
        }
        
        return {
            type: 'OnlineApplication',
            name: name,
            body: statements
        };
    }

    /**
     * Parse xtra function declaration
     * @returns {XtraFunctionNode}
     */
    parseXtraFunction() {
        this.advance(); // consume 'xtra'
        this.expect('OPERATOR', '=');
        const name = this.expectString();
        
        const statements = [];
        // Parse XTRA function body until we hit another top-level construct
        while (!this.isAtEnd()) {
            // Skip newlines manually
            while (this.check('NEWLINE') && !this.isAtEnd()) {
                this.advance();
            }
            
            // Check for end conditions (other top-level constructs)
            if (this.isAtEnd() || 
                this.check('KEYWORD', 'online') || 
                this.check('KEYWORD', 'xtra')) {
                break;
            }
            
            const token = this.peek();
            if (token.type === 'KEYWORD') {
                const keyword = token.value.toLowerCase();
                // Only parse event handlers and valid XTRA function statements
                if (keyword === 'on') {
                    const stmt = this.parseEventHandler();
                    if (stmt) statements.push(stmt);
                } else if (keyword === 'assign' || keyword === 'call' || keyword === 'if' || 
                          keyword === 'loop' || keyword === 'return' || keyword === 'find' ||
                          keyword === 'insert' || keyword === 'update' || keyword === 'delete') {
                    // Direct statements in XTRA function
                    const stmt = this.parseKeywordStatement();
                    if (stmt) statements.push(stmt);
                } else {
                    // Unknown keyword in XTRA function context, stop
                    break;
                }
            } else {
                // Skip non-keyword tokens or parse them as needed
                this.advance();
            }
        }
        
        return {
            type: 'XtraFunction',
            name: name,
            body: statements
        };
    }

    /**
     * Parse field declaration
     * @returns {FieldDeclarationNode}
     */
    parseFieldDeclaration() {
        this.advance(); // consume 'field'
        this.expect('OPERATOR', '=');
        const name = this.expectString();
        
        const properties = {};
        while (!this.isAtEnd() && !this.isNewline()) {
            if (this.check('KEYWORD')) {
                const propName = this.advance().value;
                if (this.check('LPAREN')) {
                    this.advance(); // consume '('
                    const propValue = [];
                    while (!this.check('RPAREN') && !this.isAtEnd()) {
                        propValue.push(this.advance().value);
                    }
                    if (this.check('RPAREN')) {
                        this.advance(); // consume ')'
                    }
                    properties[propName] = propValue.join(' ');
                } else {
                    properties[propName] = true;
                }
            } else {
                this.advance(); // skip unknown tokens
            }
        }
        
        return {
            type: 'FieldDeclaration',
            name: name,
            properties: properties
        };
    }

    /**
     * Parse event handler
     * @returns {EventHandlerNode}
     */
    parseEventHandler() {
        this.advance(); // consume 'on'
        const event = this.parseEventName();
        
        const statements = [];
        while (!this.isAtEnd() && !this.check('KEYWORD', 'endon')) {
            // Skip newlines manually and check for event end or top-level constructs
            while (this.check('NEWLINE') && !this.isAtEnd()) {
                this.advance();
            }
            
            // Check for endon or top-level keywords that should end the event handler
            if (this.check('KEYWORD', 'endon') || 
                this.check('KEYWORD', 'xtra') ||
                this.check('KEYWORD', 'online') ||
                this.isAtEnd()) {
                break;
            }
            
            // Parse valid event handler statements
            const token = this.peek();
            let stmt = null;
            
            if (token.type === 'KEYWORD') {
                const keyword = token.value.toLowerCase();
                // Only allow specific keywords inside event handlers
                if (keyword === 'assign' || keyword === 'call' || keyword === 'if' || 
                    keyword === 'loop' || keyword === 'return' || keyword === 'find' ||
                    keyword === 'insert' || keyword === 'update' || keyword === 'delete') {
                    stmt = this.parseKeywordStatement();
                } else {
                    // Unknown or top-level keyword, stop parsing
                    break;
                }
            } else {
                switch (token.type) {
                    case 'COMMENT':
                        stmt = this.parseComment();
                        break;
                    case 'CONSTANT':
                        stmt = this.parseConstant();
                        break;
                    case 'INCLUDE':
                        stmt = this.parseInclude();
                        break;
                    case 'IDENTIFIER':
                        stmt = this.parseIdentifierStatement();
                        break;
                    default:
                        this.advance(); // Skip unknown tokens
                        stmt = null;
                }
            }
            
            if (stmt) statements.push(stmt);
        }
        
        if (this.check('KEYWORD', 'endon')) {
            this.advance(); // consume 'endon'
        }
        
        return {
            type: 'EventHandler',
            event: event,
            body: statements
        };
    }

    /**
     * Parse assignment statement
     * @returns {AssignmentNode}
     */
    parseAssignment() {
        this.advance(); // consume 'assign'
        this.expect('LPAREN');
        
        const target = this.expectString();
        this.expect('OPERATOR', '=');
        const value = this.parseExpression();
        
        this.expect('RPAREN');
        
        return {
            type: 'Assignment',
            target: target,
            value: value
        };
    }

    /**
     * Parse function call
     * @returns {FunctionCallNode}
     */
    parseFunctionCall() {
        this.advance(); // consume 'call'
        this.expect('LPAREN');
        
        const name = this.expectString();
        const args = [];
        
        while (!this.check('RPAREN')) {
            if (this.check('COMMA')) {
                this.advance();
            }
            
            if (this.check('KEYWORD', 'export')) {
                args.push(this.parseExportClause());
            } else if (this.check('KEYWORD', 'import')) {
                args.push(this.parseImportClause());
            } else {
                args.push(this.parseExpression());
            }
        }
        
        this.expect('RPAREN');
        
        return {
            type: 'FunctionCall',
            name: name,
            arguments: args
        };
    }

    /**
     * Parse expression
     * @returns {ExpressionNode}
     */
    parseExpression() {
        return this.parseLogicalOr();
    }

    /**
     * Parse logical OR expression
     * @returns {ExpressionNode}
     */
    parseLogicalOr() {
        let expr = this.parseLogicalAnd();
        
        while (this.check('OPERATOR', 'or') || this.check('OPERATOR', '||')) {
            const operator = this.advance();
            const right = this.parseLogicalAnd();
            expr = {
                type: 'BinaryExpression',
                operator: operator.value,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }

    /**
     * Parse logical AND expression
     * @returns {ExpressionNode}
     */
    parseLogicalAnd() {
        let expr = this.parseEquality();
        
        while (this.check('OPERATOR', 'and') || this.check('OPERATOR', '&&')) {
            const operator = this.advance();
            const right = this.parseEquality();
            expr = {
                type: 'BinaryExpression',
                operator: operator.value,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }

    /**
     * Parse equality expression
     * @returns {ExpressionNode}
     */
    parseEquality() {
        let expr = this.parseComparison();
        
        while (this.match('OPERATOR', '=', '<>', '!=')) {
            const operator = this.previous();
            const right = this.parseComparison();
            expr = {
                type: 'BinaryExpression',
                operator: operator.value,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }

    /**
     * Parse comparison expression
     * @returns {ExpressionNode}
     */
    parseComparison() {
        let expr = this.parseAddition();
        
        while (this.match('OPERATOR', '>', '>=', '<', '<=')) {
            const operator = this.previous();
            const right = this.parseAddition();
            expr = {
                type: 'BinaryExpression',
                operator: operator.value,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }

    /**
     * Parse addition/subtraction expression
     * @returns {ExpressionNode}
     */
    parseAddition() {
        let expr = this.parseMultiplication();
        
        while (this.match('OPERATOR', '+', '-', '&&', '&')) {
            const operator = this.previous();
            const right = this.parseMultiplication();
            expr = {
                type: 'BinaryExpression',
                operator: operator.value,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }

    /**
     * Parse multiplication/division expression
     * @returns {ExpressionNode}
     */
    parseMultiplication() {
        let expr = this.parseUnary();
        
        while (this.match('OPERATOR', '*', '/', '%')) {
            const operator = this.previous();
            const right = this.parseUnary();
            expr = {
                type: 'BinaryExpression',
                operator: operator.value,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }

    /**
     * Parse unary expression
     * @returns {ExpressionNode}
     */
    parseUnary() {
        if (this.match('OPERATOR', 'not', '-', '+')) {
            const operator = this.previous();
            const expr = this.parseUnary();
            return {
                type: 'UnaryExpression',
                operator: operator.value,
                operand: expr
            };
        }
        
        return this.parsePrimary();
    }

    /**
     * Parse primary expression
     * @returns {ExpressionNode}
     */
    parsePrimary() {
        if (this.match('NUMBER')) {
            const token = this.previous();
            return {
                type: 'NumberLiteral',
                value: parseFloat(token.value)
            };
        }
        
        if (this.match('STRING')) {
            const token = this.previous();
            return {
                type: 'StringLiteral',
                value: token.value.slice(1, -1) // Remove quotes
            };
        }
        
        if (this.match('FIELD_NAME')) {
            const token = this.previous();
            return {
                type: 'FieldReference',
                name: token.value.slice(1, -1) // Remove quotes
            };
        }
        
        if (this.match('IDENTIFIER')) {
            const token = this.previous();
            return {
                type: 'Identifier',
                name: token.value
            };
        }
        
        if (this.match('LPAREN')) {
            const expr = this.parseExpression();
            this.expect('RPAREN');
            return expr;
        }
        
        throw new Error(`Unexpected token ${this.peek().value} at ${this.peek().filename}:${this.peek().line}`);
    }

    // Utility methods for token manipulation
    
    match(...types) {
        for (const type of types) {
            if (this.check('OPERATOR', type) || this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    
    check(type, value = null) {
        if (this.isAtEnd()) return false;
        const token = this.peek();
        return token.type === type && (value === null || token.value === value);
    }
    
    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }
    
    isAtEnd() {
        return this.current >= this.tokens.length || this.peek().type === 'EOF';
    }
    
    peek() {
        return this.tokens[this.current];
    }
    
    previous() {
        return this.tokens[this.current - 1];
    }
    
    expect(type, value = null) {
        if (this.check(type, value)) {
            return this.advance();
        }
        
        const expected = value ? `${type}(${value})` : type;
        const actual = this.peek();
        throw new Error(`Expected ${expected} but got ${actual.type}(${actual.value}) at ${actual.filename}:${actual.line}`);
    }
    
    expectString() {
        if (this.check('STRING')) {
            const token = this.advance();
            return token.value.slice(1, -1); // Remove quotes
        } else if (this.check('IDENTIFIER')) {
            const token = this.advance();
            return token.value;
        }
        
        throw new Error(`Expected string or identifier at ${this.peek().filename}:${this.peek().line}`);
    }
    
    skipNewlines() {
        while (this.check('NEWLINE')) {
            this.advance();
        }
    }
    
    isNewline() {
        return this.check('NEWLINE') || this.isAtEnd();
    }

    // Placeholder methods for complex parsing
    parseGenericStatement() {
        // Skip to next line for now
        while (!this.isNewline() && !this.isAtEnd()) {
            this.advance();
        }
        return null;
    }
    
    parseProperty() {
        // Simplified property parsing
        const name = this.advance();
        if (this.check('LPAREN')) {
            this.advance();
            const value = this.advance();
            this.expect('RPAREN');
            return { name: name.value, value: value.value };
        }
        return null;
    }
    
    parseEventName() {
        const parts = [];
        
        // Handle @ events
        if (this.check('EVENT')) {
            parts.push(this.advance().value);
        } else {
            // Handle other event names
            while (!this.isNewline() && !this.isAtEnd()) {
                parts.push(this.advance().value);
            }
        }
        
        return parts.join(' ');
    }
    
    parseExportClause() {
        this.advance(); // consume 'export'
        this.expect('LPAREN');
        const args = [];
        while (!this.check('RPAREN')) {
            if (this.check('COMMA')) this.advance();
            args.push(this.parseExpression());
        }
        this.expect('RPAREN');
        return { type: 'ExportClause', arguments: args };
    }
    
    parseImportClause() {
        this.advance(); // consume 'import'
        this.expect('LPAREN');
        const args = [];
        while (!this.check('RPAREN')) {
            if (this.check('COMMA')) this.advance();
            args.push(this.parseExpression());
        }
        this.expect('RPAREN');
        return { type: 'ImportClause', arguments: args };
    }

    // Stub methods for statements not yet implemented
    parseTableDeclaration() { return this.parseGenericStatement(); }
    parseStreamDeclaration() { return this.parseGenericStatement(); }
    parseFormDeclaration() { return this.parseGenericStatement(); }
    parseElementDeclaration() { return this.parseGenericStatement(); }
    parseIfStatement() {
        this.advance(); // consume 'if'
        this.expect('LPAREN');
        const condition = this.parseExpression();
        this.expect('RPAREN');
        
        const thenStatements = [];
        while (!this.isAtEnd() && 
               !this.check('KEYWORD', 'endif') && 
               !this.check('KEYWORD', 'else') &&
               !this.check('KEYWORD', 'elseif')) {
            this.skipNewlines();
            if (this.check('KEYWORD', 'endif') || this.check('KEYWORD', 'else') || this.check('KEYWORD', 'elseif')) break;
            const stmt = this.parseStatement();
            if (stmt) thenStatements.push(stmt);
        }
        
        let elseStatements = [];
        if (this.check('KEYWORD', 'else')) {
            this.advance(); // consume 'else'
            while (!this.isAtEnd() && !this.check('KEYWORD', 'endif')) {
                this.skipNewlines();
                if (this.check('KEYWORD', 'endif')) break;
                const stmt = this.parseStatement();
                if (stmt) elseStatements.push(stmt);
            }
        }
        
        if (this.check('KEYWORD', 'endif')) {
            this.advance(); // consume 'endif'
        }
        
        return {
            type: 'IfStatement',
            condition: condition,
            thenBody: thenStatements,
            elseBody: elseStatements
        };
    }

    parseLoopStatement() {
        this.advance(); // consume 'loop'
        this.expect('LPAREN');
        
        // Parse loop condition/iterator
        let loopVar = null;
        let startValue = null;
        let endValue = null;
        let condition = null;
        
        // Check if it's a for-style loop: (var = start to end)
        if (this.check('STRING')) {
            const currentPos = this.current;
            loopVar = this.expectString();
            
            if (this.check('OPERATOR', '=')) {
                // It's a for-style loop
                this.advance(); // consume '='
                startValue = this.parseExpression();
                
                if (this.check('KEYWORD', 'to')) {
                    this.advance(); // consume 'to'
                    endValue = this.parseExpression();
                }
            } else {
                // It's actually a while-style loop that starts with a field reference
                // Reset and parse as condition
                this.current = currentPos;
                condition = this.parseExpression();
            }
        } else {
            // While-style loop: (condition)
            condition = this.parseExpression();
        }
        
        this.expect('RPAREN');
        
        const statements = [];
        while (!this.isAtEnd() && !this.check('KEYWORD', 'endloop')) {
            this.skipNewlines();
            if (this.check('KEYWORD', 'endloop')) break;
            const stmt = this.parseStatement();
            if (stmt) statements.push(stmt);
        }
        
        if (this.check('KEYWORD', 'endloop')) {
            this.advance(); // consume 'endloop'
        }
        
        return {
            type: 'LoopStatement',
            loopVar: loopVar,
            startValue: startValue,
            endValue: endValue,
            condition: condition,
            body: statements
        };
    }
    parseReturnStatement() { return this.parseGenericStatement(); }
    parseDatabaseOperation() { return this.parseGenericStatement(); }
    parseIdentifierStatement() { return this.parseGenericStatement(); }
}