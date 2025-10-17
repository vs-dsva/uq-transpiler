// Concept Semantic Actions
// Converts Ohm parse nodes to AST matching the existing parser output

export function createSemantics(grammar) {
    const semantics = grammar.createSemantics();

    semantics.addOperation('toAST', {
        // Program
        Program(lines, _end) {
            const body = lines.children
                .map(line => line.toAST())
                .filter(s => s !== null && s !== undefined);
            
            return {
                type: 'Program',
                body: body,
                filename: 'unknown'
            };
        },
        
        Line_statement(stmt, _nl) {
            return stmt.toAST();
        },
        
        Line_blank(_blank, _nl) {
            return null;
        },
        
        BlankContent(_spaces) {
            return null;
        },

        // Declarations
        ConstantDecl(_dollar, name, value) {
            return {
                type: 'Constant',
                name: name.sourceString,
                value: value.sourceString.trim(),
                line: this.source.getLineAndColumnMessage().split(':')[0] || 1,
                column: 1
            };
        },

        IncludeDecl(_dollar, name) {
            return {
                type: 'Include',
                filename: name.sourceString,
                line: this.source.getLineAndColumnMessage().split(':')[0] || 1,
                column: 1
            };
        },

        OnlineDecl(_online, _eq, name, body) {
            return {
                type: 'OnlineApplication',
                name: name.toAST(),
                body: body.toAST()
            };
        },
        
        OnlineBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        OnlineItem(_nl, item) {
            return item.toAST();
        },

        XtraDecl(_xtra, _eq, name, body) {
            return {
                type: 'XtraFunction',
                name: name.toAST(),
                body: body.toAST()
            };
        },
        
        XtraBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        XtraItem(_nl, item) {
            return item.toAST();
        },

        XtraStatement(stmt) {
            return stmt.toAST();
        },

        // Field Declaration
        FieldDecl(_field, _eq, name, properties) {
            const props = {};
            properties.children.forEach(prop => {
                const p = prop.toAST();
                if (p) {
                    props[p.name] = p.value;
                }
            });
            return {
                type: 'FieldDeclaration',
                name: name.toAST(),
                properties: props
            };
        },

        FieldProperty(name, _lp, value, _rp) {
            const propName = name.sourceString;
            const propValue = value.sourceString.trim() || true;
            return {
                name: propName,
                value: propValue
            };
        },

        PropertyValue(_chars) {
            return this.sourceString;
        },

        // Table, Stream, Form, Element (basic support)
        TableDecl(_table, _eq, name, properties) {
            return {
                type: 'TableDeclaration',
                name: name.toAST(),
                properties: properties.children.map(p => p.sourceString)
            };
        },

        StreamDecl(_stream, _eq, name, properties) {
            return {
                type: 'StreamDeclaration',
                name: name.toAST(),
                properties: properties.children.map(p => p.sourceString)
            };
        },

        FormDecl(_form, _eq, name, properties) {
            return {
                type: 'FormDeclaration',
                name: name.toAST(),
                properties: properties.children.map(p => p.sourceString)
            };
        },

        ElementDecl(_element, _eq, name, properties) {
            return {
                type: 'ElementDeclaration',
                name: name.toAST(),
                properties: properties.children.map(p => p.sourceString)
            };
        },

        // Event Handler
        EventHandler(_on, eventName, body, _endon) {
            return {
                type: 'EventHandler',
                event: eventName.toAST(),
                body: body.toAST()
            };
        },
        
        EventBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        EventItem(_nl, item) {
            return item.toAST();
        },

        EventName_atEvent(_at, name) {
            return '@' + name.sourceString;
        },

        EventName_keyEvent(name) {
            return name.sourceString;
        },

        EventName_xtraEvent(_xtra) {
            return '@xtra';
        },

        EventStatement(stmt) {
            return stmt.toAST();
        },

        // Statements
        Assignment(_assign, _lp, target, _eq, value, _rp) {
            return {
                type: 'Assignment',
                target: target.toAST(),
                value: value.toAST()
            };
        },

        FunctionCall(_call, _lp, name, _comma, args, _rp) {
            return {
                type: 'FunctionCall',
                name: name.toAST(),
                arguments: args.children.map(a => a.toAST())
            };
        },

        CallArg(arg) {
            return arg.toAST();
        },

        ExportClause(_export, _lp, args, _rp) {
            return {
                type: 'ExportClause',
                arguments: args.children.length > 0 ? args.toAST() : []
            };
        },

        ImportClause(_import, _lp, args, _rp) {
            return {
                type: 'ImportClause',
                arguments: args.children.length > 0 ? args.toAST() : []
            };
        },

        // If Statement
        IfStatement(_if, _lp, condition, _rp, thenBody, elseIfParts, elsePart, _endif) {
            const ast = {
                type: 'IfStatement',
                condition: condition.toAST(),
                thenBody: thenBody.toAST(),
                elseBody: []
            };

            // Handle else part
            if (elsePart.children.length > 0) {
                ast.elseBody = elsePart.children[0].toAST();
            }

            // Note: elseif not fully implemented in original, keeping simple
            return ast;
        },
        
        ThenBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        ThenItem(_nl, item) {
            return item.toAST();
        },
        
        ElseIfPart(_elseif, _lp, condition, _rp, body) {
            return {
                condition: condition.toAST(),
                body: body.toAST()
            };
        },
        
        ElseIfBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        ElseIfItem(_nl, item) {
            return item.toAST();
        },

        ElsePart(_else, body) {
            return body.toAST();
        },
        
        ElseBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        ElseItem(_nl, item) {
            return item.toAST();
        },

        // Loop Statement
        LoopStatement(_loop, _lp, spec, _rp, body, _endloop) {
            const loopSpec = spec.toAST();
            return {
                type: 'LoopStatement',
                ...loopSpec,
                body: body.toAST()
            };
        },

        LoopSpec_forLoop(loopVar, _eq, start, _to, end) {
            return {
                loopVar: loopVar.toAST(),
                startValue: start.toAST(),
                endValue: end.toAST(),
                condition: null
            };
        },

        LoopSpec_whileLoop(condition) {
            return {
                loopVar: null,
                startValue: null,
                endValue: null,
                condition: condition.toAST()
            };
        },
        
        LoopBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        LoopItem(_nl, item) {
            return item.toAST();
        },

        // While Statement
        WhileStatement(_while, _lp, condition, _rp, body, _endwhile) {
            return {
                type: 'WhileStatement',
                condition: condition.toAST(),
                body: body.toAST()
            };
        },
        
        WhileBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        WhileItem(_nl, item) {
            return item.toAST();
        },

        // Case Statement
        CaseStatement(_case, _lp, expr, _rp, whenClauses, otherwiseClause, _endcase) {
            return {
                type: 'CaseStatement',
                expression: expr.toAST(),
                whenClauses: whenClauses.children.map(w => w.toAST()),
                otherwiseClause: otherwiseClause.children.length > 0 
                    ? otherwiseClause.children[0].toAST() 
                    : null
            };
        },

        WhenClause(_when, _lp, expr, _rp, body) {
            return {
                type: 'WhenClause',
                condition: expr.toAST(),
                body: body.toAST()
            };
        },
        
        WhenBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        WhenItem(_nl, item) {
            return item.toAST();
        },

        OtherwiseClause(_otherwise, body) {
            return body.toAST();
        },
        
        OtherwiseBody(items) {
            return items.children.map(i => i.toAST()).filter(i => i);
        },
        
        OtherwiseItem(_nl, item) {
            return item.toAST();
        },

        // Return Statement
        ReturnStatement(_return, valueOpt) {
            return {
                type: 'ReturnStatement',
                value: valueOpt.numChildren > 0 
                    ? valueOpt.child(0).toAST()
                    : null
            };
        },
        
        ReturnValue(_lp, expr, _rp) {
            return expr.toAST();
        },

        // Database Operations
        DatabaseOp(keyword, _lp, args, _rp) {
            return {
                type: 'DatabaseOperation',
                operation: keyword.sourceString,
                arguments: args.toAST()
            };
        },

        DbArgs(tableName, _comma, rest) {
            return [tableName.toAST(), ...rest.children.map(r => r.toAST())];
        },

        // Expressions
        Expression(expr) {
            return expr.toAST();
        },

        LogicalOrExpr(left, ops, rights) {
            if (ops.children.length === 0) return left.toAST();
            let result = left.toAST();
            for (let i = 0; i < ops.children.length; i++) {
                result = {
                    type: 'BinaryExpression',
                    operator: ops.children[i].sourceString,
                    left: result,
                    right: rights.children[i].toAST()
                };
            }
            return result;
        },

        LogicalAndExpr(left, ops, rights) {
            if (ops.children.length === 0) return left.toAST();
            let result = left.toAST();
            for (let i = 0; i < ops.children.length; i++) {
                result = {
                    type: 'BinaryExpression',
                    operator: ops.children[i].sourceString,
                    left: result,
                    right: rights.children[i].toAST()
                };
            }
            return result;
        },

        EqualityExpr(left, ops, rights) {
            if (ops.children.length === 0) return left.toAST();
            let result = left.toAST();
            for (let i = 0; i < ops.children.length; i++) {
                result = {
                    type: 'BinaryExpression',
                    operator: ops.children[i].sourceString,
                    left: result,
                    right: rights.children[i].toAST()
                };
            }
            return result;
        },

        ComparisonExpr(left, ops, rights) {
            if (ops.children.length === 0) return left.toAST();
            let result = left.toAST();
            for (let i = 0; i < ops.children.length; i++) {
                result = {
                    type: 'BinaryExpression',
                    operator: ops.children[i].sourceString,
                    left: result,
                    right: rights.children[i].toAST()
                };
            }
            return result;
        },

        AdditiveExpr(left, ops, rights) {
            if (ops.children.length === 0) return left.toAST();
            let result = left.toAST();
            for (let i = 0; i < ops.children.length; i++) {
                result = {
                    type: 'BinaryExpression',
                    operator: ops.children[i].sourceString,
                    left: result,
                    right: rights.children[i].toAST()
                };
            }
            return result;
        },

        MultiplicativeExpr(left, ops, rights) {
            if (ops.children.length === 0) return left.toAST();
            let result = left.toAST();
            for (let i = 0; i < ops.children.length; i++) {
                result = {
                    type: 'BinaryExpression',
                    operator: ops.children[i].sourceString,
                    left: result,
                    right: rights.children[i].toAST()
                };
            }
            return result;
        },

        UnaryExpr_unary(op, expr) {
            return {
                type: 'UnaryExpression',
                operator: op.sourceString,
                operand: expr.toAST()
            };
        },

        UnaryExpr_primary(expr) {
            return expr.toAST();
        },

        PrimaryExpr_number(num) {
            return num.toAST();
        },

        PrimaryExpr_string(str) {
            return str.toAST();
        },

        PrimaryExpr_field(field) {
            return {
                type: 'FieldReference',
                name: field.sourceString.slice(1, -1) // Remove quotes
            };
        },

        PrimaryExpr_identifier(ident) {
            return {
                type: 'Identifier',
                name: ident.sourceString
            };
        },

        PrimaryExpr_paren(_lp, expr, _rp) {
            return expr.toAST();
        },

        PrimaryExpr_function(func) {
            return func.toAST();
        },

        PrimaryExpr_status(status) {
            return status.toAST();
        },

        FunctionInvocation(name, _lp, args, _rp) {
            return {
                type: 'FunctionInvocation',
                name: name.sourceString,
                arguments: args.children.length > 0 ? args.toAST() : []
            };
        },

        StatusCall(_status, _lp, tableName, _rp) {
            return {
                type: 'StatusCall',
                tableName: tableName.toAST()
            };
        },

        ExpressionList(first, _comma, rest) {
            return [first.toAST(), ...rest.children.map(r => r.toAST())];
        },

        // Literals
        number_float(whole, _dot, frac) {
            return {
                type: 'NumberLiteral',
                value: parseFloat(this.sourceString)
            };
        },

        number_int(digits) {
            return {
                type: 'NumberLiteral',
                value: parseInt(this.sourceString, 10)
            };
        },

        stringLiteral(_lq, chars, _rq) {
            return {
                type: 'StringLiteral',
                value: chars.sourceString
            };
        },

        fieldReference(_lq, chars, _rq) {
            return {
                type: 'FieldReference',
                name: chars.sourceString
            };
        },

        identifier(start, rest) {
            return this.sourceString;
        },

        // Comments and whitespace
        Comment(_star, _chars) {
            return {
                type: 'Comment',
                value: this.sourceString,
                line: 1,
                column: 1
            };
        },

        // Default for nodes we don't need to transform
        _terminal() {
            return this.sourceString;
        },

        _iter(...children) {
            return children.map(c => c.toAST());
        }
    });

    return semantics;
}
