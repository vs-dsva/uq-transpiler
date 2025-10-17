// Test suite for the Concept transpiler
import { ConceptTranspiler } from './index.js';
import fs from 'fs';
import path from 'path';

class ConceptTranspilerTests {
    constructor() {
        this.transpiler = new ConceptTranspiler();
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🚀 Running Concept Transpiler Tests...\n');
        
        await this.testBasicTokenization();
        await this.testSimpleParsing();
        await this.testCodeGeneration();
        await this.testRealConceptFile();
        
        this.printResults();
    }

    async testBasicTokenization() {
        console.log('📝 Testing Basic Tokenization...');
        
        const conceptCode = `
$constant SSWorkfile test.uni
$include AGlobal

online="TestApp"

field="testField" static() storage(a(50))

on @START
  assign("testField" = "Hello World")
endon
`;
        
        try {
            const lexer = this.transpiler.lexer;
            const tokens = lexer.tokenize(conceptCode, 'test.uni');
            
            // Check for expected tokens
            const constantToken = tokens.find(t => t.type === 'CONSTANT');
            const includeToken = tokens.find(t => t.type === 'INCLUDE');
            const keywordTokens = tokens.filter(t => t.type === 'KEYWORD');
            
            if (constantToken && includeToken && keywordTokens.length > 0) {
                this.pass('Basic tokenization');
                console.log(`  ✅ Found ${tokens.length} tokens`);
            } else {
                this.fail('Basic tokenization', 'Missing expected token types');
            }
        } catch (error) {
            this.fail('Basic tokenization', error.message);
        }
    }

    async testSimpleParsing() {
        console.log('\n🔍 Testing Simple Parsing...');
        
        const conceptCode = `
$constant TEST_VALUE 123
field="myField" static() storage(i4)
assign("myField" = 42)
`;
        
        try {
            const lexer = this.transpiler.lexer;
            const parser = this.transpiler.parser;
            
            const tokens = lexer.tokenize(conceptCode, 'test.uni');
            const ast = parser.parse(tokens);
            
            if (ast && ast.type === 'Program' && ast.body.length > 0) {
                this.pass('Simple parsing');
                console.log(`  ✅ Generated AST with ${ast.body.length} statements`);
            } else {
                this.fail('Simple parsing', 'Invalid AST structure');
            }
        } catch (error) {
            this.fail('Simple parsing', error.message);
        }
    }

    async testCodeGeneration() {
        console.log('\n⚙️ Testing Code Generation...');
        
        const conceptCode = `
$constant APP_NAME "TestApplication"
field="counter" static() storage(i4) initial-value(0)

online="TestApp"

on @START
  assign("counter" = 1)
endon
`;
        
        try {
            const result = await this.transpiler.transpile(conceptCode, 'test.uni');
            
            if (result && result.includes('class ConceptApplication')) {
                this.pass('Code generation');
                console.log('  ✅ Generated valid JavaScript class');
            } else {
                this.fail('Code generation', 'No valid JavaScript class generated');
            }
        } catch (error) {
            this.fail('Code generation', error.message);
        }
    }

    async testRealConceptFile() {
        console.log('\n📂 Testing Real Concept File...');
        
        try {
            // Try to transpile a simple real file from the repository
            const testFilePath = path.join(process.cwd(), 'hrm', 'basis', 'appl', 'aiGlobal.inc');
            
            if (fs.existsSync(testFilePath)) {
                const result = await this.transpiler.transpileFile(testFilePath);
                
                if (result && result.length > 0) {
                    this.pass('Real file transpilation');
                    console.log('  ✅ Successfully transpiled aiGlobal.inc');
                } else {
                    this.fail('Real file transpilation', 'Empty result');
                }
            } else {
                console.log('  ⚠️ Skipped - test file not found');
                this.skip('Real file transpilation');
            }
        } catch (error) {
            this.fail('Real file transpilation', error.message);
        }
    }

    pass(testName) {
        this.testResults.push({ name: testName, status: 'PASS' });
    }

    fail(testName, error) {
        this.testResults.push({ name: testName, status: 'FAIL', error });
    }

    skip(testName) {
        this.testResults.push({ name: testName, status: 'SKIP' });
    }

    printResults() {
        console.log('\n📊 Test Results:');
        console.log('==================');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIP').length;
        
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : 
                        result.status === 'FAIL' ? '❌' : '⚠️';
            console.log(`${icon} ${result.name}: ${result.status}`);
            if (result.error) {
                console.log(`    Error: ${result.error}`);
            }
        });
        
        console.log('\n📈 Summary:');
        console.log(`  Passed: ${passed}`);
        console.log(`  Failed: ${failed}`);
        console.log(`  Skipped: ${skipped}`);
        console.log(`  Total: ${this.testResults.length}`);
        
        if (failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n⚠️ Some tests failed. Please review the errors above.');
        }
    }
}

// Example usage with a simple Concept code snippet
async function demonstrateTranspilation() {
    console.log('\n🔄 Demonstration: Transpiling Concept to JavaScript');
    console.log('=====================================================\n');
    
    const sampleConceptCode = `
$constant APPLICATION_NAME "HRM System"
$include AGlobal

online="HRMApplication"

field="employeeId" static() storage(i4) initial-value(0)
field="employeeName" static() storage(a(100)) initial-value("")

on @START
  assign("employeeId" = 1001)
  assign("employeeName" = "John Doe")
  call('DisplayEmployee', export("employeeId", "employeeName"))
endon

xtra="DisplayEmployee"
  import("empId", "empName")
  
on @xtra
  assign("@message" = "Employee: " && "empName" && " (ID: " && "empId" && ")")
endon
`;
    
    console.log('📝 Input Concept Code:');
    console.log('```concept');
    console.log(sampleConceptCode);
    console.log('```\n');
    
    try {
        const transpiler = new ConceptTranspiler();
        const result = await transpiler.transpile(sampleConceptCode, 'sample.uni');
        
        console.log('🔄 Generated JavaScript:');
        console.log('```javascript');
        console.log(result);
        console.log('```\n');
        
        console.log('✅ Transpilation successful!');
    } catch (error) {
        console.log('❌ Transpilation failed:');
        console.log(error.message);
    }
}

// Auto-run tests
const tests = new ConceptTranspilerTests();
await tests.runAllTests();
await demonstrateTranspilation();