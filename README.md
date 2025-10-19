# Concept 4GL → JavaScript Transpiler (Experimental)

This is an exploratory / toy transpiler that converts a subset of Concept 4GL (`.uni`) source to ES6 JavaScript. It is NOT production‑ready; internal constructs, error handling, and runtime behaviors may change at any time.

Goals (informal):
- Prototype automated migration paths from legacy Concept code.
- Experiment with PEG grammar (Peggy) for a 4GL style language.
- Provide a small runnable JS output to inspect fields, constants and event flow.

Non‑Goals (for now):
- Perfect semantic fidelity.
- Performance optimization.
- Comprehensive runtime (DB, UI, etc.).

Use this project for learning / experimentation only.

## Current Feature Set (Partial)
- Peggy grammar for: constants, includes, online app declaration, fields, events, if / elseif / else, loops (loop / while), case statements, assignments, function calls, simple expressions (arithmetic, comparison, logical), range (`a : b`), membership (`x in (...)`), concatenation (`&&`, `&`), unary `+`/`-`, power `**`, substring infix `expr # start # end`.
- Xtra subroutines exposed as async methods.
- Basic runtime class with event registration and field storage.
- CLI with commands: transpile, transpile-dir, run, analyze, demo, init, test.
- Browser demo page (textarea + run button) using Vite.

Things missing or unstable:
- Advanced database operations semantics.
- UI/layout semantics beyond basic demo dialogs.
- Robust error recovery / messages (parser stops on first error).
- Comprehensive intrinsic functions beyond implemented subset.

Expect breaking changes.



## Installation



```bash
npm install
```



## Build / Run

No special build step for CLI usage. Browser demo uses Vite.



To verify everything works:To verify everything works:



```bash
npm test
```



Tests are illustrative, not exhaustive; passing them does not imply completeness.



## Usage



### Transpile a Single File### Transpile a Single File



```bash
node cli.js transpile examples/calculator.uni -o output.js
```



### Transpile a Directory### Transpile a Directory



```bash
node cli.js transpile-dir examples -o transpiled
```



### Run Transpiled Code### Run Transpiled Code



```bash
# First transpile
node cli.js transpile examples/calculator.uni -o calculator.js

# Then run
node calculator.js
```



Or use the test runner:Or use the test runner:



```bash
node run-transpiled.js calculator
```



### Analyze AST### Analyze AST



View the Abstract Syntax Tree for a file:View the Abstract Syntax Tree for a file:



```bash
node cli.js analyze examples/calculator.uni --ast
```



## Project Structure (abbreviated)



```
concept.peggy          # Peggy grammar
generator.js           # JS code emitter
concept-runtime.js     # Minimal runtime
concept-node-runtime.js# Node runtime wrapper
concept-web-runtime.js # Browser runtime variant
cli.js                 # CLI commands
index.js               # Transpiler API
examples/              # Example .uni inputs
docs/                  # Reference & notes
vite.config.js         # Browser demo build
index.html             # Browser demo page
```



## Example



**Input (calculator.uni):****Input (calculator.uni):**

```concept
online="Calculator"

field="num1" static() storage(i4) initial-value(0)
field="num2" static() storage(i4) initial-value(0)
field="result" static() storage(i4) initial-value(0)

on @START
  assign("num1" = 100)
  assign("num2" = 25)
  call('Add')
endon

xtra="Add"
on @xtra
  assign("result" = "num1" + "num2")
endon
```



**Output (JavaScript):****Output (JavaScript):**

```javascript
import { ConceptRuntime } from "./concept-runtime.js";
class ConceptApplication {
  constructor() {
    this.runtime = new ConceptRuntime();
    this.fields = {};
  }
  initializeFields() {
    this.fields["num1"] = 0;
    this.fields["num2"] = 0;
    this.fields["result"] = 0;
  }
  async handle__START(event) {
    this.fields["num1"] = 100;
    this.fields["num2"] = 25;
    await this.runtime.call("Add");
  }
  async Add(params = {}) {
    this.fields["result"] = (this.fields["num1"] + this.fields["num2"]);
  }
  async run() {
    this.initializeFields();
    this.runtime.registerEventHandler("@START", this.handle__START.bind(this));
    await this.runtime.triggerEvent("@START");
    return this;
  }
  static async create() { const app = new ConceptApplication(); return await app.run(); }
}
export default ConceptApplication;
```



## CLI Commands



| Command | Description || Command | Description |

|---------|-------------||---------|-------------|

| `transpile <file>` | Transpile a single Concept file || `transpile <file>` | Transpile a single Concept file |

| `transpile-dir <dir>` | Transpile all .uni files in a directory || `transpile-dir <dir>` | Transpile all .uni files in a directory |

| `analyze <file>` | Show AST and analysis || `analyze <file>` | Show AST and analysis |

| `test` | Run all test files || `test` | Run all test files |

| `demo` | Simple demo (experimental) |

| `init <dir>` | Initialize a new Concept project || `init <dir>` | Initialize a new Concept project |



## Requirements



Node.js v14+ (tested quickly with a recent v22 build). Earlier versions may work; not guaranteed.

- ES6 module support- ES6 module support



## Documentation



See `docs/CONCEPT_LANGUAGE.md` for the evolving language reference (not authoritative).



## License



ISC


#### Transpile a Single File

```bash
node cli.js transpile examples/banking.uni -o output.js
```

#### Run Tests

```bash
npm test
```

#### Transpile All Examples

```bash
node cli.js transpile-dir examples -o output
```

## Concept Language Features Supported

### Constants and Includes
```concept
$constant APPLICATION_NAME "HRM System"
$include AGlobal
```

### Field Declarations
```concept
field="employeeId" static() storage(i4) initial-value(0)
field="employeeName" static() storage(a(100))
```

### Event Handlers
```concept
on @START
  assign("employeeId" = 1001)
  assign("employeeName" = "John Doe")
endon

on F12
  call('ShowHelp')
endon
```

### Applications and Functions
```concept
online="HRMApplication"

xtra="CalculateSalary"
  import("baseAmount", "bonusPercent")
  export("totalSalary")
```

### Control Structures
```concept
if ("employeeId" > 0)
  call('ProcessEmployee')
endif

loop("i", 1, 10)
  assign("result" = "result" + "i")
endloop
```

### Database Operations
```concept
find("EMPLOYEE")
if (status("EMPLOYEE") = $OK)
  assign("employeeName" = "EMPLOYEE.NAME")
endif
```

## Generated JavaScript Structure

The transpiler generates JavaScript classes that extend the Concept runtime:

```javascript
class ConceptApplication {
  constructor() {
    this.runtime = new ConceptRuntime();
    this.fields = {};
    this.constants = {};
  }
  
  async handle_START(event) {
    // Converted Concept code
  }
  
  async run() {
    this.initializeFields();
    await this.runtime.triggerEvent("@START");
  }
}
```

## Runtime Library

The Concept Runtime Library provides:

- **Event Management**: Handle Concept events in JavaScript
- **Field Management**: Type-safe field access and manipulation
- **Database Operations**: Abstracted database access
- **UI Components**: Form and element management
- **Utility Functions**: String operations, date formatting, etc.

## Command Line Interface

### Commands

- `transpile <file>` - Transpile a single Concept file
- `transpile-dir <dir>` - Transpile all files in a directory
- `analyze <file>` - Analyze and show file structure
- `test` - Run the test suite
- `demo` - Run a demonstration
- `init [name]` - Initialize a new project

### Options

- `-o, --output <path>` - Specify output file/directory
- `-s, --source-maps` - Generate source maps
- `--no-comments` - Exclude comments from output
- `--tokens` - Show tokenization output (analyze command)
- `--ast` - Show AST output (analyze command)

## Project Structure

```
transpiler/
├── concept.peggy          # Peggy grammar definition (459 lines)
├── peggy-transpiler.js    # Parser integration module
├── index.js               # Main transpiler class
├── generator.js           # JavaScript code generator
├── concept-runtime.js     # Runtime library
├── cli.js                 # Command line interface
├── test-peggy.js          # Comprehensive test suite
├── examples/              # 11 example .uni files
├── transpiled-output/     # Generated JavaScript files
├── archive/               # Deprecated code (old parser, Ohm.js attempt)
├── package.json           # Node.js package configuration
├── PEGGY_MIGRATION.md     # Migration documentation
└── README.md              # This file
```

## Architecture

The transpiler uses a **grammar-based architecture** with Peggy:

1. **Parser** (`concept.peggy` + `peggy-transpiler.js`)
   - PEG grammar defines Concept language syntax
   - Inline semantic actions generate AST
   - Handles newlines, blank lines, nested structures

2. **Generator** (`generator.js`)
   - Converts AST to JavaScript
   - Generates ES6 modules with ConceptRuntime integration
   
3. **Runtime** (`concept-runtime.js`)
   - Event management
   - Field management
   - Database operations abstraction

## Testing

Run the comprehensive test suite:

```bash
npm test
```

**Results:** 11/11 files passing (100% success rate)

Test suite includes:
- Individual construct tests (constants, fields, events, control flow)
- Full file transpilation tests (all 11 example files)
- AST structure validation
- Error reporting tests

## Examples

### Basic Concept Application

**Input (concept.uni):**
```concept
$constant APP_NAME "Employee Manager"

online="EmployeeApp"

field="employeeId" static() storage(i4)
field="employeeName" static() storage(a(100))

on @START
  assign("employeeId" = 1001)
  assign("employeeName" = "John Doe")
  call('DisplayEmployee')
endon

xtra="DisplayEmployee"
on @xtra
  assign("@message" = "Employee: " && "employeeName" && " (ID: " && "employeeId" && ")")
endon
```

**Generated JavaScript:**
```javascript
"use strict";

import { ConceptRuntime } from "./concept-runtime.js";

class ConceptApplication {
  constructor() {
    this.runtime = new ConceptRuntime();
    this.fields = {};
    this.constants = {};
    this.eventHandlers = {};
  }

  // Constants
  this.constants.APP_NAME = "Employee Manager";

  initializeFields() {
    this.fields["employeeId"] = null; // number (int32)
    this.fields["employeeName"] = null; // string (max 100 chars)
  }

  async handle_START(event) {
    // Event handler: @START
    this.fields["employeeId"] = 1001;
    this.fields["employeeName"] = "John Doe";
    await this.runtime.call("DisplayEmployee");
  }

  async DisplayEmployee(params = {}) {
    // XTRA function: DisplayEmployee
    this.fields["@message"] = (this.fields["employeeName"] + " (ID: " + this.fields["employeeId"] + ")");
  }

  async run() {
    this.initializeFields();
    await this.runtime.triggerEvent("@START");
  }
}

export default ConceptApplication;
```

## Development

### Architecture

1. **Lexer** - Tokenizes Concept source code
2. **Parser** - Builds Abstract Syntax Tree (AST)
3. **Generator** - Converts AST to JavaScript
4. **Runtime** - Provides Concept language features in JavaScript

### Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] Enhanced UI component transpilation
- [ ] Database connection adapters
- [ ] Advanced debugging support
- [ ] TypeScript output option
- [ ] Performance optimizations
- [ ] Visual Studio Code extension
- [ ] Documentation generator

## Support

For questions and support, please refer to the documentation or create an issue in the repository.