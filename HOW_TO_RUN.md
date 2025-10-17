# How to Transpile and Run Concept Code

This guide shows you exactly how to transpile Concept 4GL files to JavaScript and execute them.

## 🔄 Method 1: Transpile and Run Manually

### Step 1: Transpile the Concept File

```bash
# Transpile a single .uni file to JavaScript
node cli.js transpile sample-app.uni -o sample-app.js

# Or transpile with source maps for debugging
node cli.js transpile sample-app.uni -o sample-app.js --source-maps
```

### Step 2: Create a Runner Script

Create a file called `runner.js`:

```javascript
// runner.js
import ConceptApplication from './sample-app.js';

console.log('🚀 Running Concept Application...');

try {
    // Create and run the application
    const app = await ConceptApplication.create();
    
    console.log('✅ Application completed!');
    console.log('📊 Final state:', app.fields);
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
```

### Step 3: Run the Application

```bash
node runner.js
```

## 🚀 Method 2: One-Command Transpile and Run

Use the built-in `run` command for convenience:

```bash
# Transpile and run in one command
node cli.js run sample-app.uni

# Keep the generated JavaScript file for inspection
node cli.js run sample-app.uni --keep-js

# Run with debug output
node cli.js run sample-app.uni --debug
```

## 📝 Example: Complete Workflow

Let's walk through a complete example:

### 1. Create a Concept File

Save this as `employee.uni`:

```concept
$constant COMPANY_NAME "Acme Corp"
$constant TAX_RATE 0.25

online="EmployeeApp"

field="empId" static() storage(i4) initial-value(0)
field="empName" static() storage(a(50)) initial-value("")
field="grossSalary" static() storage(i4) initial-value(0)
field="netSalary" static() storage(i4) initial-value(0)

on @START
  assign("empId" = 1001)
  assign("empName" = "Alice Johnson")
  assign("grossSalary" = 80000)
  call('CalculateNetSalary')
  call('DisplayEmployee')
endon

xtra="CalculateNetSalary"
on @xtra
  assign("netSalary" = "grossSalary" * (1 - 0.25))
endon

xtra="DisplayEmployee"
on @xtra
  assign("@info" = "Employee " && "empName" && " earns $" && "netSalary" && " net")
endon
```

### 2. Transpile to JavaScript

```bash
node cli.js transpile employee.uni -o employee.js
```

This generates a JavaScript file like:

```javascript
// Generated from employee.uni
"use strict";

import { ConceptRuntime } from "./concept-runtime.js";

class ConceptApplication {
  constructor() {
    this.runtime = new ConceptRuntime();
    this.runtime.setApplication(this);
    this.fields = {};
    this.constants = {
      COMPANY_NAME: "Acme Corp",
      TAX_RATE: 0.25
    };
  }

  initializeFields() {
    this.fields["empId"] = 0;
    this.fields["empName"] = "";
    this.fields["grossSalary"] = 0;
    this.fields["netSalary"] = 0;
  }

  async handle_START(event) {
    this.fields["empId"] = 1001;
    this.fields["empName"] = "Alice Johnson";
    this.fields["grossSalary"] = 80000;
    await this.runtime.call("CalculateNetSalary");
    await this.runtime.call("DisplayEmployee");
  }

  async CalculateNetSalary(params = {}) {
    this.fields["netSalary"] = this.fields["grossSalary"] * (1 - 0.25);
  }

  async DisplayEmployee(params = {}) {
    this.fields["@info"] = `Employee ${this.fields["empName"]} earns $${this.fields["netSalary"]} net`;
  }

  async run() {
    this.initializeFields();
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

### 3. Run the Application

Option A - Use the run command:
```bash
node cli.js run employee.uni
```

Option B - Create a custom runner:
```javascript
// run-employee.js
import EmployeeApp from './employee.js';

const app = await EmployeeApp.create();
console.log('Employee processed:', app.fields);
```

```bash
node run-employee.js
```

## 🛠️ Development Workflow

### For Development and Testing

```bash
# 1. Analyze the Concept file first
node cli.js analyze myapp.uni --tokens

# 2. Transpile and keep the JS file for inspection
node cli.js run myapp.uni --keep-js --debug

# 3. If there are issues, transpile only and inspect
node cli.js transpile myapp.uni -o myapp.js
```

### For Production Deployment

```bash
# 1. Transpile without debug info
node cli.js transpile-dir ./src -o ./dist

# 2. Run specific applications
node cli.js run ./dist/main-app.js
```

## 📊 Understanding the Output

When you run a transpiled Concept application, you'll see:

1. **Initialization**: Fields are set to initial values
2. **Event Processing**: @START and other events are triggered
3. **Function Calls**: XTRA functions execute business logic
4. **Final State**: All field values after processing

Example output:
```
🚀 Running Concept Application...
🎯 Event: @START triggered
📝 Fields initialized:
   Employee ID: 1001
   Name: Alice Johnson
   Gross Salary: $80000
💰 Net salary calculated: $60000
✅ Application completed!
📊 Final state: {
  empId: 1001,
  empName: 'Alice Johnson',
  grossSalary: 80000,
  netSalary: 60000,
  '@info': 'Employee Alice Johnson earns $60000 net'
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**: Make sure `concept-runtime.js` is in the same directory
2. **Syntax Errors**: Check the original Concept file for multiline statements
3. **Runtime Errors**: Use `--debug` flag to see detailed error information

### Debug Commands

```bash
# Analyze token structure
node cli.js analyze problematic.uni --tokens

# See the generated AST
node cli.js analyze problematic.uni --ast

# Run with full debug output
node cli.js run problematic.uni --debug --keep-js
```

## 🎯 Next Steps

- Transpile real files from your repository: `node cli.js run ../hrm/basis/appl/someFile.uni`
- Create custom runtime extensions for database operations
- Build web interfaces that use the transpiled JavaScript
- Integrate with Node.js servers and modern frameworks

The transpiler successfully converts Concept business logic to maintainable JavaScript while preserving all the original functionality!