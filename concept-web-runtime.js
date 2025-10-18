// Browser/Web-specific Concept Runtime (renamed from concept-runtime-browser.js)
// Provides UI/dialog + REST integration for transpiled Concept applications in the browser

import { ConceptBaseRuntime } from './concept-base-runtime.js';

export class ConceptWebRuntime extends ConceptBaseRuntime {
	constructor() {
		super();
		this.dialogs = new Map();
	}

	async call(functionName, ...args) {
		switch (functionName) {
			case 'showForm': return this.showForm(...args);
			case 'hideForm': return this.hideForm(...args);
			case 'helloDialog': return this.showHelloDialog(...args);
			default: return super.call(functionName, ...args);
		}
	}

	async showForm(formName) {
		let dialog = this.dialogs.get(formName);
		if (!dialog) {
			dialog = document.createElement('dialog');
			dialog.className = 'concept-form-dialog';
			dialog.innerHTML = `<form method="dialog" style="min-width:300px;padding:1rem;">
				<h3>Form: ${formName}</h3>
				<p>(Generated form placeholder)</p>
				<menu style="display:flex;gap:.5rem;justify-content:flex-end;">
					<button value="cancel">Close</button>
				</menu>
			</form>`;
			document.body.appendChild(dialog);
			this.dialogs.set(formName, dialog);
		}
		if (!dialog.open) dialog.showModal();
		return { status: '$OK' };
	}

	// Simple Hello World popup dialog
	async showHelloDialog(message = 'Hello World') {
		const formName = 'Hello'
		let dialog = this.dialogs.get(formName);
		if (!dialog) {
			dialog = document.createElement('dialog');
			dialog.className = 'concept-hello-dialog';
			dialog.innerHTML = `<form method="dialog" style="min-width:320px;padding:1rem;display:flex;flex-direction:column;gap:1rem;">
				<h3 style="margin:0;font-family:system-ui;">Concept Runtime</h3>
				<div style="font-size:1rem;">${message}</div>
				<menu style="display:flex;gap:.5rem;justify-content:flex-end;margin:0;">
					<button value="ok" autofocus>OK</button>
				</menu>
			</form>`;
			dialog.addEventListener('close', () => {
				console.log(`[ConceptWebRuntime] Hello dialog closed value=${dialog.returnValue}`);
			});
			document.body.appendChild(dialog);
			this.dialogs.set(formName, dialog);
		}
		try { dialog.showModal(); } catch { /* already open */ }
		return { status: '$OK' };
	}

	async hideForm(formName) {
		const dialog = this.dialogs.get(formName);
		if (dialog && dialog.open) dialog.close();
		return { status: '$OK' };
	}

	async restGet(url, headers = {}) {
		const result = await super.restGet(url, headers);
		this._logRest('GET', url, null, result);
		return result;
	}

	async restPost(url, body = {}, headers = {}) {
		const result = await super.restPost(url, body, headers);
		this._logRest('POST', url, body, result);
		return result;
	}

	_logRest(method, url, body, result) {
		const section = document.getElementById('restOutput');
		if (!section) return;
		const pre = document.createElement('pre');
		pre.textContent = `${method} ${url}\nStatus: ${result.status}\nOK: ${result.ok}\nBody: ${body ? JSON.stringify(body, null, 2) : '(none)'}\nResponse: ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}`;
		section.appendChild(pre);
	}
}

export default ConceptWebRuntime;