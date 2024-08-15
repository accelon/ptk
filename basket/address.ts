import {ILineRange} from '../linebase/index.ts';
import {bsearchNumber,unpackInt} from '../utils/index.ts';
import {ACTIONPAGESIZE} from "../lineview/interfaces.ts";
import {PTK_ACTION_FROMTILL,PTK_FROMTILL,FROMTILL} from '../offtext/index.ts'
import { parseOfftext } from '../offtext/parser.ts';
export const BRANCH_SEP = '.';
export interface IAddress {
	ptkname:string,
	action:string,
	from:number,
	till:number,
	highlightline:number,
}
export const parseAction=(action:string,objform=false):Array<any>|any=>{
	if (!action) return [];
	const branches=action.split(BRANCH_SEP);
	const out=Array<any>();
	for (let i=0;i<branches.length;i++) {
		const m1=branches[i].match(/^([a-z_\-]+)#([a-z\d_-]+)$/); // with # id
		const m2=branches[i].match(/^([a-z_\-]+)(\d+[a-z\d_-]+)$/);  // with number prefix mix id
		const m3=branches[i].match(/^([a-z_\-]+)(\d*)$/);  // with pure number id
		if (m1) {
			out.push([m1[1],m1[2]]);
		} else if (m2) {
			out.push([m2[1],m2[2]]);
		} else if (m3) {
			out.push([m3[1],m3[2]]);
		} else {
			const at=branches[i].indexOf('#');
			if (at>0) {
				out.push([branches[i].slice(0,at), branches[i].slice(at+1)]);
			} else {
				out.push(['ck',branches[i]]); //default			
			}
		}
	}
	if (objform) {
		const obj={};
		for (let i=0;i<out.length;i++) {
			const [tag,value]=out[i];
			obj[tag]=value;
		}
		return obj;
	} else {
		return out;
	}
}
export const sameAddress=(addr1,addr2)=>{
	if (typeof addr1=='string') addr1=parseAddress(addr1);
	if (typeof addr2=='string') addr2=parseAddress(addr2);
	if (!addr1||!addr2) return;
	return addr1.action==addr2.action && addr1.ptkname ==addr2.ptkname;
}
export const makeAddress=(ptkname='',action='',from=0,till=0,lineoff=0,choff=0)=>{
	if (typeof(ptkname)=='object'){
		const obj=ptkname;
		ptkname=obj.ptkname;
		action=obj.action||'';
		from=obj.from||0;
		till=obj.till||0;
		lineoff=obj.highlightline||obj.lineoff||0;
		choff=obj.choff||0;
	}
	let linechoff='';
	if (choff>0) {
		linechoff=lineoff+'-'+choff;
	} else if (lineoff>0) {
		linechoff=lineoff.toString();
	}
	return (ptkname?ptkname+':':'')+action+(from?'>'+from:'')+(till?'<'+till:'')+(linechoff?':'+linechoff:'');
}

export const parseAddress=(address:string):IAddress=>{
	let m0,ptkname='',action='', from='' ,till='', linechoff='' ; //left bound and right bound
	let m=address.match(PTK_ACTION_FROMTILL);
	if (m) {
		[m0, ptkname, action, from , till, linechoff ] = m;
	} else {
		m=address.match(PTK_FROMTILL);
		if (m) {
			[m0, ptkname, from,till ,linechoff] = m;
		} else {
			m=address.match(FROMTILL);
			if (m) [m0,from,till, linechoff] = m;	
			else return null;
		}
	}
	from=(from||'').slice(1);
	till=(till||'').slice(1);
	linechoff=(linechoff||'').slice(1);
	
	if (!from && !till && linechoff) {
		if (parseInt(linechoff)>ACTIONPAGESIZE) {
			from=parseInt(linechoff) - Math.floor(ACTIONPAGESIZE/2);
			till=from+ACTIONPAGESIZE;			
		}
	} 
	let choff=0;
	const at=linechoff.indexOf('-');
	if (~at) choff=parseInt(linechoff.slice(at+1));

	ptkname=ptkname||'';
	ptkname=ptkname.slice(0,ptkname.length-1); //remove :
	return {ptkname, action,from:Math.abs(parseInt(from))||0,till:Math.abs(parseInt(till))||0
		 , highlightline: linechoff?parseInt(linechoff):-1,
		  lineoff:parseInt(linechoff), choff
	};
}

export function rangeOfElementId(eleidarr:string[]){
	const out=Array<any>(), ptk=this;
	let from=0,to=ptk.header.eot;
	for (let i=0;i<eleidarr.length;i++) {
		const [ele,id]=eleidarr[i];
		if (ptk.defines[ele]) {
			const idtype=ptk.defines[ele].fields?.id;
			const _id=(idtype?.type=='number')?parseInt(id):id;
			const startfrom=bsearchNumber(ptk.defines[ele].linepos, from);
			const at=idtype.values.indexOf(_id,startfrom);
			const first=ptk.defines[ele].linepos[at] || ptk.defines[ele].linepos[0] ;
			let last=ptk.defines[ele].linepos[at+1] || ptk.header.eot ;
			if (first>=from && idtype.values[at]==_id) {
				from=first;
				if (last>to && to!==ptk.header.eot) last=to; //trim it
				else to=last;
				out.push([first,last]);	
			} else {
				return [];
				//out.push([0,0]);
			}
		} else {
			//try book id first, then artbulk id
			const at=ptk.defines.bk?.fields.id.values.indexOf(ele);
			const at2=at==-1?ptk.defines.ak?.fields.id.values.indexOf(ele):-1;

			if (i==0 && (~at||~at2) ) {
				const first=ptk.defines.bk.linepos[at]||ptk.defines.ak.linepos[at2];
				let last=ptk.defines.bk.linepos[at+1]||ptk.defines.ak.linepos[at2+1];
				if (!last) last=ptk.header.eot;
				out.push([first,last]);
				from=first;
			}
		}
	}
	// last should not cross section boundary
	const sstarts=ptk.header.sectionstarts;
	for (let i=0;i<out.length;i++) {
		let [first,last]=out[i];
		const at=bsearchNumber(sstarts,first+1);
		if (last>sstarts[at]) {
			out[i][1]=sstarts[at];
		}
	}

	return out;
}
export function rangeOfAddress(address:string|IAddress):ILineRange{
	let addr=address;
	if (typeof address=='string') {
		addr=parseAddress(address);
	}
	const {from,till,action,highlightline} = addr;
	const eleid=parseAction(action);
	const ranges=rangeOfElementId.call(this,eleid);
	if (ranges.length) {
		const [first,last]=ranges[ranges.length-1] ;
		return [first,last,from,till,highlightline];
	} else {
		const end=(till?till:from+1);
		return [0,0,from,till,highlightline ];//不存在
		 //數字型不知道終點，預設取一行
	}
}

export async function fetchAddress(address):Arrary<String>{
	const r=rangeOfAddress.call(this,address);
	if (!r|| r[0]==r[1]) return []
	await this.loadLines([r]);
	const lines=this.slice(r[0],r[1]);
	return lines;
}
//for grammar code
export async function fetchAddressExtra(address,ext='num'){
	const r=rangeOfAddress.call(this,address);
	if (!r|| r[0]==r[1]) return []
	const sectionname=this.getSectionName(r[0]);
	const parsectionname=sectionname.replace('off',ext);

	const start=this.getSectionStart(sectionname);
	const parstart=this.getSectionStart(parsectionname);
	if (~parstart) {
		const r0=r[0]-start + parstart;
		const r1=r[1]-start + parstart;
		await this.loadLines([r0,r1]);
		let lines=this.slice(r0,r1);
		if (ext=='num') {
			lines=lines.map( it=>unpackInt(it));
		}
		return lines;
	}
	return [];
}
//only display the first level
export function innertext(address:string):string{
	let addr=address;
	if (typeof address=='string') {
		addr=parseAddress(address);
	}
	const {action} = addr;
	const defines=this.defines;
	const eleidarr=parseAction(action);
	const out=[];
	for (let i=0;i<eleidarr.length;i++) {
		const [ele,id]=eleidarr[i];
		if (!defines[ele] || !defines[ele].fields.id) return '';
		const at=defines[ele].fields.id.values.indexOf(id);
		out.push(defines[ele]?.innertext?.get(at));
	}
	return out.join('/');
}

export function makeElementId(ele,id:string):string{
	return ele+( !isNaN(parseInt(id))?'':'#')+id;
}
export function makeChunkAddress(ck,lineoff=-1):string{
	const scrollto= lineoff?((lineoff>=5)?('>'+(lineoff-1)):'') +(lineoff?':'+lineoff:''):'';	

	return 'bk'+((parseInt(ck.bk?.id).toString()==ck.bk?.id)?'':'#')+ck.bk?.id
	 +'.ck'+(!isNaN(parseInt(ck.id))?'':'#')+ck.id
	 + scrollto;
}

export function tagAtAction(action:string):Array{
	//const [start,end]=this.rangeOfAddress(action);
	const arr=parseAction(action);
	const out=Array<any>();
	let parentlinepos=0;
	for (let i=0;i<arr.length;i++) {
		let [tagname,id]=arr[i];
		if (!this.defines[tagname]) continue;
		const taglinepos=this.defines[tagname].linepos;
		const tagidarr=this.defines[tagname].fields.id.values;
		const searchfrom=bsearchNumber(taglinepos,parentlinepos);
		if (typeof tagidarr[0]=='number') id=parseInt(id);
		let at=tagidarr.indexOf(id, searchfrom);
		let rel=at-searchfrom;
		if (at<0) at=0;
		if (rel<0) rel=0;
		out.push({tagname,at,rel});
		parentlinepos=taglinepos[at];
	}
	return out;
}

export async function fetchTag(ele:string,id:string) {
	const range=rangeOfElementId.call(this,[[ele,id]]);
	if (range.length) {
		const [start,end]=range[0];
		await this.loadLines([start,start+1])
		const line=this.getLine(start);
		const [text,tags]=parseOfftext(line);
		for (let i=0;i<tags.length;i++) {
			if (tags[i].name==ele && tags[i].attrs.id==id) {
				return tags[i]
			}
		}
	}
	return null;
}

export function tagInRange(ele:string,from:number=0,to:number=0){
	if (!to) {
		to=this.header.eot;
	}
	const linepos=this.defines[ele]?.linepos;
	if (!linepos) return [];
	const at=bsearchNumber(linepos, from);
	let at2=bsearchNumber(linepos, to);
	if (linepos[at2]>to) at2--;
	return [at,at2];
}
/* count all tag inside address */
export function tagCount(address:string,tag:string){
	const [s,e]=this.rangeOfAddress(address);
    const [first,last]=this.tagInRange(tag,s,e);
	return last-first
}
export function nearestTag(line:number,tag:any, fieldname=''){
	if (typeof tag=='string') tag=this.defines[tag];
	if (!tag) return -1;
	const linepos=tag.linepos;
	if (!linepos) return null;
	const at=bsearchNumber(linepos,line)-1;
	const adjustat=(line<linepos[linepos.length-1])?at :at+1;
	if (!fieldname) return adjustat;
	else return tag.fields[fieldname].values[adjustat];
}
export function findClosestTag(typedef, key, value, from=0){
	let at=typedef.fields[key].values.indexOf(value);
	while (at>=0 && typedef.linepos[at]<from) {
		at=typedef.fields[key].values.indexOf(value, at+1);
	}
	return at;
}
export function validId(tagname:string,id:any):boolean {
	const V=this.defines[tagname]?.fields;
	if (!V || !V.id) return false;
	if (V.id.type=='number' && typeof id !=='number') id=parseInt(id);
	return !!~V.id.values.indexOf(id);
}
export function queryTagFields(tagname:string,q:string,fields:Array<string>=[]):number[]{
	const tag=this.defines[tagname];
	if (!tag) return [];
	let [qfield,qvalue] =q.split("=");
	if (!qvalue) {
		qvalue=qfield;
		qfield="id";
	}
	const atarr=Array<number>();
	const tagfield=tag.fields[qfield];
	if (!tagfield) return [];
	let at=tagfield.values.indexOf(qvalue);
    while (~at) {
		atarr.push(at);
		at=tagfield.values.indexOf(qvalue,at+1)
    }
	return this.getTagFields(tagname,atarr,fields);
}
export function getTagFields(tagname:string,atarr:number[]|null=null,fields:Array<string>|null=null):any[]{
	const tag=this.defines[tagname];
	if (!tag) return [];	
	const res=Array<any>();

	const emitFields=(at:number)=>{
		const out={at};
		if (fields) {
			for(let i=0;i<fields.length;i++) {
				const f=tag.fields[fields[i]]
				if (f) out[fields[i]]=f.values[at];
			}	
		} else { //return all fields
			for (let field in tag.fields) {
				out[field]=tag.fields[field].values[at];
			}
			out["innertext"]=tag.getInnertext(at);
		}
		return out;
	}
	if (! atarr) {
		for (let i=0;i<tag.count;i++) {
			res.push(emitFields(i));
		}
	} else {
		for(let i=0;i<atarr.length;i++) {
			res.push(emitFields(atarr[i]));
		}
	}
	return res;
}
export function alignable(fn:string){
	const out=Array<string>();
	if (!fn) return out;

	//only off can align with other off
	if (!fn.endsWith(".off"))fn+=".off"
	const at=this.header.sectionnames.indexOf(fn);
	if (!~at) return out;
	const H=this.header;
	const length=H.sectionstarts[at+1]-H.sectionstarts[at]
	for (let i=0;i<H.sectionnames.length;i++) {
		const n=H.sectionnames[i];
		if (i==at) continue;
		const len=H.sectionstarts[i+1]-H.sectionstarts[i]
		if (len==length) {
			out.push(H.sectionnames[i].replace(".off",""))
		}
	}
	return out;
}