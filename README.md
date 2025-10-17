# Concept to JavaScript Transpiler

A powerful transpiler that converts Concept 4GL language files (.uni, .inc, .uci) to modern JavaScript code.

## Overview

This transpiler enables you to modernize legacy Concept 4GL applications by converting them to JavaScript, making them easier to maintain, extend, and deploy in modern environments.

## Features

- **Complete Language Support**: Handles Concept syntax including events, fields, tables, forms, and business logic
- **Modern JavaScript Output**: Generates clean, readable ES6+ JavaScript code
- **Runtime Library**: Includes a comprehensive runtime library for Concept language features
- **Source Maps**: Optional source map generation for debugging
- **CLI Interface**: Command-line tools for batch processing and automation
- **Project Scaffolding**: Initialize new projects with proper structure

## Installation

```bash
npm install
```

## Quick Start

### Transpile a Single File

```bash
node cli.js transpile myapp.uni -o myapp.js
```

### Transpile an Entire Directory

```bash
node cli.js transpile-dir ./hrm/basis/appl -o ./output
```

### Analyze a Concept File

```bash
node cli.js analyze myapp.uni --tokens --ast
```

### Run the Demo

```bash
node cli.js demo
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
├── index.js              # Main transpiler class
├── lexer.js               # Lexical analyzer
├── parser.js              # Syntax parser
├── generator.js           # JavaScript code generator
├── concept-runtime.js     # Runtime library
├── cli.js                 # Command line interface
├── test.js                # Test suite
├── package.json           # Node.js package configuration
└── README.md              # This file
```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

The test suite includes:
- Tokenization tests
- Parsing tests
- Code generation tests
- Real file transpilation tests

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