// Test script for Ohm-based transpiler
// Validates that the new implementation works with existing examples

import { OhmConceptParser } from './ohm-transpiler.js';
import { JavaScriptGenerator } from './generator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testParser() {
    log('\n🧪 Testing Ohm-based Concept Parser\n', 'cyan');
    
    const parser = new OhmConceptParser();
    const generator = new JavaScriptGenerator();
    const examplesDir = path.join(__dirname, 'examples');
    
    let passed = 0;
    let failed = 0;
    
    try {
        const files = fs.readdirSync(examplesDir)
            .filter(f => f.endsWith('.uni'))
            .sort();
        
        log(`Found ${files.length} example files to test\n`, 'blue');
        
        for (const file of files) {
            const filePath = path.join(examplesDir, file);
            const source = fs.readFileSync(filePath, 'utf8');
            
            try {
                log(`Testing: ${file}`, 'yellow');
                
                // Parse the source
                const ast = parser.parse(source, file);
                log(`  ✓ Parsed successfully`, 'green');
                
                // Generate JavaScript
                const result = generator.generate(ast, file);
                log(`  ✓ Generated JavaScript (${result.code.length} chars)`, 'green');
                
                // Check AST structure
                if (ast.type === 'Program' && Array.isArray(ast.body)) {
                    log(`  ✓ Valid AST structure (${ast.body.length} statements)`, 'green');
                } else {
                    throw new Error('Invalid AST structure');
                }
                
                passed++;
                log(`  ✅ PASSED\n`, 'green');
                
            } catch (error) {
                failed++;
                log(`  ❌ FAILED: ${error.message}`, 'red');
                log(`  ${error.stack}\n`, 'red');
            }
        }
        
        // Summary
        log('\n' + '='.repeat(60), 'cyan');
        log(`Test Summary:`, 'cyan');
        log(`  Total:  ${files.length}`, 'blue');
        log(`  Passed: ${passed}`, 'green');
        log(`  Failed: ${failed}`, failed > 0 ? 'red' : 'green');
        log('='.repeat(60) + '\n', 'cyan');
        
        if (failed === 0) {
            log('✅ All tests passed!', 'green');
            return true;
        } else {
            log('❌ Some tests failed', 'red');
            return false;
        }
        
    } catch (error) {
        log(`Fatal error: ${error.message}`, 'red');
        console.error(error.stack);
        return false;
    }
}

// Test individual constructs
async function testConstructs() {
    log('\n🔬 Testing Individual Language Constructs\n', 'cyan');
    
    const parser = new OhmConceptParser();
    const tests = [
        {
            name: 'Constant declaration',
            code: '$constant TAX_RATE 0.25\n',
            check: ast => ast.body[0]?.type === 'Constant'
        },
        {
            name: 'Include statement',
            code: '$include AGlobal\n',
            check: ast => ast.body[0]?.type === 'Include'
        },
        {
            name: 'Field declaration',
            code: 'field="empName" static() storage(a(100)) initial-value("")\n',
            check: ast => ast.body[0]?.type === 'FieldDeclaration'
        },
        {
            name: 'Assignment',
            code: 'online="Test"\non @START\n  assign("x" = 5)\nendon\n',
            check: ast => {
                const online = ast.body[0];
                return online?.body[0]?.body[0]?.type === 'Assignment';
            }
        },
        {
            name: 'Function call',
            code: 'online="Test"\non @START\n  call(\'MyFunc\')\nendon\n',
            check: ast => {
                const online = ast.body[0];
                return online?.body[0]?.body[0]?.type === 'FunctionCall';
            }
        },
        {
            name: 'If statement',
            code: 'online="Test"\non @START\n  if ("x" > 0)\n    assign("y" = 1)\n  endif\nendon\n',
            check: ast => {
                const online = ast.body[0];
                return online?.body[0]?.body[0]?.type === 'IfStatement';
            }
        },
        {
            name: 'Loop statement',
            code: 'online="Test"\non @START\n  loop("i" = 1 to 10)\n    assign("x" = "x" + 1)\n  endloop\nendon\n',
            check: ast => {
                const online = ast.body[0];
                return online?.body[0]?.body[0]?.type === 'LoopStatement';
            }
        },
        {
            name: 'Binary expression',
            code: 'online="Test"\non @START\n  assign("z" = "x" + "y" * 2)\nendon\n',
            check: ast => {
                const online = ast.body[0];
                const assign = online?.body[0]?.body[0];
                return assign?.value?.type === 'BinaryExpression';
            }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const ast = parser.parse(test.code, 'test.uni');
            
            if (test.check(ast)) {
                log(`✓ ${test.name}`, 'green');
                passed++;
            } else {
                log(`✗ ${test.name}: Check failed`, 'red');
                failed++;
            }
        } catch (error) {
            log(`✗ ${test.name}: ${error.message}`, 'red');
            failed++;
        }
    }
    
    log(`\nConstruct tests: ${passed} passed, ${failed} failed\n`, 
        failed === 0 ? 'green' : 'yellow');
    
    return failed === 0;
}

// Main test runner
async function main() {
    log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
    log('║        Ohm.js Refactoring Validation Tests               ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
    
    const constructsOk = await testConstructs();
    const examplesOk = await testParser();
    
    if (constructsOk && examplesOk) {
        log('\n🎉 All validation tests passed! Refactoring successful!\n', 'green');
        process.exit(0);
    } else {
        log('\n⚠️  Some tests failed. Review the errors above.\n', 'yellow');
        process.exit(1);
    }
}

main().catch(error => {
    log(`\nFatal error: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
});
