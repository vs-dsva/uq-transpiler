// Concept Runtime Library
// Provides runtime support for transpiled Concept applications

export class ConceptRuntime {
    constructor() {
        this.eventHandlers = new Map();
        this.fields = new Map();
        this.constants = new Map();
        this.tables = new Map();
        this.streams = new Map();
        this.forms = new Map();
        this.currentApplication = null;
    }

    /**
     * Set the current application context
     * @param {object} application - The application instance
     */
    setApplication(application) {
        this.currentApplication = application;
    }

    /**
     * Register an event handler
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Event handler function
     */
    registerEventHandler(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);
    }

    /**
     * Trigger an event
     * @param {string} eventName - Name of the event to trigger
     * @param {object} eventData - Event data
     */
    async triggerEvent(eventName, eventData = {}) {
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
            for (const handler of handlers) {
                await handler(eventData);
            }
        }
    }

    /**
     * Call a function
     * @param {string} functionName - Name of the function
     * @param {...any} args - Function arguments
     */
    async call(functionName, ...args) {
        // Handle built-in functions
        switch (functionName) {
            case 'assign':
                return this.assign(...args);
            case 'find':
                return this.find(...args);
            case 'insert':
                return this.insert(...args);
            case 'update':
                return this.update(...args);
            case 'delete':
                return this.delete(...args);
                case 'restGet': {
                    const [url, maybeField] = args;
                    const result = await this.restGet(url);
                    if (maybeField && this.currentApplication && this.currentApplication.fields) {
                        this.currentApplication.fields[maybeField] = result.data;
                    }
                    return result;
                }
                case 'restPost': {
                    const [url, body, maybeField] = args;
                    const result = await this.restPost(url, body || {});
                    if (maybeField && this.currentApplication && this.currentApplication.fields) {
                        this.currentApplication.fields[maybeField] = result.data;
                    }
                    return result;
                }
            default:
                // Try to call application method
                if (this.currentApplication && typeof this.currentApplication[functionName] === 'function') {
                    return await this.currentApplication[functionName](...args);
                }
                console.log(`Calling function: ${functionName}`, args);
                return null;
        }
    }

    /**
     * Assign a value to a field
     * @param {string} fieldName - Name of the field
     * @param {any} value - Value to assign
     */
    assign(fieldName, value) {
        this.fields.set(fieldName, value);
        return value;
    }

    /**
     * Get field value
     * @param {string} fieldName - Name of the field
     * @returns {any} Field value
     */
    getField(fieldName) {
        return this.fields.get(fieldName);
    }

    /**
     * Set field value
     * @param {string} fieldName - Name of the field
     * @param {any} value - Value to set
     */
    setField(fieldName, value) {
        this.fields.set(fieldName, value);
    }

    /**
     * Find records in a table
     * @param {string} tableName - Name of the table
     * @param {object} criteria - Search criteria
     */
    async find(tableName, criteria = {}) {
        // Placeholder for database operations
        console.log(`Finding in table ${tableName}:`, criteria);
        return { status: '$OK', records: [] };
    }

    /**
     * Insert a record into a table
     * @param {string} tableName - Name of the table
     * @param {object} record - Record to insert
     */
    async insert(tableName, record = {}) {
        // Placeholder for database operations
        console.log(`Inserting into table ${tableName}:`, record);
        return { status: '$OK' };
    }

    /**
     * Update records in a table
     * @param {string} tableName - Name of the table
     * @param {object} criteria - Update criteria
     * @param {object} values - Values to update
     */
    async update(tableName, criteria = {}, values = {}) {
        // Placeholder for database operations
        console.log(`Updating table ${tableName}:`, criteria, values);
        return { status: '$OK' };
    }

    /**
     * Delete records from a table
     * @param {string} tableName - Name of the table
     * @param {object} criteria - Delete criteria
     */
    async delete(tableName, criteria = {}) {
        // Placeholder for database operations
        console.log(`Deleting from table ${tableName}:`, criteria);
        return { status: '$OK' };
    }

    /**
     * String concatenation (Concept && operator)
     * @param {any} left - Left operand
     * @param {any} right - Right operand
     * @returns {string} Concatenated string
     */
    concat(left, right) {
        return String(left) + String(right);
    }

    /**
     * String substring (Concept string(start:end) syntax)
     * @param {string} str - Source string
     * @param {number} start - Start position (1-based)
     * @param {number} end - End position (1-based)
     * @returns {string} Substring
     */
    substring(str, start, end) {
        // Convert from 1-based to 0-based indexing
        return str.substring(start - 1, end);
    }

    /**
     * Length of a string
     * @param {string} str - Source string
     * @returns {number} String length
     */
    length(str) {
        return String(str).length;
    }

    /**
     * Loop implementation
     * @param {string} variable - Loop variable name
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {Function} body - Loop body function
     */
    async loop(variable, start, end, body) {
        for (let i = start; i <= end; i++) {
            this.setField(variable, i);
            await body();
        }
    }

    /**
     * Conditional execution
     * @param {boolean} condition - Condition to test
     * @param {Function} thenBlock - Function to execute if true
     * @param {Function} elseBlock - Function to execute if false
     */
    async if(condition, thenBlock, elseBlock = null) {
        if (condition) {
            await thenBlock();
        } else if (elseBlock) {
            await elseBlock();
        }
    }

    /**
     * While loop implementation
     * @param {Function} condition - Condition function
     * @param {Function} body - Loop body function
     */
    async while(condition, body) {
        while (await condition()) {
            await body();
        }
    }

    /**
     * Log a message
     * @param {string} message - Message to log
     */
    log(message) {
        console.log(`[Concept] ${message}`);
    }

    /**
     * Format a value for display
     * @param {any} value - Value to format
     * @param {string} format - Format string
     * @returns {string} Formatted value
     */
    format(value, format) {
        // Basic formatting - can be extended
        switch (format) {
            case 'YYYYMMDD':
                if (value instanceof Date) {
                    return value.getFullYear().toString() + 
                           (value.getMonth() + 1).toString().padStart(2, '0') +
                           value.getDate().toString().padStart(2, '0');
                }
                break;
            default:
                return String(value);
        }
        return String(value);
    }

    /**
     * Get current date
     * @param {string} format - Date format
     * @returns {any} Current date in specified format
     */
    currentDate(format = null) {
        const now = new Date();
        if (format) {
            return this.format(now, format);
        }
        return now;
    }

    /**
     * Get current year
     * @returns {number} Current year
     */
    currentYear() {
        return new Date().getFullYear();
    }

    /**
     * UI operations (placeholder)
     */
    async showForm(formName) {
                    console.log(`Showing form: ${formName}`);
                    if (typeof document === 'undefined') return; // Node fallback
                    let existing = document.querySelector(`dialog[data-form-name="${formName}"]`);
                    if (existing) {
                            existing.showModal();
                            return;
                    }
                    const dlg = document.createElement('dialog');
                    dlg.dataset.formName = formName;
                    dlg.style.padding = '1rem';
                    dlg.style.minWidth = '300px';
                    dlg.innerHTML = `
                        <form method="dialog" style="display:flex; flex-direction:column; gap:.75rem;">
                            <h3 style="margin:0; font-family:system-ui;">${formName}</h3>
                            <div>Hello World from Concept Runtime</div>
                            <menu style="display:flex; gap:.5rem; justify-content:flex-end; margin:0;">
                                <button value="ok">OK</button>
                                <button value="close">Close</button>
                            </menu>
                        </form>
                    `;
                    dlg.addEventListener('close', () => {
                            console.log(`Form ${formName} closed with returnValue=${dlg.returnValue}`);
                    });
                    document.body.appendChild(dlg);
                    try { dlg.showModal(); } catch { /* already open */ }
    }

    async hideForm(formName) {
                    console.log(`Hiding form: ${formName}`);
                    if (typeof document === 'undefined') return;
                    const dlg = document.querySelector(`dialog[data-form-name="${formName}"]`);
                    if (dlg && dlg.open) {
                            dlg.close('hide');
                    }
    }

    async changeElement(elementName, properties) {
        console.log(`Changing element ${elementName}:`, properties);
    }

    async inquireElement(elementName, property) {
        console.log(`Inquiring element ${elementName} property: ${property}`);
        return null;
    }

    /**
     * Security operations (placeholder)
     */
    async checkSecurity(resource, user, system) {
        console.log(`Checking security for ${resource}, user: ${user}, system: ${system}`);
        return { access: 'FULL', status: '$OK' };
    }

    /**
     * File operations (placeholder)
     */
    async fileInfo(filename) {
        console.log(`Getting file info for: ${filename}`);
        return { status: 0, size: 0, modified: new Date() };
    }

    /**
     * SQL execution (placeholder)
     */
    async sqlExec(database, command) {
        console.log(`Executing SQL on ${database}: ${command}`);
        return { status: '$OK', rows: 0 };
    }

    /**
     * REST GET (Node/browser compatible using fetch if available)
     */
    async restGet(url, headers = {}) {
        const fetchFn = (typeof fetch !== 'undefined') ? fetch : null;
        if (!fetchFn) {
            console.warn('fetch not available in this environment');
            return { ok: false, status: 0, data: null, headers: {} };
        }
        const res = await fetchFn(url, { headers });
        return await this._processRestResponse(res);
    }

    /**
     * REST POST
     */
    async restPost(url, body = {}, headers = {}) {
        const fetchFn = (typeof fetch !== 'undefined') ? fetch : null;
        if (!fetchFn) {
            console.warn('fetch not available in this environment');
            return { ok: false, status: 0, data: null, headers: {} };
        }
        const res = await fetchFn(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: (typeof body === 'string' ? body : JSON.stringify(body))
        });
        return await this._processRestResponse(res);
    }

    async _processRestResponse(res) {
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = text; }
        return {
            ok: res.ok,
            status: res.status,
            data: json,
            headers: (res.headers ? Object.fromEntries(res.headers.entries()) : {})
        };
    }

    /**
     * SUBSTR equivalent
     * @param {string} source
     * @param {number} start 1-based
     * @param {number} length number of characters
     */
    substr(source, start, length) {
        if (source == null) return '';
        const s = Math.max(1, start|0) - 1;
        const end = length != null ? s + (length|0) : source.length;
        return String(source).substring(s, end);
    }

    /**
     * WORD equivalent: split on whitespace and return index (1-based)
     * @param {string} source
     * @param {number} index 1-based word index
     */
    word(source, index) {
        if (source == null) return '';
        const parts = String(source).trim().split(/\s+/);
        const i = (index|0) - 1;
        return (i >= 0 && i < parts.length) ? parts[i] : '';
    }

    /**
     * Range helper for RangeExpression objects {start,end}
     */
    range(start, end) {
        return { start, end };
    }
}

// Helper functions for common Concept operations

/**
 * Convert Concept field declaration to JavaScript
 * @param {string} name - Field name
 * @param {object} properties - Field properties
 * @returns {object} Field descriptor
 */
export function createField(name, properties = {}) {
    return {
        name,
        type: properties.storage || 'any',
        initialValue: properties['initial-value'] || null,
        isStatic: properties.static !== undefined,
        isGlobal: properties.global !== undefined
    };
}

/**
 * Create a table descriptor
 * @param {string} name - Table name
 * @param {object} properties - Table properties
 * @returns {object} Table descriptor
 */
export function createTable(name, properties = {}) {
    return {
        name,
        dbTable: properties['db-table'],
        access: properties.access || 'READ',
        control: properties.control || 'Record',
        fields: []
    };
}

/**
 * Create a stream descriptor
 * @param {string} name - Stream name
 * @param {object} properties - Stream properties
 * @returns {object} Stream descriptor
 */
export function createStream(name, properties = {}) {
    return {
        name,
        title: properties.title || '',
        size: properties.size || [25, 80],
        pixelSize: properties['pixel-size'],
        position: properties.position
    };
}

/**
 * Create a form descriptor
 * @param {string} name - Form name
 * @param {object} properties - Form properties
 * @returns {object} Form descriptor
 */
export function createForm(name, properties = {}) {
    return {
        name,
        title: properties.title || '',
        position: properties.position || [0, 0],
        size: properties.size || [20, 60],
        ownerForm: properties['owner-form'],
        elements: []
    };
}

export default ConceptRuntime;