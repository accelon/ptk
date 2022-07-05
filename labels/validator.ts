export function pushError(msg,offset=0,prev=0){
	this.errors.push({filename:this.buffername,line:this.line,offset,msg,prev});
}

export function validate_id(tag,typedef){
	const type=typedef.type;
	const id=tag.attrs.id;
	if (!id) pushError.call(this,'missing id',tag.offset);
	if (typedef.idtype=='number' && isNaN(parseInt(id))) {
		pushError.call(this,'not a number '+id, tag.offset);
	}
	if (typedef.unique) {
		const prev=typedef.idobj[id];
		if (prev) pushError.call(this,'duplicate id '+id, tag.offset, prev);
		typedef.idobj[tag.attrs.id]=this.line;
	}

}
export function validate_z(tag){
  const depth=parseInt(tag.name.slice(1,2),36)-10;
  if (!(depth==this.prevdepth|| depth==this.prevdepth+1 || depth<this.prevdepth)) {
    pushError.call(this,'depth '+this.prevdepth+'+1!='+depth, tag.offset, this.prevzline);
  }
  const text=this.linetext.slice(tag.x,tag.x+tag.w);
  const line=this.line;
  this.toc.push({depth,text,key:this.zcount, line});
  this.zcount++;
  this.prevzline=line;
  this.prevdepth=depth;
}
export const validators={id:validate_id};