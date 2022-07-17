import {parseOfftext} from "../offtext/parser.ts"
import {validate_id,pushError,validate_z} from "./validator.ts";

export function onTag( tag,typedef){
	if (typedef.innertext && tag.w==0) {
		pushError.call(this,tag.name+' 缺少包夾文字',tag.offset);
	}
	if (typedef.id) validate_id.call(this,tag,typedef);

	return [];
}
function setupTypedef(typedef){
	const ctx=this;
	if (typedef.id=='unique_number') {
		typedef.idobj={};
	}
}
function execDirective(newtagname, attrs){
	const ctx=this;
	if (!newtagname) {
		console.log('system directive', attrs)
	} else {
		const typedef= Object.assign({},attrs);
		ctx.handlers[newtagname] = onTag.bind( ctx);
		ctx.typedefs[newtagname] = typedef;
		setupTypedef.call(ctx,typedef);
	}
}
export class OfftextContext {
	constructor(){
		this.errors=[];
		this.tagcount=0;
		this.handlers={};
		this.typedefs={};

		this.prevdepth=-1;
		this.prevzline=-1;
		this.zcount=0;
		this.toc=[];
	}
}
export function onAddOfftext(linetext:string, line:number, buffername:string){
	const ctx=this;
	ctx.line=line;
	ctx.buffername=buffername;
	const [text,tags]=parseOfftext(linetext);
	ctx.linetext=text;
	ctx.tagcount+=tags.length;
	for (let i=0;i<tags.length;i++) {
		const tag=tags[i];
		if (tag.name[0]==':') {
			execDirective.call(ctx,tag.name.slice(1),tag.attrs);
		} else {
			if (tag.name[0]=='z') {
				validate_z.call(ctx,tag)
			} else {
				const handler=ctx.handlers[tag.name];
				const typedef=ctx.typedefs[tag.name];
				handler && handler.call(ctx, tag, typedef);

			}
		}
	}
	return linetext;
}
