import {parseOfftextLine} from "../offtext/parser.ts"
import {JSONParse} from "../utils/index.ts"

function pushError(msg,offset=0,prev=0){
	this.errors.push([this.buffername,this.line,offset,msg,prev]);
}
export function onTag( tag,typedef){
	if (typedef.innerText && tag.w==0) {
		pushError.call(this,tag.name+' missing innerText',tag.offset);
	}
	if (typedef.id=='unique_number') {
		if (!tag.attrs.id) {
			pushError.call(this,'missing id',tag.offset);
		} else  {
			const prev=typedef.idobj[tag.attrs.id];
			if (prev) pushError.call(this,'duplicate id '+tag.attrs.id, tag.offset, prev);
		}
		typedef.idobj[tag.attrs.id]=this.line;
	}	

	return [];
}
function setupTypedef(typedef){
	const ctx=this;
	if (typedef.id=='unique_number') {
		typedef.idobj={};
	}
}
function execDirective(directive, typedef){
	const ctx=this;
	if (directive=='label') {
		ctx.handlers[typedef.name] = onTag.bind( ctx);
		ctx.typedefs[typedef.name] = typedef;
		setupTypedef.call(ctx,typedef);

		return [];
	} else {
		return [ ctx.buffername,ctx.line,0, 'unknown directive '+directive];
	}
}
export function onAddOfftextLine(linetext:string, line:number, buffername:string){
	const ctx=this;
	ctx.line=line;
	ctx.buffername=buffername;
	if (linetext[0]=='#') {
		const at=linetext.indexOf(' ');
		const directive=linetext.slice(1,at>0?at:linetext.length);
		try {
			const typedef=at>0?JSONParse(linetext.slice(at+1)):{};
			ctx.errors.push( ...execDirective.call(ctx,directive, typedef));
		} catch(e) {
			ctx.errors.push([buffername,line,0,e])
		}
	} else {
		const [text,tags]=parseOfftextLine(linetext);
		ctx.tagcount+=tags.length;
		for (let i=0;i<tags.length;i++) {
			const tag=tags[i];
			const handler=ctx.handlers[tag.name];
			const typedef=ctx.typedefs[tag.name];
			handler && ctx.errors.push(...handler.call(ctx, tag, typedef));
		}
		return linetext;
	}
}
