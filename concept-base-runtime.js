// Shared base runtime for Concept applications (environment agnostic)
export class ConceptBaseRuntime {
  constructor() {
    this.eventHandlers = new Map();
    this.fields = new Map();
    this.constants = new Map();
    this.tables = new Map();
    this.streams = new Map();
    this.forms = new Map();
    this.currentApplication = null;
  }

  setApplication(application) { this.currentApplication = application; }

  registerEventHandler(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) this.eventHandlers.set(eventName, []);
    this.eventHandlers.get(eventName).push(handler);
  }

  async triggerEvent(eventName, eventData = {}) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      for (const handler of handlers) await handler(eventData);
    }
  }

  async call(functionName, ...args) {
    // Base call dispatch; environment runtimes can override
    if (this.currentApplication && typeof this.currentApplication[functionName] === 'function') {
      return await this.currentApplication[functionName](...args);
    }
    return null;
  }

  // Field operations
  assign(fieldName, value) { this.fields.set(fieldName, value); return value; }
  getField(fieldName) { return this.fields.get(fieldName); }
  setField(fieldName, value) { this.fields.set(fieldName, value); }

  // Basic runtime helpers
  concat(left, right) { return String(left) + String(right); }
  substring(str, start, end) { return str.substring(start - 1, end); }
  length(str) { return String(str).length; }
  async loop(variable, start, end, body) { for (let i = start; i <= end; i++) { this.setField(variable, i); await body(); } }
  async if(condition, thenBlock, elseBlock = null) { if (condition) await thenBlock(); else if (elseBlock) await elseBlock(); }
  async while(condition, body) { while (await condition()) await body(); }
  log(message) { console.log(`[Concept] ${message}`); }
  format(value, format) { if (format === 'YYYYMMDD' && value instanceof Date) { return value.getFullYear().toString() + (value.getMonth()+1).toString().padStart(2,'0') + value.getDate().toString().padStart(2,'0'); } return String(value); }
  currentDate(format=null) { const now = new Date(); return format ? this.format(now, format) : now; }
  currentYear() { return new Date().getFullYear(); }

  // Placeholder UI (overridden in web runtime)
  async showForm(formName) { /* no-op in base */ }
  async hideForm(formName) { /* no-op in base */ }

  // Security / file / SQL placeholders (could be implemented per environment)
  async changeElement(elementName, properties) { /* no-op */ }
  async inquireElement(elementName, property) { return null; }
  async checkSecurity(resource, user, system) { return { access: 'FULL', status: '$OK' }; }
  async fileInfo(filename) { return { status: 0, size: 0, modified: new Date() }; }
  async sqlExec(database, command) { return { status: '$OK', rows: 0 }; }

  // REST helpers (available in base); environments without fetch return stub
  async restGet(url, headers = {}) {
    const fetchFn = (typeof fetch !== 'undefined') ? fetch : null;
    if (!fetchFn) return { ok:false, status:0, data:null, headers:{} };
    const res = await fetchFn(url, { headers });
    return await this._processRestResponse(res);
  }
  async restPost(url, body = {}, headers = {}) {
    const fetchFn = (typeof fetch !== 'undefined') ? fetch : null;
    if (!fetchFn) return { ok:false, status:0, data:null, headers:{} };
    const res = await fetchFn(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', ...headers },
      body:(typeof body==='string'?body:JSON.stringify(body))
    });
    return await this._processRestResponse(res);
  }
  async _processRestResponse(res) {
    const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = text; }
    return { ok:res.ok, status:res.status, data:json, headers:(res.headers?Object.fromEntries(res.headers.entries()):{}) };
  }
}

export default ConceptBaseRuntime;