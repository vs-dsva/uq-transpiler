# Concept 4GL Language Reference

This document describes the Concept 4GL language syntax and constructs supported by the transpiler.

## Table of Contents

1. [Program Structure](#program-structure)
2. [Constants](#constants)
3. [Includes](#includes)
4. [Online Applications](#online-applications)
5. [Fields](#fields)
6. [Events](#events)
7. [Functions (Xtra)](#functions-xtra)
8. [Control Flow](#control-flow)
9. [Expressions](#expressions)
10. [Database Operations](#database-operations)

---

## Program Structure

A Concept program consists of top-level declarations:

```concept
$constant PI 3.14159
$include AGlobal

online="MyApp"
  field="x" static() storage(i4) initial-value(0)
  
  on @START
    assign("x" = 100)
  endon
```

---

## Constants

Constants are compile-time values defined at the program level.

### Syntax

```concept
$constant NAME value
```

### Examples

```concept
$constant PI 3.14159
$constant APP_NAME "MyApplication"
$constant MAX_USERS 100
```

### JavaScript Output

```javascript
this.constants.PI = 3.14159;
this.constants.APP_NAME = "MyApplication";
this.constants.MAX_USERS = 100;
```

---

## Includes

Include other Concept modules.

### Syntax

```concept
$include ModuleName
```

### Examples

```concept
$include AGlobal
$include UserModule
$include DatabaseHelpers
```

---

## Online Applications

The main application container.

### Syntax

```concept
online="ApplicationName"
  field declarations...
  event handlers...
```

### Example

```concept
online="EmployeeManager"
  field="employeeId" static() storage(i4) initial-value(0)
  field="employeeName" static() storage(a(100)) initial-value("")
  
  on @START
    assign("employeeId" = 1001)
    assign("employeeName" = "John Doe")
  endon
```

---

## Fields

Fields are variables that hold data.

### Syntax

```concept
field="name" property1() property2(args) ...
```

### Properties

| Property | Description | Example |
|----------|-------------|---------|
| `static()` | Static field | `static()` |
| `storage(type)` | Data type | `storage(i4)` for int32, `storage(a(100))` for string |
| `initial-value(val)` | Default value | `initial-value(0)` |

### Storage Types

- `i4` - 32-bit integer
- `i8` - 64-bit integer
- `a(n)` - String of length n
- `f8` - 64-bit float

### Examples

```concept
field="counter" static() storage(i4) initial-value(0)
field="name" static() storage(a(50)) initial-value("")
field="price" static() storage(f8) initial-value(0.0)
field="flag" static() storage(i4) initial-value(1)
```

### JavaScript Output

```javascript
initializeFields() {
  this.fields["counter"] = 0;      // i4
  this.fields["name"] = "";         // a(50)
  this.fields["price"] = 0.0;       // f8
  this.fields["flag"] = 1;          // i4
}
```

---

## Events

Event handlers respond to system or user events.

### Syntax

```concept
on EventName
  statements...
endon
```

### Built-in Events

- `@START` - Application initialization
- `@xtra` - Called when xtra function executes
- `F1`, `F2`, ... `F12` - Function keys
- Custom event names

### Examples

```concept
on @START
  assign("initialized" = 1)
  call('LoadData')
endon

on F12
  assign("helpMode" = 1)
endon
```

### JavaScript Output

```javascript
async handle__START(event) {
  this.fields["initialized"] = 1;
  await this.runtime.call("LoadData");
}

async handle_F12(event) {
  this.fields["helpMode"] = 1;
}
```

---

## Functions (Xtra)

User-defined functions (subroutines).

### Syntax

```concept
xtra="FunctionName"
on @xtra
  statements...
endon
```

### Example

```concept
xtra="CalculateTotal"
on @xtra
  assign("total" = "subtotal" + "tax")
  assign("total" = "total" - "discount")
endon
```

### Calling Functions

```concept
call('CalculateTotal')
call('ProcessData', export("result"))
```

### JavaScript Output

```javascript
async CalculateTotal(params = {}) {
  this.fields["total"] = (this.fields["subtotal"] + this.fields["tax"]);
  this.fields["total"] = (this.fields["total"] - this.fields["discount"]);
}

// Called with:
await this.runtime.call("CalculateTotal");
```

---

## Control Flow

### If Statements

```concept
if (condition)
  statements...
elseif (condition)
  statements...
else
  statements...
endif
```

**Example:**
```concept
if ("grade" >= 90)
  assign("letter" = "A")
elseif ("grade" >= 80)
  assign("letter" = "B")
elseif ("grade" >= 70)
  assign("letter" = "C")
else
  assign("letter" = "F")
endif
```

### Loop Statements

**For-style loop:**
```concept
loop ("i" = 1 to 10)
  assign("sum" = "sum" + "i")
endloop
```

**While-style loop:**
```concept
loop ("count" < 100)
  assign("count" = "count" + 1)
endloop
```

**JavaScript Output:**
```javascript
// For-style
for (this.fields["i"] = 1; this.fields["i"] <= 10; this.fields["i"]++) {
  this.fields["sum"] = (this.fields["sum"] + this.fields["i"]);
}

// While-style
while ((this.fields["count"] < 100)) {
  this.fields["count"] = (this.fields["count"] + 1);
}
```

### While Statements

```concept
while (condition)
  statements...
endwhile
```

**Example:**
```concept
while ("remaining" > 0)
  assign("remaining" = "remaining" - 1)
  call('ProcessItem')
endwhile
```

### Case Statements

```concept
case (expression)
when (value1)
  statements...
when (value2)
  statements...
otherwise
  statements...
endcase
```

**Example:**
```concept
case ("status")
when (1)
  assign("statusText" = "Active")
when (2)
  assign("statusText" = "Inactive")
when (3)
  assign("statusText" = "Pending")
otherwise
  assign("statusText" = "Unknown")
endcase
```

---

## Expressions

### Operators

**Arithmetic:**
- `+` Addition
- `-` Subtraction
- `*` Multiplication
- `/` Division
- `%` Modulo

**Comparison:**
- `=` Equal
- `<>` Not equal
- `<` Less than
- `>` Greater than
- `<=` Less than or equal
- `>=` Greater than or equal

**Logical:**
- `and` Logical AND
- `or` Logical OR
- `not` Logical NOT

### Examples

```concept
assign("result" = "a" + "b")
assign("valid" = "count" >= 10 and "status" = 1)
assign("total" = ("price" * "quantity") + "tax")
```

### Field References

Fields are referenced by their names in quotes:

```concept
assign("result" = "field1" + "field2")
```

### Literals

**Numbers:**
```concept
assign("x" = 100)
assign("pi" = 3.14159)
```

**Strings:**
```concept
assign("name" = "John Doe")
assign("message" = "Hello, World!")
```

---

## Database Operations

### Supported Operations

```concept
open("tableName", mode)
read("tableName", "keyField")
write("tableName")
close("tableName")
delete("tableName")
rewrite("tableName")
```

### Example

```concept
xtra="LoadEmployee"
on @xtra
  open("Employees", "read")
  read("Employees", "employeeId")
  assign("name" = "employeeName")
  close("Employees")
endon
```

### JavaScript Output

```javascript
async LoadEmployee(params = {}) {
  await this.runtime.dbOperation("open", ["Employees", "read"]);
  await this.runtime.dbOperation("read", ["Employees", "employeeId"]);
  this.fields["name"] = this.fields["employeeName"];
  await this.runtime.dbOperation("close", ["Employees"]);
}
```

---

## Complete Example

**Input (payroll.uni):**
```concept
$constant TAX_RATE 0.15

online="PayrollSystem"

field="employeeId" static() storage(i4) initial-value(0)
field="baseSalary" static() storage(f8) initial-value(0.0)
field="bonus" static() storage(f8) initial-value(0.0)
field="tax" static() storage(f8) initial-value(0.0)
field="netPay" static() storage(f8) initial-value(0.0)

on @START
  assign("employeeId" = 1001)
  assign("baseSalary" = 50000.0)
  assign("bonus" = 5000.0)
  call('CalculatePayroll')
endon

xtra="CalculatePayroll"
on @xtra
  assign("tax" = ("baseSalary" + "bonus") * $TAX_RATE)
  assign("netPay" = ("baseSalary" + "bonus") - "tax")
endon
```

**Output (JavaScript):**
```javascript
import { ConceptRuntime } from "./concept-runtime.js";

class ConceptApplication {
  constructor() {
    this.runtime = new ConceptRuntime();
    this.runtime.setApplication(this);
    this.fields = {};
    this.constants = {};
    
    this.constants.TAX_RATE = 0.15;
  }

  initializeFields() {
    this.fields["employeeId"] = 0;
    this.fields["baseSalary"] = 0.0;
    this.fields["bonus"] = 0.0;
    this.fields["tax"] = 0.0;
    this.fields["netPay"] = 0.0;
  }

  async handle__START(event) {
    this.fields["employeeId"] = 1001;
    this.fields["baseSalary"] = 50000.0;
    this.fields["bonus"] = 5000.0;
    await this.runtime.call("CalculatePayroll");
  }

  async CalculatePayroll(params = {}) {
    this.fields["tax"] = ((this.fields["baseSalary"] + this.fields["bonus"]) * this.constants.TAX_RATE);
    this.fields["netPay"] = ((this.fields["baseSalary"] + this.fields["bonus"]) - this.fields["tax"]);
  }

  async run() {
    this.initializeFields();
    this.runtime.registerEventHandler("@START", this.handle__START.bind(this));
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

## Notes

- All field references use double quotes: `"fieldName"`
- String literals use double quotes: `"Hello"`
- Constants use `$` prefix: `$TAX_RATE`
- All function calls are async in JavaScript output
- Event handlers are converted to async methods
