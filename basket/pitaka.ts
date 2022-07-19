import {LineBase} from '../linebase/index.ts';
import {Compiler} from '../compiler/index.ts'
export class Pitaka extends LineBase {
	constructor(opts){
		super(opts);
		this.defines={};
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
			console.log ( this.getSection(this.header.preload[i]).length)
		}		
		//deserialize the tabular section

	}
	typedefOf(tagname:string) {
		return this.defines[tagname].validators;
	}

}