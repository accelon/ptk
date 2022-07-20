import {LineBase} from '../linebase/index.ts';
import {Compiler,sourceType} from '../compiler/index.ts'
import {parseOfftext} from '../offtext/index.ts'
import {StringArray,LEMMA_DELIMETER} from '../utils/index.ts';
export class Pitaka extends LineBase {
	constructor(opts){
		super(opts);
		this.defines={};
		this.primarykeys={};
	}
	async init(){
		const compiler=new Compiler()
		compiler.compileBuffer(this.payload, this.name);
		this.defines=compiler.typedefs;

		const jobs=[];
		for (let i=0;i<this.header.preload.length;i++) {
			jobs.push(this.preloadSection(this.header.preload[i]));
		}
		await Promise.all(jobs);

		for (let i=0;i<this.header.preload.length;i++) {
			const section=this.getSection(this.header.preload[i]);
			this.deserialize(section)
		}

		for (let n in this.defines) {
			for (let attr in this.defines[n].validators) {
				const A=this.defines[n].validators[attr];
				if (A.type=='keys' && A.foreign && this.primarykeys[A.foreign]) {
					A.keys=this.primarykeys[A.foreign]
				}
			}
		}

		//deserialize the tabular section
		// console.log(this.primarykeys)
	}
	deserialize(section) {
		if (!section.length) return;
		const firstline=section[0];
		const [srctype]=sourceType(firstline);
		if (srctype=='tsv') {
			const [text,tags]=parseOfftext(firstline);
			const attrs=tags[0].attrs;
			const typedef=text.split('\t') ; // typdef of each field , except field 0

			this.primarykeys[attrs.name]=new StringArray(section[1],{delimiter:LEMMA_DELIMETER});
		}
	}
	typedefOf(tagname:string) {
		return this.defines[tagname].validators;
	}

}