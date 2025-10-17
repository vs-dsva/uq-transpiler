// Browser-specific Concept Runtime
// Focused on UI dialogs and REST API interaction
import ConceptRuntime from './concept-runtime.js';

export class ConceptBrowserRuntime extends ConceptRuntime {
  constructor() {
    super();
  }

  async call(functionName, ...args) {
    switch (functionName) {
      case 'showForm':
        return this.showForm(...args);
      case 'hideForm':
        return this.hideForm(...args);
      case 'restGet': {
        // Support: call('restGet', url [, targetField])
        const [url, maybeField] = args;
        const result = await this.restGet(url);
        if (maybeField && this.currentApplication && this.currentApplication.fields) {
          this.currentApplication.fields[maybeField] = result.data;
        }
        console.log('[REST][GET]', args[0], result.status);
        return result;
      }
      case 'restPost': {
        // Support: call('restPost', url, body [, targetField])
        const [url, body, maybeField] = args;
        const result = await this.restPost(url, body || {});
        if (maybeField && this.currentApplication && this.currentApplication.fields) {
          this.currentApplication.fields[maybeField] = result.data;
        }
        console.log('[REST][POST]', args[0], result.status);
        return result;
      }
      default:
        return super.call(functionName, ...args);
    }
  }

  async showForm(formName, content = 'Hello World') {
    if (typeof document === 'undefined') return;
    let existing = document.querySelector(`dialog[data-form-name="${formName}"]`);
    if (!existing) {
      existing = document.createElement('dialog');
      existing.dataset.formName = formName;
      existing.style.padding = '1rem';
      existing.style.minWidth = '300px';
      existing.innerHTML = `
        <form method="dialog" style="display:flex; flex-direction:column; gap:.75rem;">
          <h3 style="margin:0; font-family:system-ui;">${formName}</h3>
          <div class="concept-form-body">${content}</div>
          <menu style="display:flex; gap:.5rem; justify-content:flex-end; margin:0;">
            <button value="ok">OK</button>
            <button value="close">Close</button>
          </menu>
        </form>`;
      existing.addEventListener('close', () => {
        console.log(`[BrowserRuntime] Form ${formName} closed value=${existing.returnValue}`);
      });
      document.body.appendChild(existing);
    }
    try { existing.showModal(); } catch { /* already open */ }
  }

  async hideForm(formName) {
    if (typeof document === 'undefined') return;
    const dlg = document.querySelector(`dialog[data-form-name="${formName}"]`);
    if (dlg && dlg.open) dlg.close('hide');
  }

  // Simple REST GET
  async restGet(url, headers = {}) {
    const res = await fetch(url, { headers });
    return await this._processResponse(res);
  }

  // Simple REST POST
  async restPost(url, body = {}, headers = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    return await this._processResponse(res);
  }

  async _processResponse(res) {
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    return {
      ok: res.ok,
      status: res.status,
      data: json,
      headers: Object.fromEntries(res.headers.entries())
    };
  }
}

export default ConceptBrowserRuntime;
