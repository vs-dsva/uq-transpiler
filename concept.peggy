// Peggy grammar for Concept language

{
  // Helper function to filter out null/undefined from arrays
  function filterNull(arr) {
    return arr.filter(x => x !== null && x !== undefined);
  }
}

// Entry point
Program
  = _ stmts:Statement* (_ nl)? _ { 
    return {
      type: 'Program',
      body: filterNull(stmts),
      filename: 'unknown'
    };
  }

// A statement is any top-level construct followed by newline(s) or empty line
Statement
  = stmt:(ConstantDecl / IncludeDecl / OnlineDecl / XtraDecl / FieldDecl / TableDecl / 
          StreamDecl / FormDecl / ElementDecl / EventHandler / Comment) _ { return stmt; }
  / _ nl { return null; }  // Empty line

// Constants
ConstantDecl
  = "$constant" __ name:Identifier __ value:Value {
    return {
      type: 'ConstantDeclaration',
      name: name,
      value: value
    };
  }

// Includes
IncludeDecl
  = "$include" __ name:Identifier {
    return {
      type: 'IncludeDeclaration',
      name: name
    };
  }

// Online application
OnlineDecl
  = "online" _ "=" _ name:StringLiteral ws body:OnlineBody {
    return {
      type: 'OnlineApplication',
      name: name,
      body: body
    };
  }

OnlineBody
  = items:(nl item:(FieldDecl / EventHandler) { return item; })* {
    return filterNull(items);
  }

// Xtra (subroutine)
XtraDecl
  = "xtra" _ "=" _ name:StringLiteral ws body:XtraBody {
    return {
      type: 'XtraDeclaration',
      name: name,
      body: body
    };
  }

XtraBody
  = items:(nl item:(FieldDecl / EventHandler) { return item; })* {
    return filterNull(items);
  }

// Field declaration
FieldDecl
  = "field" _ "=" _ name:StringLiteral __ props:PropertyList {
    return {
      type: 'FieldDeclaration',
      name: name,
      properties: props
    };
  }

PropertyList
  = props:Property* { return props; }

Property
  = name:Identifier _ "(" _ args:PropertyArgs? _ ")" _ {
    return { name: name, arguments: args || [] };
  }

PropertyArgs
  = first:PropertyArg rest:(_ "," _ arg:PropertyArg { return arg; })* {
    return [first, ...rest];
  }

PropertyArg
  = FunctionCall / Expression

// Table declaration
TableDecl
  = "table" _ "=" _ name:StringLiteral __ props:PropertyList {
    return {
      type: 'TableDeclaration',
      name: name,
      properties: props
    };
  }

// Stream declaration
StreamDecl
  = "stream" _ "=" _ name:StringLiteral __ props:PropertyList {
    return {
      type: 'StreamDeclaration',
      name: name,
      properties: props
    };
  }

// Form declaration
FormDecl
  = "form" _ "=" _ name:StringLiteral __ props:PropertyList {
    return {
      type: 'FormDeclaration',
      name: name,
      properties: props
    };
  }

// Element declaration
ElementDecl
  = "element" _ "=" _ name:StringLiteral __ props:PropertyList {
    return {
      type: 'ElementDeclaration',
      name: name,
      properties: props
    };
  }

// Event handlers
EventHandler
  = "on" __ event:EventName ws body:EventBody _ "endon" {
    return {
      type: 'EventHandler',
      event: event,
      body: body
    };
  }

EventName
  = "@" name:Identifier { return '@' + name; }
  / name:Identifier { return name; }
  / "@xtra" { return '@xtra'; }

EventBody
  = stmts:(nl stmt:EventStatement { return stmt; } / nl { return null; })* {
    return filterNull(stmts);
  }

EventStatement
  = Assignment / FunctionCall / IfStatement / LoopStatement / WhileStatement / 
    CaseStatement / ReturnStatement / DatabaseOp / Comment

// Assignment
Assignment
  = "assign" _ "(" _ target:StringLiteral _ "=" _ expr:Expression _ ")" {
    return {
      type: 'Assignment',
      target: target,
      value: expr
    };
  }

// Function call
FunctionCall
  = "call" _ "(" _ name:StringLiteral args:(_ "," _ arg:CallArg { return arg; })* _ ")" {
    return {
      type: 'FunctionCall',
      name: name,
      arguments: args
    };
  }

CallArg
  = ExportClause / ImportClause / Expression

ExportClause
  = "export" _ "(" _ exprs:ExpressionList? _ ")" {
    return { type: 'ExportClause', expressions: exprs || [] };
  }

ImportClause
  = "import" _ "(" _ exprs:ExpressionList? _ ")" {
    return { type: 'ImportClause', expressions: exprs || [] };
  }

ExpressionList
  = first:Expression rest:(_ "," _ expr:Expression { return expr; })* {
    return [first, ...rest];
  }

// If statement
IfStatement
  = "if" _ "(" _ cond:Expression _ ")" ws 
    thenBody:(nl stmt:EventStatement { return stmt; } / nl { return null; })* _
    elseIfs:ElseIfPart*
    elsePart:ElsePart? _
    "endif" {
      return {
        type: 'IfStatement',
        condition: cond,
        thenBody: filterNull(thenBody),
        elseIfParts: elseIfs,
        elsePart: elsePart
      };
    }

ElseIfPart
  = "elseif" _ "(" _ cond:Expression _ ")" ws body:(nl stmt:EventStatement { return stmt; } / nl { return null; })* _ {
    return {
      condition: cond,
      body: filterNull(body)
    };
  }

ElsePart
  = "else" ws body:(nl stmt:EventStatement { return stmt; } / nl { return null; })* {
    return filterNull(body);
  }

// Loop statement
LoopStatement
  = "loop" _ "(" _ spec:LoopSpec _ ")" ws 
    body:(nl stmt:EventStatement { return stmt; } / nl { return null; })* _
    "endloop" {
      return {
        type: 'LoopStatement',
        ...spec,
        body: filterNull(body)
      };
    }

LoopSpec
  = variable:StringLiteral _ "=" _ start:Expression __ "to" __ end:Expression {
    return { variable: variable, startValue: start, endValue: end, condition: null };
  }
  / cond:Expression {
    return { variable: null, startValue: null, endValue: null, condition: cond };
  }

// While statement
WhileStatement
  = "while" _ "(" _ cond:Expression _ ")" ws
    body:(nl stmt:EventStatement { return stmt; } / nl { return null; })* _
    "endwhile" {
      return {
        type: 'WhileStatement',
        condition: cond,
        body: filterNull(body)
      };
    }

// Case statement
CaseStatement
  = "case" _ "(" _ expr:Expression _ ")" ws
    whens:WhenClause+ _
    otherwise:OtherwiseClause? _
    "endcase" {
      return {
        type: 'CaseStatement',
        expression: expr,
        whenClauses: whens,
        otherwiseClause: otherwise
      };
    }

WhenClause
  = "when" _ "(" _ cond:Expression _ ")" ws body:(nl stmt:EventStatement { return stmt; } / nl { return null; })* _ {
    return {
      type: 'WhenClause',
      condition: cond,
      body: filterNull(body)
    };
  }

OtherwiseClause
  = "otherwise" ws body:(nl stmt:EventStatement { return stmt; } / nl { return null; })* {
    return filterNull(body);
  }

// Return statement
ReturnStatement
  = "return" _ "(" _ expr:Expression _ ")" {
    return { type: 'ReturnStatement', value: expr };
  }
  / "return" {
    return { type: 'ReturnStatement', value: null };
  }

// Database operations
DatabaseOp
  = keyword:DbKeyword _ "(" _ args:DbArgs _ ")" {
    return {
      type: 'DatabaseOperation',
      operation: keyword,
      arguments: args
    };
  }

DbKeyword
  = "call-dbf" / "open" / "read" / "write" / "close" / "delete" / "rewrite"

DbArgs
  = first:DbArg rest:(_ "," _ arg:DbArg { return arg; })* {
    return [first, ...rest];
  }

DbArg
  = Expression

// Comments
Comment
  = "*" text:$([^\r\n]*) {
    return {
      type: 'Comment',
      text: text.trim(),
      line: location().start.line,
      column: location().start.column
    };
  }

// Expressions
Expression
  = LogicalOr

LogicalOr
  = left:LogicalAnd rest:(_ "or" __ right:LogicalAnd { return right; })* {
    return rest.reduce((acc, right) => ({
      type: 'BinaryExpression',
      operator: 'or',
      left: acc,
      right: right
    }), left);
  }

LogicalAnd
  = left:Comparison rest:(_ "and" __ right:Comparison { return right; })* {
    return rest.reduce((acc, right) => ({
      type: 'BinaryExpression',
      operator: 'and',
      left: acc,
      right: right
    }), left);
  }

Comparison
  = left:Additive __ 'in' __ '(' _ list:ExpressionList? _ ')' {
    return {
      type: 'MembershipExpression',
      value: left,
      list: list || []
    }; 
  }
  / left:Additive _ ':' _ right:Additive {
    return {
      type: 'RangeExpression',
      start: left,
      end: right
    };
  }
  / left:Additive _ op:CompOp _ right:Additive {
    return {
      type: 'BinaryExpression',
      operator: op,
      left: left,
      right: right
    };
  }
  / Additive

CompOp
  = ">=" / "<=" / ">" / "<" / "=" / "<>"

Additive
  = left:Multiplicative rest:(_ op:AddOp _ right:Multiplicative { return { op, right }; })* {
    return rest.reduce((acc, { op, right }) => ({
      type: 'BinaryExpression',
      operator: op,
      left: acc,
      right: right
    }), left);
  }

AddOp
  = "&&" / "&" / "+" / "-"

Multiplicative
  = left:Unary rest:(_ op:MulOp _ right:Unary { return { op, right }; })* {
    return rest.reduce((acc, { op, right }) => ({
      type: 'BinaryExpression',
      operator: op,
      left: acc,
      right: right
    }), left);
  }
  / SubstringInfix

// Infix substring with # operator: expr # start # end
SubstringInfix
  = source:Unary _ '#' _ start:Unary _ '#' _ end:Unary {
    return {
      type: 'SubstringExpression',
      source: source,
      start: start,
      end: end
    };
  }

MulOp
  = "*" / "/" / "%"

Unary
  = op:("not" / "-") __ expr:Unary {
    return {
      type: 'UnaryExpression',
      operator: op,
      operand: expr
    };
  }
  / op:"+" _ expr:Unary {
    return {
      type: 'UnaryExpression',
      operator: op,
      operand: expr
    };
  }
  / Power

// Power operator (right associative)
Power
  = left:SubstringPrimary _ "**" _ right:Power {
    return {
      type: 'BinaryExpression',
      operator: '**',
      left: left,
      right: right
    };
  }
  / SubstringPrimary

// Allow substring infix after primary before other binary ops
SubstringPrimary
  = base:Primary rest:( _ '#' _ start:Primary _ '#' _ end:Primary { return { start, end }; } )? {
    if (!rest) return base;
    return { type: 'SubstringExpression', source: base, start: rest.start, end: rest.end };
  }

Primary
  = "(" _ expr:Expression _ ")" { return expr; }
  / name:Identifier _ "(" _ args:ExpressionList? _ ")" {
      return {
        type: 'FunctionCall',
        name: name,
        arguments: args || []
      };
    }
  / ConstantReference
  / StringLiteral
  / NumberLiteral
  / Identifier

ConstantReference
  = "$" name:Identifier {
    return {
      type: 'ConstantReference',
      name: name
    };
  }

// Literals and identifiers
StringLiteral
  = "\"" chars:DoubleStringChar* "\"" { return chars.join(''); }
  / "'" chars:SingleStringChar* "'" { return chars.join(''); }

DoubleStringChar
  = "\\\"" { return '"'; }
  / "\\\\" { return '\\'; }
  / ![\"\r\n] char:. { return char; }

SingleStringChar
  = !['\r\n] char:. { return char; }

NumberLiteral
  = digits:$([0-9]+ ("." [0-9]+)?) {
    return parseFloat(digits);
  }

Identifier
  = !ReservedWord name:$([a-zA-Z_][a-zA-Z0-9_-]*) { return name; }

Value
  = StringLiteral / NumberLiteral

ReservedWord
  = ("if" / "else" / "endif" / "loop" / "endloop" / "while" / "endwhile" / 
     "case" / "when" / "otherwise" / "endcase" / "return" / "and" / "or" / "not" / 
     "in" / "on" / "endon" / "assign" / "call" / "substr" / "word") ![a-zA-Z0-9_]

// Whitespace
_ "whitespace"
  = [ \t\r\n]*

__ "required whitespace"
  = [ \t]+

ws "inline whitespace"
  = [ \t]*

nl "newline"
  = [ \t]* ("\r\n" / "\n" / "\r") [ \t]*
