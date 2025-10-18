import { BrowserConceptTranspiler } from './browser-transpiler.js';
import ConceptWebRuntime from '../concept-web-runtime.js';

// Simple in-browser evaluation harness
const transpiler = new BrowserConceptTranspiler();
// Expose browser runtime class so generated code (after import stripping) can instantiate it
window.ConceptRuntime = ConceptWebRuntime;

function setStatus(msg, ok=true) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = ok ? 'status-ok' : 'status-error';
}

function appendOutput(line) {
  const out = document.getElementById('output');
  out.textContent += (line + '\n');
}

function clearOutput() {
  document.getElementById('output').textContent = '';
  document.getElementById('generated').textContent = '';
  setStatus('Cleared', true);
}
window.clearOutput = clearOutput;

function loadExample(name) {
  // Minimal inline example; could fetch from server later
  if (name === 'calculator') {
    document.getElementById('source').value = `$constant PI 3.14159\n$constant TAX_RATE 0.15\n\nonline="Calculator"\n\nfield="number1" static() storage(i4) initial-value(0)\nfield="number2" static() storage(i4) initial-value(0)\nfield="result" static() storage(i4) initial-value(0)\n\non @START\n  assign("number1" = 100)\n  assign("number2" = 25)\n  call('Calculate')\nendon\n\nxtra="Calculate"\non @xtra\n  assign("result" = "number1" + "number2")\nendon`;  
    setStatus('Calculator example loaded');
  }
  if (name === 'formdemo') {
    document.getElementById('source').value = `online="FormDemo"

on @START
  call('ShowHelloForm')
endon

xtra="ShowHelloForm"
on @xtra
  call('showForm', "HelloDialog")
endon`;
    setStatus('Form demo loaded');
  }
}
window.loadExample = loadExample;

function runConcept() {
  clearOutput();
  const source = document.getElementById('source').value;
  if (!source.trim()) { setStatus('No source to transpile', false); return; }
  let jsCode;
  try {
    jsCode = transpiler.transpile(source, 'browser-input.uni');
  } catch (err) {
    setStatus('Parse error: ' + err.message, false);
    appendOutput('ERROR: ' + err.message);
    return;
  }
  document.getElementById('generated').textContent = jsCode;
  setStatus('Transpilation succeeded');

  // Transform ES module import of concept-runtime into a global reference, strip export
  let cleaned = jsCode
    .replace(/import[^\n]*concept-web-runtime[^\n]*\n/, 'const ConceptRuntime = window.ConceptRuntime;\n')
    .replace(/export default ConceptApplication;?\n?/, '');

  // Wrap code in an IIFE so we can reliably capture the class even if globals are polluted
  const wrapped = `(() => {\n${cleaned}\nreturn (typeof ConceptApplication !== 'undefined' ? ConceptApplication : null);\n})()`;

  // Capture console.log during execution
  const originalLog = console.log;
    console.log = (...args) => {
      const line = args.map(a => {
        if (a && typeof a === 'object' && a.ok !== undefined && a.status !== undefined && 'data' in a) {
          return `[REST] status=${a.status} ok=${a.ok} data=` + (typeof a.data === 'object' ? JSON.stringify(a.data) : String(a.data));
        }
        return (typeof a === 'object' ? JSON.stringify(a) : String(a));
      }).join(' ');
      appendOutput(line);
      originalLog.apply(console, args);
    };

  try {
    // Use standard Function so return value is the class directly (not wrapped in a Promise)
    const runner = new Function('return ' + wrapped + ';');
    const ConceptApplication = runner();
    appendOutput('Diagnostic: evaluated type = ' + typeof ConceptApplication);
    if (!ConceptApplication || typeof ConceptApplication !== 'function') {
      throw new Error('ConceptApplication class not found or not a constructor');
    }
    const createFn = (typeof ConceptApplication.create === 'function') ? ConceptApplication.create : (async () => new ConceptApplication());
    Promise.resolve(createFn()).then(app => {
      appendOutput('Application run completed. Fields:');
      appendOutput(JSON.stringify(app.fields, null, 2));
      setStatus('Execution finished');
      console.log = originalLog;
    }).catch(err => {
      appendOutput('Runtime ERROR: ' + err.message);
      setStatus('Runtime error', false);
      console.log = originalLog;
    });
  } catch (e) {
    appendOutput('Eval ERROR: ' + e.message);
    setStatus('Evaluation failed', false);
    console.log = originalLog;
  }
}
window.runConcept = runConcept;

// Auto-load example on first visit
loadExample('calculator');
