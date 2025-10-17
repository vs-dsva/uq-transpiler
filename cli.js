
// Command Line Interface for the Concept Transpiler
import { ConceptTranspiler } from './index.js';
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
    .name('concept-transpiler')
    .description('Transpile Concept 4GL language files to JavaScript')
    .version('1.0.0');

program
    .command('transpile')
    .alias('t')
    .description('Transpile a single Concept file to JavaScript')
    .argument('<input>', 'Input Concept file (.uni, .inc, .uci)')
    .option('-o, --output <file>', 'Output JavaScript file')
    .option('-s, --source-maps', 'Generate source maps')
    .option('--no-comments', 'Exclude comments from output')
    .action(async (input, options) => {
        try {
            console.log(chalk.blue('🔄 Transpiling Concept file...'));
            console.log(chalk.gray(`Input: ${input}`));
            
            const transpiler = new ConceptTranspiler({
                generateSourceMaps: options.sourceMaps,
                preserveComments: options.comments
            });
            
            const outputPath = options.output || input.replace(/\.(uni|inc|uci)$/i, '.js');
            console.log(chalk.gray(`Output: ${outputPath}`));
            
            const result = await transpiler.transpileFile(input, outputPath);
            
            console.log(chalk.green('✅ Transpilation completed successfully!'));
            console.log(chalk.gray(`Generated ${result.length} characters of JavaScript code.`));
            
        } catch (error) {
            console.error(chalk.red('❌ Transpilation failed:'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

program
    .command('transpile-dir')
    .alias('td')
    .description('Transpile all Concept files in a directory')
    .argument('<input-dir>', 'Input directory containing Concept files')
    .option('-o, --output <dir>', 'Output directory for JavaScript files')
    .option('-s, --source-maps', 'Generate source maps')
    .option('--no-comments', 'Exclude comments from output')
    .action(async (inputDir, options) => {
        try {
            console.log(chalk.blue('🔄 Transpiling directory...'));
            console.log(chalk.gray(`Input directory: ${inputDir}`));
            
            const transpiler = new ConceptTranspiler({
                generateSourceMaps: options.sourceMaps,
                preserveComments: options.comments,
                outputDir: options.output
            });
            
            const outputDir = options.output || path.join(inputDir, 'transpiled');
            console.log(chalk.gray(`Output directory: ${outputDir}`));
            
            const files = await transpiler.transpileDirectory(inputDir, outputDir);
            
            console.log(chalk.green('✅ Directory transpilation completed!'));
            console.log(chalk.gray(`Transpiled ${files.length} files.`));
            
            files.forEach(file => {
                console.log(chalk.gray(`  • ${file}`));
            });
            
        } catch (error) {
            console.error(chalk.red('❌ Directory transpilation failed:'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

program
    .command('run')
    .alias('r')
    .description('Transpile and run a Concept file')
    .argument('<input>', 'Input Concept file (.uni, .inc, .uci)')
    .option('--keep-js', 'Keep the generated JavaScript file')
    .option('--debug', 'Show debug output during execution')
    .action(async (input, options) => {
        try {
            console.log(chalk.blue('🔄 Transpiling and running Concept file...'));
            console.log(chalk.gray(`Input: ${input}`));
            
            const transpiler = new ConceptTranspiler();
            
            // Generate temporary JS file
            const tempJsFile = input.replace(/\.(uni|inc|uci)$/i, '.temp.js');
            console.log(chalk.gray(`Transpiling to: ${tempJsFile}`));
            
            await transpiler.transpileFile(input, tempJsFile);
            
            console.log(chalk.green('✅ Transpilation completed!'));
            console.log(chalk.blue('🚀 Running generated JavaScript...'));
            console.log(chalk.yellow('--- OUTPUT ---'));
            
            // Import and run the generated module
            const { default: ConceptApplication } = await import(`./${tempJsFile}`);
            const app = await ConceptApplication.create();
            
            // Display application results
            if (app.fields && Object.keys(app.fields).length > 0) {
                console.log(chalk.cyan('\n📊 Field Values:'));
                for (const [key, value] of Object.entries(app.fields)) {
                    const displayValue = typeof value === 'string' ? `"${value}"` : value;
                    console.log(chalk.white(`  ${key}: ${displayValue}`));
                }
            }
            
            if (app.constants && Object.keys(app.constants).length > 0) {
                console.log(chalk.magenta('\n💰 Constants:'));
                for (const [key, value] of Object.entries(app.constants)) {
                    const displayValue = typeof value === 'string' ? `"${value}"` : value;
                    console.log(chalk.white(`  ${key}: ${displayValue}`));
                }
            }
            
            console.log(chalk.yellow('\n--- END OUTPUT ---'));
            console.log(chalk.green('✅ Execution completed!'));
            
            // Clean up temp file unless --keep-js is specified
            if (!options.keepJs) {
                const fs = await import('fs');
                await fs.promises.unlink(tempJsFile);
                console.log(chalk.gray(`Cleaned up ${tempJsFile}`));
            } else {
                console.log(chalk.gray(`Kept JavaScript file: ${tempJsFile}`));
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Execution failed:'));
            console.error(chalk.red(error.message));
            if (options.debug) {
                console.error(chalk.red(error.stack));
            }
            process.exit(1);
        }
    });

program
    .command('analyze')
    .alias('a')
    .description('Analyze a Concept file and show its structure')
    .argument('<input>', 'Input Concept file to analyze')
    .option('--tokens', 'Show tokenization output')
    .option('--ast', 'Show AST output')
    .action(async (input, options) => {
        try {
            console.log(chalk.blue('🔍 Analyzing Concept file...'));
            console.log(chalk.gray(`File: ${input}`));
            
            const sourceCode = await fs.promises.readFile(input, 'utf-8');
            const transpiler = new ConceptTranspiler();
            
            console.log(chalk.yellow('\n📊 File Statistics:'));
            console.log(chalk.gray(`  Lines: ${sourceCode.split('\n').length}`));
            console.log(chalk.gray(`  Characters: ${sourceCode.length}`));
            console.log(chalk.gray(`  Size: ${(sourceCode.length / 1024).toFixed(2)} KB`));
            
            if (options.tokens) {
                console.log(chalk.yellow('\n🔤 Tokens:'));
                const tokens = transpiler.lexer.tokenize(sourceCode, input);
                const tokenTypes = {};
                
                tokens.forEach(token => {
                    tokenTypes[token.type] = (tokenTypes[token.type] || 0) + 1;
                });
                
                Object.entries(tokenTypes).forEach(([type, count]) => {
                    console.log(chalk.gray(`  ${type}: ${count}`));
                });
                
                console.log(chalk.gray(`  Total tokens: ${tokens.length}`));
            }
            
            if (options.ast) {
                console.log(chalk.yellow('\n🌳 AST Structure:'));
                const tokens = transpiler.lexer.tokenize(sourceCode, input);
                const ast = transpiler.parser.parse(tokens);
                
                console.log(chalk.gray(JSON.stringify(ast, null, 2)));
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Analysis failed:'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

program
    .command('test')
    .description('Run the transpiler test suite')
    .action(async () => {
        try {
            console.log(chalk.blue('🧪 Running test suite...'));
            
            // Import and run tests
            const { default: runTests } = await import('./test.js');
            // Test runner will be executed when imported
            
        } catch (error) {
            console.error(chalk.red('❌ Tests failed:'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

program
    .command('demo')
    .description('Run a demonstration of the transpiler')
    .action(async () => {
        try {
            console.log(chalk.blue('🎬 Running transpiler demonstration...'));
            
            const demoCode = `
$constant DEMO_APP "Concept Demo"
$include system

online="DemoApplication"
  default-style-prefix('APP-')

field="message" static() storage(a(100)) initial-value("Welcome to Concept!")
field="counter" static() storage(i4) initial-value(0)

on @START
  assign("message" = "Hello from Concept!")
  assign("counter" = 1)
  call('ProcessMessage', export("message", "counter"))
endon

xtra="ProcessMessage"
  import("msg", "cnt")

on @xtra
  assign("@result" = "msg" && " (Count: " && "cnt" && ")")
  assign("counter" = "counter" + 1)
endon
`;
            
            console.log(chalk.yellow('\n📝 Demo Concept Code:'));
            console.log(chalk.gray(demoCode));
            
            const transpiler = new ConceptTranspiler();
            const result = await transpiler.transpile(demoCode, 'demo.uni');
            
            console.log(chalk.yellow('\n🔄 Generated JavaScript:'));
            console.log(chalk.gray(result.code || result));
            
            console.log(chalk.green('\n✅ Demo completed successfully!'));
            
        } catch (error) {
            console.error(chalk.red('❌ Demo failed:'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

program
    .command('init')
    .description('Initialize a new Concept project with transpiler setup')
    .argument('[project-name]', 'Project name', 'concept-project')
    .action(async (projectName) => {
        try {
            console.log(chalk.blue(`🚀 Initializing project: ${projectName}`));
            
            const projectDir = path.resolve(projectName);
            await fs.promises.mkdir(projectDir, { recursive: true });
            
            // Create basic project structure
            const directories = ['src', 'output', 'tests'];
            for (const dir of directories) {
                await fs.promises.mkdir(path.join(projectDir, dir), { recursive: true });
            }
            
            // Create sample files
            const sampleConcept = `
$constant PROJECT_NAME "${projectName}"
$include system

online="MainApplication"

field="appName" static() storage(a(100)) initial-value("${projectName}")

on @START
  assign("@welcome" = "Welcome to " && "appName")
endon
`;
            
            await fs.promises.writeFile(
                path.join(projectDir, 'src', 'main.uni'),
                sampleConcept,
                'utf-8'
            );
            
            const packageJson = {
                name: projectName.toLowerCase().replace(/\s+/g, '-'),
                version: '1.0.0',
                description: `Concept project: ${projectName}`,
                scripts: {
                    build: 'concept-transpiler transpile-dir src -o output',
                    test: 'concept-transpiler test'
                },
                devDependencies: {
                    'concept-transpiler': '^1.0.0'
                }
            };
            
            await fs.promises.writeFile(
                path.join(projectDir, 'package.json'),
                JSON.stringify(packageJson, null, 2),
                'utf-8'
            );
            
            const readme = `# ${projectName}

A Concept 4GL project transpiled to JavaScript.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Build the project:
   \`\`\`bash
   npm run build
   \`\`\`

3. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

## Project Structure

- \`src/\` - Concept source files (.uni, .inc, .uci)
- \`output/\` - Generated JavaScript files
- \`tests/\` - Test files

## Transpiler Commands

- Transpile single file: \`concept-transpiler transpile src/main.uni\`
- Transpile directory: \`concept-transpiler transpile-dir src\`
- Analyze file: \`concept-transpiler analyze src/main.uni\`
`;
            
            await fs.promises.writeFile(
                path.join(projectDir, 'README.md'),
                readme,
                'utf-8'
            );
            
            console.log(chalk.green('✅ Project initialized successfully!'));
            console.log(chalk.yellow('\n📁 Created files:'));
            console.log(chalk.gray(`  ${projectName}/`));
            console.log(chalk.gray(`    src/main.uni`));
            console.log(chalk.gray(`    package.json`));
            console.log(chalk.gray(`    README.md`));
            console.log(chalk.gray(`    src/`));
            console.log(chalk.gray(`    output/`));
            console.log(chalk.gray(`    tests/`));
            
            console.log(chalk.blue('\n🚀 Next steps:'));
            console.log(chalk.gray(`  cd ${projectName}`));
            console.log(chalk.gray(`  npm install`));
            console.log(chalk.gray(`  npm run build`));
            
        } catch (error) {
            console.error(chalk.red('❌ Project initialization failed:'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

// Add help examples
program.addHelpText('after', `
Examples:
  $ concept-transpiler transpile myapp.uni
  $ concept-transpiler run myapp.uni
  $ concept-transpiler run myapp.uni --keep-js --debug
  $ concept-transpiler transpile-dir ./hrm/basis/appl -o ./output
  $ concept-transpiler analyze myapp.uni --tokens --ast
  $ concept-transpiler demo
  $ concept-transpiler init my-project
`);

// Parse command line arguments
program.parse();