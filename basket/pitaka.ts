import {LineBase,Column} from '../linebase/index.ts';
import {Compiler,sourceType} from '../compiler/index.ts'
import {parseOfftext} from '../offtext/index.ts'
import {StringArray,unpackIntDelta,LEMMA_DELIMETER} from '../utils/index.ts';
import {rangeOfAddress} from './address.ts';
export class Pitaka extends LineBase {
	constructor(opts){
		super(opts);
		this.defines={};
		this.primarykeys={};
		this.columns={};
		this.textStart=0;
		this.rangeOfAddress=rangeOfAddress;
	}
	async init(){
		const compiler=new Compiler()
		compiler.compileBuffer(this.payload, this.name);
		this.defines=compiler.typedefs;

		const jobs=[],ranges=[];
		for (let i=0;i<this.header.preload.length;i++) {
			ranges.push(this.sectionRange(this.header.preload[i]));
		}
		for (let n in this.defines) {
			if (this.defines[n].validators.preload) {
				ranges.push(this.sectionRange('^'+n));
			}
		}
		//load together , avoid duplicate jobs
		await this.loadLines(ranges);

		for (let i=0;i<this.header.preload.length;i++) {
			const section=this.getSection(this.header.preload[i]);
			this.deserialize(section);
		}
		for (let n in this.defines) { //see compiler/typedef.ts serialize()
			if (this.defines[n].validators.preload) {
				const section=this.getSection('^'+n);
				this.defines[n].deserialize(section);
			}
		}

		for (let n in this.defines) {
			for (let attr in this.defines[n].validators) {
				const A=this.defines[n].validators[attr];
				if (A.type=='keys' && A.foreign && this.primarykeys[A.foreign]) {
					A.keys=this.primarykeys[A.foreign];
				}
			}
		}

		this.textStart=this.sectionRange('','txt')[0];
	}
	deserialize(section) {
		if (!section.length) return;
		const firstline=section[0];
		const [srctype]=sourceType(firstline);
		if (srctype=='tsv') {
			const column=new Column();
			column.deserialize(section);
			this.columns[column.name]=column;
			this.primarykeys[column.name]=column.keys;
		}
	}
	validId(tagname:string,id:any):boolean {
		const V=this.defines[tagname].validators;
		if (!V.id) return false;
		if (V.id.type=='number' && typeof id !=='number') id=parseInt(id)
		return ~this.defines[tagname].validators.id.values.indexOf(id);
	}
	rowOf(rowname:string,idx:string) {
		const column=this.columns[rowname];
		const out=[];
		for (let i=0;i<column.fieldnames.length;i++) {
			const type=column.validators[i].type;
			const name=column.fieldnames[i];
			out.push( { name, type, value:column.fieldvalues[i][idx] } ) ;
		}
		return out;
	}
	columnField(name:string, field:string, idx:number) {
		const column=this.columns[name];
		const at=column.fieldnames.indexOf(field);
		return column.fieldvalues[at][idx];
	}
	typedefOf(tagname:string) {
		return this.defines[tagname].validators;
	}

}