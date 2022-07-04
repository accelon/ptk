let prevdepth,prev;
let count=0;
const out=[];
export const init=()=>{
	prevdepth=-1;
	count=0;
	out.length=0;
}

export const check=(tag,errors:string[])=>{
  const depth=parseInt(tag.name.slice(1,2),36)-10;
  if (!(depth==prevdepth|| depth==prevdepth+1 || depth<prevdepth)) {
    errors.push({line:tag.line, prev ,text:'depth '+prevdepth+'+1!='+depth });
  }
  out.push({depth,text:tag.text,key:count, line:tag.line});
  count++;
  prev=tag.line;
  prevdepth=depth;
}

export const finalize=()=>{
  return out;
}

export default {init, finalize, check}
