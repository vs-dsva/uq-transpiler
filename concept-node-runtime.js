// Node-specific Concept Runtime now extends ConceptBaseRuntime
import { ConceptBaseRuntime } from './concept-base-runtime.js';

export class ConceptNodeRuntime extends ConceptBaseRuntime {
	async call(functionName, ...args) {
		switch (functionName) {
			case 'assign': return this.assign(...args);
			case 'find': return this.find(...args);
			case 'insert': return this.insert(...args);
			case 'update': return this.update(...args);
			case 'delete': return this.delete(...args);
			case 'restGet': {
				const [url, maybeField] = args;
				const result = await this.restGet(url);
				if (maybeField && this.currentApplication?.fields) {
					this.currentApplication.fields[maybeField] = result.data;
				}
				return result;
			}
			case 'restPost': {
				const [url, body, maybeField] = args;
				const result = await this.restPost(url, body || {});
				if (maybeField && this.currentApplication?.fields) {
					this.currentApplication.fields[maybeField] = result.data;
				}
				return result;
			}
			default:
				return await super.call(functionName, ...args);
		}
	}

	async find(tableName, criteria = {}) { console.log(`Finding in table ${tableName}:`, criteria); return { status: '$OK', records: [] }; }
	async insert(tableName, record = {}) { console.log(`Inserting into table ${tableName}:`, record); return { status: '$OK' }; }
	async update(tableName, criteria = {}, values = {}) { console.log(`Updating table ${tableName}:`, criteria, values); return { status: '$OK' }; }
	async delete(tableName, criteria = {}) { console.log(`Deleting from table ${tableName}:`, criteria); return { status: '$OK' }; }

}

export default ConceptNodeRuntime;