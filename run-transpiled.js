// Test runner for transpiled Concept applications
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runTranspiledApp(appName) {
  console.log(chalk.blue(`\n${'='.repeat(60)}`));
  console.log(chalk.blue(`  Running Transpiled Application: ${appName}`));
  console.log(chalk.blue(`${'='.repeat(60)}\n`));

  try {
    const appPath = join(__dirname, 'transpiled-output', `${appName}.js`);
    console.log(chalk.gray(`Loading: ${appPath}\n`));

    // Convert to file:// URL for Windows
    const appUrl = new URL(`file:///${appPath.replace(/\\/g, '/')}`);
    const { default: ConceptApplication } = await import(appUrl);
    
    console.log(chalk.green('✅ Module loaded successfully'));
    console.log(chalk.gray(`Creating application instance...\n`));

    const app = await ConceptApplication.create();
    
    console.log(chalk.green('\n✅ Application executed successfully!'));
    console.log(chalk.gray('\nApplication state:'));
    console.log(chalk.yellow('  Fields:'), app.fields);
    console.log(chalk.yellow('  Constants:'), app.constants);
    console.log(chalk.yellow('  Application Name:'), app.applicationName);

    return app;

  } catch (error) {
    console.error(chalk.red('\n❌ Error running application:'));
    console.error(chalk.red(error.message));
    console.error(chalk.gray('\nStack trace:'));
    console.error(chalk.gray(error.stack));
    throw error;
  }
}

// Get app name from command line or use default
const appName = process.argv[2] || 'calculator';

console.log(chalk.cyan('\n🚀 Concept Transpiled App Runner\n'));

runTranspiledApp(appName)
  .then(() => {
    console.log(chalk.green(`\n${'='.repeat(60)}`));
    console.log(chalk.green('  Execution Complete'));
    console.log(chalk.green(`${'='.repeat(60)}\n`));
  })
  .catch(() => {
    process.exit(1);
  });
