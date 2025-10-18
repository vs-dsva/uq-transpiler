import { PeggyConceptParser } from './peggy-transpiler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    gray: '\x1b[90m'
};

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║        Peggy Refactoring Validation Tests               ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('🔬 Testing Individual Language Constructs\n');

const parser = new PeggyConceptParser();

function testConstruct(name, code) {
    try {
        const ast = parser.parse(code, 'test.uni');
        console.log(`${colors.green}✓${colors.reset} ${name}`);
        return true;
    } catch (error) {
        console.log(`${colors.red}✗${colors.reset} ${name}: ${error.message}`);
        return false;
    }
}

// Test individual constructs
let passed = 0;
let failed = 0;

const tests = [
    ['Constant declaration', '$constant TAX_RATE 0.25\n'],
    ['Include statement', '$include AGlobal\n'],
    ['Field declaration', 'field="empName" static() storage(a(100)) initial-value("")\n'],
    ['Assignment', 'online="Test"\non @START\n  assign("x" = 5)\nendon\n'],
    ['Function call', 'online="Test"\non @START\n  call(\'MyFunc\')\nendon\n'],
    ['If statement', 'online="Test"\non @START\n  if ("x" > 0)\n    assign("y" = 1)\n  endif\nendon\n'],
    ['Loop (for-style)', 'online="Test"\non @START\n  loop("i" = 1 to 10)\n    assign("x" = "x" + 1)\n  endloop\nendon\n'],
    ['Loop (while-style)', 'online="Test"\non @START\n  loop("count" < 100)\n    assign("count" = "count" + 1)\n  endloop\nendon\n'],
    ['Loop (nested)', 'online="Test"\non @START\n  loop("i" = 1 to 3)\n    loop("j" = 1 to 2)\n      assign("x" = "x" + 1)\n    endloop\n  endloop\nendon\n'],
    ['Loop (with fields)', 'online="Test"\non @START\n  loop("counter" = "start" to "end")\n    assign("sum" = "sum" + "counter")\n  endloop\nendon\n'],
    ['Binary expression', 'online="Test"\non @START\n  assign("z" = "x" + "y" * 2)\nendon\n'],
    ['Concatenation &', 'online="Test"\non @START\n  assign("s" = "a" & "b")\nendon\n'],
    ['Concatenation &&', 'online="Test"\non @START\n  assign("s" = "a" && "b")\nendon\n'],
    ['Unary plus', 'online="Test"\non @START\n  assign("v" = +"x")\nendon\n'],
    ['Power operator', 'online="Test"\non @START\n  assign("p" = "x" ** "y" ** "z")\nendon\n'],
    ['Membership IN', 'online="Test"\non @START\n  if ("status" in (1,2,3))\n    assign("ok" = 1)\n  endif\nendon\n'],
    ['Range operator', 'online="Test"\non @START\n  assign("r" = "start" : "finish")\nendon\n']
    ,['SUBSTR intrinsic', 'online="Test"\non @START\n  assign("sub" = SUBSTR("name", 2, 3))\nendon\n']
    ,['WORD intrinsic', 'online="Test"\non @START\n  assign("w" = WORD("alpha beta gamma", 2))\nendon\n']
    ,['Infix # substring', 'online="Test"\non @START\n  assign("slice" = "text" # 2 # 3)\nendon\n']
];

tests.forEach(([name, code]) => {
    if (testConstruct(name, code)) {
        passed++;
    } else {
        failed++;
    }
});

console.log(`\nConstruct tests: ${colors.green}${passed} passed${colors.reset}, ${failed > 0 ? colors.red : colors.gray}${failed} failed${colors.reset}\n`);

// Test with actual example files
console.log('\n🧪 Testing Peggy-based Concept Parser\n');

const examplesDir = path.join(__dirname, 'examples');
const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.uni'));

console.log(`Found ${files.length} example files to test\n`);

let totalPassed = 0;
let totalFailed = 0;

files.forEach(file => {
    const filePath = path.join(examplesDir, file);
    const source = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`Testing: ${colors.blue}${file}${colors.reset}`);
    
    try {
        const ast = parser.parse(source, file);
        console.log(`  ${colors.green}✅ PASSED${colors.reset}`);
        totalPassed++;
    } catch (error) {
        console.log(`  ${colors.red}❌ FAILED${colors.reset}: ${error.message}`);
        console.log(`  ${colors.gray}${error.stack?.split('\n').slice(1, 3).join('\n')}${colors.reset}`);
        totalFailed++;
    }
    
    console.log();
});

console.log('\n' + '='.repeat(60));
console.log('Test Summary:');
console.log(`  Total:  ${totalPassed + totalFailed}`);
console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`);
console.log(`  ${totalFailed > 0 ? colors.red : colors.gray}Failed: ${totalFailed}${colors.reset}`);
console.log('='.repeat(60));

if (totalFailed > 0) {
    console.log(`\n${colors.red}❌ Some tests failed${colors.reset}`);
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Review the errors above.${colors.reset}\n`);
    process.exit(1);
} else {
    console.log(`\n${colors.green}✅ All tests passed!${colors.reset}\n`);
    process.exit(0);
}
