# Concept 4GL to JavaScript Transpiler# Concept 4GL to JavaScript Transpiler



A production-ready transpiler that converts Concept 4GL language files (.uni) to modern ES6 JavaScript.A production-ready transpiler that converts Concept 4GL language files (.uni) to modern ES6 JavaScript.



## What is this?## What is this?



This transpiler converts legacy Concept 4GL applications to JavaScript, enabling:This transpiler converts legacy Concept 4GL applications to JavaScript, enabling:

- Modernization of legacy codebases- Modernization of legacy codebases

- Integration with modern JavaScript tooling- Integration with modern JavaScript tooling

- Easier maintenance and extension of Concept applications- Easier maintenance and extension of Concept applications

- Deployment to modern runtime environments- Deployment to modern runtime environments



## Features## Features



- **Peggy PEG Parser** - Robust grammar-based parsing- **Peggy PEG Parser** - Robust grammar-based parsing

- **Complete Language Support** - Fields, events, control flow, functions, database operations- **Complete Language Support** - Fields, events, control flow, functions, database operations

- **ES6 Output** - Clean, readable JavaScript with classes and async/await- **ES6 Output** - Clean, readable JavaScript with classes and async/await

- **Runtime Library** - Full implementation of Concept language features- **Runtime Library** - Full implementation of Concept language features

- **100% Test Coverage** - All 13 example files pass- **100% Test Coverage** - All 13 example files pass



## Installation## Installation



```bash```bash

npm installnpm install

``````



## Build## Build



No build step required - the transpiler runs directly with Node.js.No build step required - the transpiler runs directly with Node.js.



To verify everything works:To verify everything works:



```bash```bash

npm testnpm test

``````



Expected output: `13/13 tests passing`Expected output: `13/13 tests passing`



## Usage## Usage



### Transpile a Single File### Transpile a Single File



```bash```bash

node cli.js transpile examples/calculator.uni -o output.jsnode cli.js transpile examples/calculator.uni -o output.js

``````



### Transpile a Directory### Transpile a Directory



```bash```bash

node cli.js transpile-dir examples -o transpilednode cli.js transpile-dir examples -o transpiled

``````



### Run Transpiled Code### Run Transpiled Code



```bash```bash

# First transpile# First transpile

node cli.js transpile examples/calculator.uni -o calculator.jsnode cli.js transpile examples/calculator.uni -o calculator.js



# Then run with Node.js# Then run with Node.js

node calculator.jsnode calculator.js

``````



Or use the test runner:Or use the test runner:



```bash```bash

node run-transpiled.js calculatornode run-transpiled.js calculator

``````



### Analyze AST### Analyze AST



View the Abstract Syntax Tree for a file:View the Abstract Syntax Tree for a file:



```bash```bash

node cli.js analyze examples/calculator.uni --astnode cli.js analyze examples/calculator.uni --ast

``````



## Project Structure## Project Structure



``````

transpiler/transpiler/

├── concept.peggy          # Peggy grammar (459 lines)├── concept.peggy          # Peggy grammar (459 lines)

├── peggy-transpiler.js    # Parser integration├── peggy-transpiler.js    # Parser integration

├── generator.js           # JavaScript code generator (708 lines)├── generator.js           # JavaScript code generator (708 lines)

├── concept-runtime.js     # Runtime library├── concept-runtime.js     # Runtime library

├── index.js               # Main transpiler class├── index.js               # Main transpiler class

├── cli.js                 # Command-line interface (404 lines)├── cli.js                 # Command-line interface (404 lines)

├── test-peggy.js          # Test suite (108 lines)├── test-peggy.js          # Test suite (108 lines)

├── run-transpiled.js      # Execution test utility├── run-transpiled.js      # Execution test utility

├── examples/              # 13 example .uni files├── examples/              # 13 example .uni files

└── docs/                  # Documentation└── docs/                  # Documentation

    └── CONCEPT_LANGUAGE.md    └── CONCEPT_LANGUAGE.md

``````



## Example## Example



**Input (calculator.uni):****Input (calculator.uni):**

```concept```concept

online="Calculator"online="Calculator"



field="num1" static() storage(i4) initial-value(0)field="num1" static() storage(i4) initial-value(0)

field="num2" static() storage(i4) initial-value(0)field="num2" static() storage(i4) initial-value(0)

field="result" static() storage(i4) initial-value(0)field="result" static() storage(i4) initial-value(0)



on @STARTon @START

  assign("num1" = 100)  assign("num1" = 100)

  assign("num2" = 25)  assign("num2" = 25)

  call('Add')  call('Add')

endonendon



xtra="Add"xtra="Add"

on @xtraon @xtra

  assign("result" = "num1" + "num2")  assign("result" = "num1" + "num2")

endonendon

``````



**Output (JavaScript):****Output (JavaScript):**

```javascript```javascript

import { ConceptRuntime } from "./concept-runtime.js";import { ConceptRuntime } from "./concept-runtime.js";



class ConceptApplication {class ConceptApplication {

  constructor() {  constructor() {

    this.runtime = new ConceptRuntime();    this.runtime = new ConceptRuntime();

    this.fields = {};    this.fields = {};

  }  }



  initializeFields() {  initializeFields() {

    this.fields["num1"] = 0;    this.fields["num1"] = 0;

    this.fields["num2"] = 0;    this.fields["num2"] = 0;

    this.fields["result"] = 0;    this.fields["result"] = 0;

  }  }



  async handle__START(event) {  async handle__START(event) {

    this.fields["num1"] = 100;    this.fields["num1"] = 100;

    this.fields["num2"] = 25;    this.fields["num2"] = 25;

    await this.runtime.call("Add");    await this.runtime.call("Add");

  }  }



  async Add(params = {}) {  async Add(params = {}) {

    this.fields["result"] = (this.fields["num1"] + this.fields["num2"]);    this.fields["result"] = (this.fields["num1"] + this.fields["num2"]);

  }  }



  async run() {  async run() {

    this.initializeFields();    this.initializeFields();

    this.runtime.registerEventHandler("@START", this.handle__START.bind(this));    this.runtime.registerEventHandler("@START", this.handle__START.bind(this));

    await this.runtime.triggerEvent("@START");    await this.runtime.triggerEvent("@START");

    return this;    return this;

  }  }



  static async create() {  static async create() {

    const app = new ConceptApplication();    const app = new ConceptApplication();

    return await app.run();    return await app.run();

  }  }

}}



export default ConceptApplication;export default ConceptApplication;

``````



## CLI Commands## CLI Commands



| Command | Description || Command | Description |

|---------|-------------||---------|-------------|

| `transpile <file>` | Transpile a single Concept file || `transpile <file>` | Transpile a single Concept file |

| `transpile-dir <dir>` | Transpile all .uni files in a directory || `transpile-dir <dir>` | Transpile all .uni files in a directory |

| `analyze <file>` | Show AST and analysis || `analyze <file>` | Show AST and analysis |

| `test` | Run all test files || `test` | Run all test files |

| `demo` | Interactive demo mode || `demo` | Interactive demo mode |

| `init <dir>` | Initialize a new Concept project || `init <dir>` | Initialize a new Concept project |



## Requirements## Requirements



- Node.js v14+ (tested with v22.19.0)- Node.js v14+ (tested with v22.19.0)

- ES6 module support- ES6 module support



## Documentation## Documentation



- [Concept Language Reference](docs/CONCEPT_LANGUAGE.md) - Complete language guide- [Concept Language Reference](docs/CONCEPT_LANGUAGE.md) - Complete language guide



## License## License



ISCISC


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