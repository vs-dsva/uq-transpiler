# GitHub Copilot Instructions for Concept Transpiler

## Project Overview

This is a **Concept 4GL to JavaScript transpiler** that converts legacy Concept language files (.uni) to modern ES6 JavaScript modules.

**Status:** ✅ Production Ready - All components working at 100%

**Interface:**
- 🖥️ **CLI Version** - Full-featured, production-ready (13/13 tests passing)

---

## ⚠️ CRITICAL RULES

### Documentation Policy
- **ONLY create documentation when explicitly requested**
- **ONLY create what is specifically asked for - nothing more**
- Do NOT create READMEs, guides, summaries, or checklists unless the user directly asks
- Keep code comments minimal and focused on complex logic only
- Documentation bloat slows down the project - avoid it

### Web Development Policy
- **When asked to create web applications, ALWAYS use HTMX**
- HTMX reduces boilerplate and keeps HTML-centric architecture
- Avoid heavy JavaScript frameworks unless specifically requested
- Favor SPA (Single Page Application) approach when possible
- Example stack: HTML + HTMX + minimal vanilla JS + backend API

---

## Architecture

```
┌─────────────────┐
│  Concept File   │  .uni files (Concept 4GL source code)
│   (.uni)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Peggy Parser    │  concept.peggy (459 lines PEG grammar)
│ (concept.peggy) │  peggy-transpiler.js (integration)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      AST        │  Abstract Syntax Tree (JSON structure)
│  (JSON Tree)    │  Complete representation of source
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Generator     │  generator.js (converts AST to JS)
│  (generator.js) │  Handles all Concept constructs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JavaScript     │  ES6 modules with ConceptRuntime
│   (ES6 Module)  │  Ready to execute
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Execution     │  Node.js runtime
│  (Node.js)      │  All 11 test apps run successfully
└─────────────────┘
```

---

## Core Files & Responsibilities

### Parser Layer
- **`concept.peggy`** (459 lines) - PEG grammar defining Concept language syntax
  - Uses Peggy parser generator (PEG.js successor)
  - Inline semantic actions generate AST
  - Handles: constants, includes, fields, events, control flow, expressions
  - Critical whitespace rules: `_` (any), `ws` (inline only), `nl` (newline)

- **`peggy-transpiler.js`** (40 lines) - Parser integration module
  - `PeggyConceptParser` class loads and compiles grammar
  - Provides clean error formatting with line/column numbers

### Generator Layer
- **`generator.js`** (708 lines) - AST to JavaScript code generator
  - `JavaScriptGenerator` class converts AST nodes to JS code
  - Generates ES6 classes with ConceptRuntime integration
  - Handles all language constructs completely

### Runtime Layer
- **`concept-runtime.js`** - Runtime library for generated code
  - `ConceptRuntime` class provides event management, field management
  - Database operations abstraction, utility functions

### Main Entry Points
- **`index.js`** (122 lines) - Main `ConceptTranspiler` class
  - Uses `PeggyConceptParser` for parsing
  - Uses `JavaScriptGenerator` for code generation
  - Public API: `transpileFile()`, `transpile()`

- **`cli.js`** (404 lines) - Command-line interface
  - Commands: transpile, transpile-dir, analyze, test, demo, init
  - Uses `commander` for CLI parsing, `chalk` for colors

### Testing
- **`test-peggy.js`** (108 lines) - Comprehensive test suite
  - Tests 8 individual constructs
  - Tests all 11 example .uni files
  - Current results: 11/11 passing (100%)

- **`run-transpiled.js`** - Runtime execution test utility
  - Loads and executes transpiled JavaScript apps
  - Verifies end-to-end pipeline

---

## Concept Language Syntax

### Constants
```concept
$constant PI 3.14159
$constant APP_NAME "MyApp"
```

**AST:** `{ type: 'ConstantDeclaration', name: 'PI', value: 3.14159 }`

### Includes
```concept
$include AGlobal
$include UserModule
```

**AST:** `{ type: 'IncludeDeclaration', name: 'AGlobal' }`

### Online Applications
```concept
online="MyApplication"
```

**AST:** `{ type: 'OnlineApplication', name: 'MyApplication', body: [...] }`

### Field Declarations
```concept
field="employeeId" static() storage(i4) initial-value(0)
field="employeeName" static() storage(a(100)) initial-value("")
```

**AST:**
```json
{
  "type": "FieldDeclaration",
  "name": "employeeId",
  "properties": [
    { "name": "static", "arguments": [] },
    { "name": "storage", "arguments": ["i4"] },
    { "name": "initial-value", "arguments": [0] }
  ]
}
```

### Event Handlers
```concept
on @START
  assign("field1" = 100)
  call('MyFunction')
endon

on F12
  assign("helpMode" = "true")
endon
```

**AST:**
```json
{
  "type": "EventHandler",
  "event": "@START",
  "body": [...]
}
```

### Xtra Functions (Subroutines)
```concept
xtra="CalculateSalary"
on @xtra
  assign("total" = "base" + "bonus")
endon
```

**AST:**
```json
{
  "type": "XtraDeclaration",
  "name": "CalculateSalary",
  "body": [
    { "type": "EventHandler", "event": "@xtra", "body": [...] }
  ]
}
```

### Control Flow

#### If Statements
```concept
if ("grade" >= 70)
  assign("passed" = "true")
elseif ("grade" >= 60)
  assign("passed" = "maybe")
else
  assign("passed" = "false")
endif
```

**AST:**
```json
{
  "type": "IfStatement",
  "condition": { "type": "BinaryExpression", ... },
  "thenBody": [...],
  "elseIfParts": [...],
  "elsePart": [...]
}
```

#### Loop Statements
```concept
loop("i" = 1 to 10)
  assign("total" = "total" + "i")
endloop

loop ("count" < 100)
  assign("count" = "count" + 1)
endloop
```

**AST (for loop):**
```json
{
  "type": "LoopStatement",
  "variable": "i",
  "startValue": 1,
  "endValue": 10,
  "condition": null,
  "body": [...]
}
```

**AST (while loop):**
```json
{
  "type": "LoopStatement",
  "variable": null,
  "startValue": null,
  "endValue": null,
  "condition": { "type": "BinaryExpression", ... },
  "body": [...]
}
```

#### While Statements
```concept
while ("count" < 100)
  assign("count" = "count" + 1)
endwhile
```

**AST:**
```json
{
  "type": "WhileStatement",
  "condition": { "type": "BinaryExpression", ... },
  "body": [...]
}
```

#### Case Statements
```concept
case ("status")
when (1)
  assign("statusText" = "Active")
when (2)
  assign("statusText" = "Inactive")
otherwise
  assign("statusText" = "Unknown")
endcase
```

**AST:**
```json
{
  "type": "CaseStatement",
  "expression": "status",
  "whenClauses": [
    { "type": "WhenClause", "condition": 1, "body": [...] }
  ],
  "otherwiseClause": [...]
}
```

### Assignments
```concept
assign("field1" = 100)
assign("result" = "value1" + "value2")
```

**AST:**
```json
{
  "type": "Assignment",
  "target": "field1",
  "value": 100
}
```

### Function Calls
```concept
call('MyFunction')
call('ProcessData', export("result"))
```

**AST:**
```json
{
  "type": "FunctionCall",
  "name": "MyFunction",
  "arguments": []
}
```

### Expressions

#### Binary Expressions
```concept
"value1" + "value2"
"count" >= 100
"status" = $OK
```

**AST:**
```json
{
  "type": "BinaryExpression",
  "operator": "+",
  "left": "value1",
  "right": "value2"
}
```

**Operators:**
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `=`, `<>`, `<`, `>`, `<=`, `>=`
- Logical: `and`, `or`, `not`

#### Literals
- **Numbers:** `123`, `3.14159`
- **Strings:** `"Hello"`, `""`
- **Field References:** `"fieldName"` (in expressions, treated as field if field exists)

---

## Generated JavaScript Structure

### Example Input (calculator.uni)
```concept
$constant PI 3.14159
$constant TAX_RATE 0.15

online="Calculator"

field="number1" static() storage(i4) initial-value(0)
field="number2" static() storage(i4) initial-value(0)
field="result" static() storage(i4) initial-value(0)

on @START
  assign("number1" = 100)
  assign("number2" = 25)
  call('Calculate')
endon

xtra="Calculate"
on @xtra
  assign("result" = "number1" + "number2")
endon
```

### Generated Output
```javascript
"use strict";

import { ConceptRuntime } from "../concept-runtime.js";

class ConceptApplication {
  constructor() {
    this.runtime = new ConceptRuntime();
    this.runtime.setApplication(this);
    this.fields = {};
    this.constants = {};
    this.eventHandlers = {};

    // Initialize constants
    this.constants.PI = 3.14159;
    this.constants.TAX_RATE = 0.15;
  }

  initializeFields() {
    this.fields["number1"] = 0; // number (int32)
    this.fields["number2"] = 0; // number (int32)
    this.fields["result"] = 0; // number (int32)
  }

  setApplicationName(name) {
    this.applicationName = "Calculator";
  }

  async handle__START(event) {
    // Event handler: @START
    this.fields["number1"] = 100;
    this.fields["number2"] = 25;
    await this.runtime.call("Calculate");
  }

  async Calculate(params = {}) {
    // Xtra function: Calculate
    this.fields["result"] = (this.fields["number1"] + this.fields["number2"]);
  }

  async handle__xtra_Calculate(event) {
    // Event handler: @xtra (in Calculate)
    this.fields["result"] = (this.fields["number1"] + this.fields["number2"]);
  }

  async run() {
    this.initializeFields();
    // Register event handlers
    this.runtime.registerEventHandler("@START", this.handle__START.bind(this));
    this.runtime.registerEventHandler("@xtra", this.handle__xtra_Calculate.bind(this));
    await this.runtime.triggerEvent("@START");
    return this;
  }

  static async create() {
    const app = new ConceptApplication();
    return await app.run();
  }
}

export default ConceptApplication;
```

---

## Common Patterns & Idioms

### Parser (concept.peggy)

**Whitespace Handling (CRITICAL):**
```peggy
_ "whitespace"      = [ \t\r\n]*           // Any whitespace
__ "required"       = [ \t]+               // Required inline whitespace
ws "inline"         = [ \t]*               // Inline only (preserves newlines)
nl "newline"        = [ \t]* ("\r\n" / "\n" / "\r") [ \t]*
```

**Why this matters:** Use `ws` before statement bodies to preserve newlines for body parsing.

**Pattern:**
```peggy
// CORRECT - preserves newline for body
EventHandler = "on" __ event:EventName ws body:EventBody _ "endon"
                                        ^^
// WRONG - would consume newline
EventHandler = "on" __ event:EventName _ body:EventBody _ "endon"
                                       ^
```

**Blank Line Handling:**
```peggy
// Allow blank lines in bodies
EventBody = stmts:(nl stmt:EventStatement { return stmt; } / nl { return null; })* {
  return filterNull(stmts);
}
```

### Generator (generator.js)

**Expression Generation Pattern:**
```javascript
generateExpression(node) {
  // Handle primitives FIRST
  if (typeof node === 'number') return node.toString();
  if (typeof node === 'string') {
    if (this.fields.has(node)) {
      return this.generateFieldReference(node);
    }
    return `"${this.escapeString(node)}"`;
  }
  
  // Then handle AST nodes
  if (!node.type) return '/* Unknown */';
  
  switch (node.type) {
    case 'BinaryExpression':
      return this.generateBinaryExpression(node);
    // ... other cases
  }
}
```

**Function Call Without Trailing Comma:**
```javascript
generateFunctionCall(node) {
  const args = node.arguments && node.arguments.length > 0 
    ? node.arguments.map(arg => this.generateExpression(arg)).join(', ')
    : '';
  
  this.emit(`await this.runtime.call("${node.name}"${args ? ', ' + args : ''});`);
  //                                              ^^^^^^^^^^^^^^^^^^^^^^^^
  //                                              No trailing comma!
}
```

**Field Property Handling:**
```javascript
generateFieldInitialization(field) {
  // Properties is an ARRAY of {name, arguments} objects from Peggy
  if (field.properties && Array.isArray(field.properties)) {
    for (const prop of field.properties) {
      if (prop.name === 'initial-value' && prop.arguments?.length > 0) {
        initialValue = this.generateExpression(prop.arguments[0]);
      }
    }
  }
}
```

---

## Development Workflows

### Adding a New Language Feature

1. **Update Grammar (`concept.peggy`):**
   ```peggy
   NewStatement = "newkeyword" __ expr:Expression ws body:StatementBody _ "endnew" {
     return {
       type: 'NewStatement',
       expression: expr,
       body: body
     };
   }
   ```

2. **Update Statement List:**
   ```peggy
   EventStatement = Assignment / FunctionCall / IfStatement / NewStatement / ...
   ```

3. **Add Generator Method (`generator.js`):**
   ```javascript
   generateNewStatement(node) {
     const expr = this.generateExpression(node.expression);
     this.emit(`// New feature: ${expr}`);
     this.increaseIndent();
     for (const stmt of node.body) {
       this.generateStatement(stmt);
     }
     this.decreaseIndent();
   }
   ```

4. **Add to Statement Switch:**
   ```javascript
   case 'NewStatement':
     this.generateNewStatement(node);
     break;
   ```

5. **Add Test (`test-peggy.js`):**
   ```javascript
   const newTest = `newkeyword (condition)
     assign("result" = "value")
   endnew`;
   
   testConstruct('New statement', newTest);
   ```

### Testing Changes

```bash
# Run parser tests
npm test
# or
node test-peggy.js

# Transpile a file
node cli.js transpile examples/calculator.uni -o output.js

# Run transpiled code
node run-transpiled.js calculator

# Transpile all examples
node cli.js transpile-dir examples -o transpiled-output
```

### Debugging Parse Errors

When you get a parse error, the message includes line and column:
```
Parse error in example.uni:
Line 24, column 5:
Expected "endif" but "a" found.
```

**Common issues:**
1. **Missing newline preservation** - Use `ws` not `_` before bodies
2. **Blank lines breaking parsing** - Add `/ nl { return null; }` alternative
3. **Reserved words** - Don't use JavaScript keywords as rule parameter names

---

## Important Constraints & Gotchas

### Parser (Peggy)

1. **Whitespace is semantic** in Concept (line-oriented language)
   - Always use `ws` before statement bodies
   - Use `nl` to explicitly consume newlines
   - Use `_` for general whitespace

2. **Identifier pattern supports hyphens:**
   ```peggy
   Identifier = !ReservedWord [a-zA-Z_][a-zA-Z0-9_-]*
   ```
   This allows: `initial-value`, `storage-key`, etc.

3. **Reserved words must be excluded:**
   ```peggy
   ReservedWord = ("var" / "function" / "class") !IdentifierPart
   ```

4. **Blank lines need explicit handling:**
   ```peggy
   body:(nl stmt { return stmt; } / nl { return null; })*
   ```

### Generator

1. **Field references in expressions:**
   - String literals like `"fieldName"` should become `this.fields["fieldName"]`
   - Check if string is a field name before treating as literal

2. **Function call arguments:**
   - NEVER add trailing comma: `call("fn", )` ❌
   - Correct: `call("fn")` or `call("fn", arg1, arg2)` ✅

3. **XtraDeclaration functions:**
   - Generate as callable methods: `async Calculate(params = {})`
   - Extract @xtra event body into the method
   - Also generate event handler: `async handle__xtra_Calculate(event)`

4. **Constants initialization:**
   - Must be in constructor, not separate method
   - Use `this.constants.NAME = value;`

5. **Field properties are arrays:**
   ```javascript
   // NOT: field.properties['initial-value']
   // YES: field.properties.find(p => p.name === 'initial-value')
   // BETTER: Loop through array
   for (const prop of field.properties) {
     if (prop.name === 'initial-value') { ... }
   }
   ```

---

## File Organization

```
transpiler/
├── concept.peggy              # Grammar definition
├── peggy-transpiler.js        # Parser integration
├── generator.js               # Code generator
├── concept-runtime.js         # Runtime library
├── index.js                   # Main transpiler class
├── cli.js                     # Command-line interface
├── test-peggy.js              # Test suite
├── run-transpiled.js          # Execution test utility
├── package.json               # Dependencies: peggy, chalk, commander
├── README.md                  # User documentation
├── HOW_TO_RUN.md             # Usage guide
├── examples/                  # 11 test .uni files
│   ├── banking.uni
│   ├── calculator.uni
│   ├── employee-management.uni
│   ├── if-conditions.uni
│   ├── inventory.uni
│   ├── invoice-processing.uni
│   ├── loop-processing.uni
│   ├── order-processing.uni
│   ├── payroll-demo.uni
│   ├── simple-if-test.uni
│   └── student-grading.uni
├── transpiled-output/         # Generated JavaScript files
├── docs/                      # Technical documentation
│   ├── PEGGY_MIGRATION.md
│   ├── GENERATOR_FIXES.md
│   ├── TRANSPILATION_TEST_RESULTS.md
│   ├── RUNTIME_TEST_RESULTS.md
│   ├── CLEANUP_SUMMARY.md
│   └── PROJECT_STATUS.md
└── archive/                   # Deprecated implementations
    ├── ohm-attempt/          # Failed Ohm.js attempt
    └── old-parser/           # Hand-coded parser
```

---

## Performance Considerations

1. **Parser compilation is cached** - Peggy compiles grammar once at startup
2. **AST traversal is single-pass** in most cases
3. **Generator builds string array** then joins at end (efficient)
4. **No optimization passes** - generates straightforward JavaScript

---

## Error Handling

### Parser Errors
```javascript
try {
  const ast = parser.parse(source, filename);
} catch (error) {
  // error.location has { start: { line, column }, end: { line, column } }
  console.error(`Parse error at line ${error.location.start.line}`);
}
```

### Generator Errors
- Generator mostly doesn't throw - uses `/* TODO */` comments for unknown constructs
- This is intentional - allows partial transpilation

---

## Testing Strategy

### Parser Tests (test-peggy.js)
1. **Individual constructs** - Test each language feature in isolation
2. **Complete files** - Test all 11 example .uni files
3. **Success criteria** - AST generated without errors

### Generator Tests
1. **Transpile all examples** - Verify code generation
2. **Syntax validation** - Generated JS must parse (no syntax errors)
3. **Execution tests** - Run transpiled code and verify results

### Current Status
- ✅ Parser: 11/11 files (100%)
- ✅ Generator: 11/11 files (100%)
- ✅ Execution: 11/11 apps (100%)

---

## Dependencies

```json
{
  "dependencies": {
    "peggy": "^5.0.6",      // PEG parser generator
    "chalk": "^5.0.0",      // Terminal colors
    "commander": "^9.0.0"   // CLI framework
  }
}
```

**Note:** Removed `ohm-js` after migration to Peggy

---

## Migration History

1. **Original:** Hand-coded lexer + recursive descent parser
2. **Attempted:** Ohm.js migration (failed after 50+ iterations due to arity issues)
3. **Current:** Peggy parser (successful, 100% working)

See `docs/PEGGY_MIGRATION.md` for complete migration story.

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Run tests
npm test

# Transpile single file
node cli.js transpile examples/calculator.uni -o output.js

# Transpile directory
node cli.js transpile-dir examples -o output

# Run transpiled app
node run-transpiled.js calculator

# Analyze file (show AST)
node cli.js analyze examples/calculator.uni --ast
```

---

## Key Success Factors

✅ **Whitespace handling** - Use `ws` before bodies, not `_`  
✅ **Blank line support** - Alternative pattern with null return  
✅ **Primitive expressions** - Handle before checking node.type  
✅ **No trailing commas** - Conditional argument formatting  
✅ **Array-based properties** - Loop through, don't access by key  
✅ **XtraDeclaration** - Generate as callable methods  
✅ **Constants** - Initialize in constructor  
✅ **Comprehensive testing** - All 13 files must pass  
✅ **Web interface** - Demo version for quick testing

---

*This file serves as the authoritative guide for GitHub Copilot when working with this codebase.*
