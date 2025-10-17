# Concept Language Examples

This directory contains various examples demonstrating different features of the Concept-to-JavaScript transpiler.

## 🚀 Running Examples

To run any example, use the CLI from the parent directory:

```bash
# Run a specific example
node cli.js run examples/calculator.uni
node cli.js run examples/payroll-demo.uni
node cli.js run examples/student-grading.uni

# Or transpile to JavaScript
node cli.js transpile examples/banking.uni
```

## 📁 Available Examples

### 1. **calculator.uni** - Basic Math Operations
- **Features**: Constants, basic arithmetic, XTRA functions
- **Business Logic**: Simple addition calculator
- **Demonstrates**: Field assignments, function calls

### 2. **employee-management.uni** - HR System
- **Features**: Employee data, salary calculations, eligibility checks
- **Business Logic**: Employee bonus calculation system
- **Demonstrates**: Multiple XTRA functions, conditional logic

### 3. **invoice-processing.uni** - Billing System
- **Features**: VAT calculations, invoice finalization
- **Business Logic**: Complete invoice processing workflow
- **Demonstrates**: Tax calculations, status management

### 4. **banking.uni** - Financial Services
- **Features**: Account management, interest calculations
- **Business Logic**: Bank account interest processing
- **Demonstrates**: Financial calculations, account updates

### 5. **inventory.uni** - Warehouse Management
- **Features**: Stock tracking, pricing, reorder alerts
- **Business Logic**: Inventory value and pricing calculations
- **Demonstrates**: Markup calculations, inventory checks

### 6. **student-grading.uni** - Education System
- **Features**: Grade calculations, pass/fail determination
- **Business Logic**: Student exam grade processing
- **Demonstrates**: Average calculations, conditional evaluation

### 7. **order-processing.uni** - E-commerce System
- **Features**: Order totals, discounts, shipping
- **Business Logic**: Complete order calculation workflow
- **Demonstrates**: Multi-step calculations, discount application

### 8. **if-conditions.uni** - Conditional Logic Demo
- **Features**: If statements, nested conditions, comparison operators
- **Business Logic**: Order validation and discount calculation based on conditions
- **Demonstrates**: `if`, `endif`, comparison operators (`>=`, `=`, `<=`, `>`, `<`)

### 9. **loop-processing.uni** - Loop Constructs Demo
- **Features**: For-style and while-style loops
- **Business Logic**: Salary budget calculation with iterative processing
- **Demonstrates**: `loop` with `to` keyword, while-style loops with conditions

### 10. **simple-if-test.uni** - Basic If Statement Test
- **Features**: Simple conditional logic testing
- **Business Logic**: Grade processing with pass/fail logic
- **Demonstrates**: Basic if statements, comparison operators, counting logic

## 🎯 Example Structure

Each example follows the standard Concept language structure:

```concept
$constant NAME value          // Constants definition
$constant RATE 0.25

online="ApplicationName"      // Application declaration

field="name" static() storage(type) initial-value(default)  // Field declarations

on @START                     // Start event handler
  assign("field" = value)     // Field assignments
  call('FunctionName')        // Function calls
endon

xtra="FunctionName"          // XTRA function definition
on @xtra                     // XTRA event handler
  assign("result" = calculation)  // Business logic
endon
```

## 🔧 Features Demonstrated

- **Constants**: Configuration values and business rules
- **Fields**: Data storage with type specifications
- **Events**: @START for initialization, @xtra for processing
- **XTRA Functions**: Modular business logic components
- **Assignments**: Field value updates and calculations
- **Expressions**: Arithmetic operations and field references
- **Control Flow**: If statements, loops, and conditional logic

### 🔀 Control Flow Syntax

**If Statements:**
```concept
if (condition)
  assign("field" = value)
  if (nested_condition)
    assign("nested" = "true")
  endif
endif
```

**For-style Loops:**
```concept
loop ("counter" = 1 to "max_value")
  assign("total" = "total" + "counter")
endloop
```

**While-style Loops:**
```concept
loop ("condition" <= "limit")
  assign("condition" = "condition" + 1)
endloop
```

**Comparison Operators:**
- `=` (equals), `<>` (not equals)
- `<`, `>`, `<=`, `>=` (comparisons)
- `and`, `or` (logical operators)

## 📊 Expected Output

When you run an example, you'll see:
- **Field Values**: Current state of all application fields
- **Constants**: Configuration values used in calculations
- **Business Results**: Calculated values based on the logic

Example output:
```
📊 Field Values:
  studentId: 20241001
  studentName: "Maria Olsen"
  averageGrade: 85
  passed: "true"

💰 Constants:
  SCHOOL_NAME: "Oslo University"
  PASSING_GRADE: 60
```

## 🛠 Modifying Examples

Feel free to modify the examples to experiment with:
- Different calculation formulas
- New field types and values
- Additional XTRA functions
- More complex business logic

The transpiler will handle your changes and generate corresponding JavaScript code.