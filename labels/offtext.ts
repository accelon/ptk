import {parseOfftextLine} from "../offtext/parser.ts"
import {validate_id,pushError,validate_z} from "./validator.ts";

export function onTag( tag,typedef){
	if (typedef.innertext && tag.w==0) {
		pushError.call(this,tag.name+' missing innerText',tag.offset);
	}
	if (typedef.idtype) validate_id.call(this,tag,typedef);

	return [];
}
function setupTypedef(typedef){
	const ctx=this;
	if (typedef.unique) {
		typedef.idobj={};
	}
}
function execDirective(newtagname, typedef){
	const ctx=this;
	if (!newtagname) {
		console.log('system directive')
	} else {
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
export function onAddOfftextLine(linetext:string, line:number, buffername:string){
	const ctx=this;
	ctx.line=line;
	ctx.buffername=buffername;
	const [text,tags]=parseOfftextLine(linetext);
	ctx.linetext=text;
	ctx.tagcount+=tags.length;
	for (let i=0;i<tags.length;i++) {
		const tag=tags[i];
		if (tag.name[0]=='_') {
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
