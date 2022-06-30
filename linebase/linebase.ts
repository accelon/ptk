interface ILineBase {
	protected _data:string[];
	pages:number[];
	protected header:Map;
	private _accsize:number;
	private pagesize:number;
	sealed:boolean;
}
export class LineBase {
	constructor (opts={}) {
		this._data=[];
		this._accsize=0;
		this.pagesize=opts.pagesize||1024*64;
		this.pages=[];
		this.header={};
	}
	private newPage(){
		this.pages.push(this._data.length);
		this._accsize=0;
	}
	seal() {
		this.newPage();
		this.sealed=true;
	}
	addLine(line:string) {
		if (this.sealed) throw ('sealed');
		this._accsize+=line.length;
		if (this._accsize>this.pagesize) this.newPage();
		this._data.push(line);
	}
	addLines(buf:string){
		const lines=buf.split(/\r?\n/);
		this.newPage();
		for (let i=0;i<lines.length;i++) {
			append(lines[i]);
		}
	}
}

