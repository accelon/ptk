import {sortObj} from '../utils/sortedarray.js'
export class Lexicon {
	constructor (json) {
		this.entries={};
		this.packed=!!json;
		if (json) {
			this.entries=json;
		}
	}
	addRawDef(entry,def) {
		if (this.packed) throw "already packed";
		if (!this.entries[entry]) this.entries[entry]={};
		if (!this.entries[entry][def]) this.entries[entry][def]=0;
		this.entries[entry][def]++;
	}
	getDefs(entry) {
		return this.entries[entry]
	}
	contains(entry) {
		return !!this.entries[entry];
	}
	packRaw() {
		this.packed=true;
		for (let entry in this.entries) {
			const arr=sortObj(this.entries[entry]);
			this.entries[entry]=arr.map(it=>it[0]);//drop the count
		}
	}
}