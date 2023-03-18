export function getCaption(at:Number){
    const chunktag=this.defines.ck;
    let caption=chunktag?.innertext.get(at);
    const id=chunktag?.fields?.id?.values[at];
    const onChunkCaption=this.template.onChunkCaption;
    if (!caption) {
        caption=this.columns[chunktag?.column]?.keys?.get(at);		
        if (!caption && onChunkCaption) caption=onChunkCaption(id);
    }
    return caption;
}
export function caption(at:Number){
    //return onChunkCaption?caption:id+'.'+caption;
    let caption=this.getCaption(at);
    let depth=0;
    while (caption && caption.endsWith('-')) {
        depth++;
        caption=caption.slice(0,caption.length-1)
    }
    let at2=at, parents=[] ;
    while (at2>0 && depth) {
        at2--;
        const par=this.getCaption(at2).split(/[- ]+/);
        const pdepth=par.length;
        while (!par[par.length-1]) par.pop();
        if (pdepth-1>depth ) { //比目前的深，無法取得父節點

        } else if (par.length>1 || pdepth==1){
            while (par.length&&depth) {
                parents.unshift('-'+par.pop());
                depth--;
            }
        }
    }
    return caption+ parents.join('');
}
export function nearestChunk( line:Number) {
    const chunktag=this.defines.ck;
    const at=this.nearestTag(line,chunktag)-1;
    return this.getChunk(at);
}
export function getChunk(at:Number){
    const chunktag=this.defines.ck;
    const booktag=this.defines.bk;
    if (at<0) return null;
    if (at>=chunktag.fields.id.values.length) return null;

    const line=chunktag.linepos[at];
    const bkat=this.nearestTag(line,booktag) - 1;
    const bkid=booktag.fields.id.values[bkat];

    const id=chunktag.fields.id.values[at];
    const innertext=chunktag.innertext.get(at);
    const caption=this.caption(at);
    const depth=chunktag.depths?chunktag.depths[at]||1:1;
    const bkheading= booktag?.fields.heading?.values[bkat] || booktag?.innertext?.get(bkat)
    return {bkid ,caption, at:at+1, id ,
        bk:{id:bkid, caption: booktag?.innertext.get(bkat)
        ,heading:bkheading },
        depth,
        line:chunktag.linepos[at],
        innertext}
}

const resetBy=(ptk,tagname)=>{
    for (let t in ptk.defines) {
        const tag=ptk.defines[t];
        if (tag.attrs.reset?.split(',').indexOf(tagname)>-1) {
            return t;
        }
    }
    return null;
}
export function ancestorChunks(at:Number,start:Number){
    const chunktag=this.defines.ck;
    if (!chunktag.depths) return [];
    let line=chunktag.linepos[at];
    let depth=chunktag.depths[at];
    const out=[];
    while (line>start && depth>1) {
        if ( depth> chunktag.depths[at] ){
            out.unshift(at);
            depth--;
        }
        at--;
        line=chunktag.linepos[at];
    }
    return out;
}
export function prevsiblingChunk(at:Number, start:Number){
    let p=at-1;
    const chunktag=this.defines.ck;
    if (!chunktag.depths&&at>0) return at-1;
    while (p>0) {
        if (chunktag.depths[p]==chunktag.depths[at] ) return p;
        else if (chunktag.depths[p]<chunktag.depths[at]) break;
        p--;
        if (start<chunktag.linepos[p]) break;
    }
    return -1;
}
export function nextsiblingChunk(at:Number, end:Number) {
    let p=at+1;
    const chunktag=this.defines.ck;
    if (!chunktag.depths&&at<end) return at+1 ;

    while (p<chunktag.linepos.length) {
        if (chunktag.depths[p]==chunktag.depths[at] ) return p;
        else if (chunktag.depths[p]<chunktag.depths[at]) break;
        p++;
        if (chunktag.linepos[p]>=end) break;
    }
    return -1;
}
export function firstChildChunk(at:Number) {
    const chunktag=this.defines.ck
    if (!chunktag.depths) return -1;

    if (chunktag.depths[at+1]==chunktag.depths[at]+1 ) return at+1;
    return -1;
}
export function neighborChunks(at:Number){
    const ptk=this;
    // const chunktag=this.defines.ck
    // const ck=this.nearestChunk( chunktag.linepos[at] );   
    // at=ck.at-1;
    const resettag=this.defines[resetBy(this,'ck')];
    const nearest=resettag?this.nearestTag(at,resettag) - 1:0;
    const start= resettag? resettag.linepos[nearest]:0;
    const end=resettag? (resettag.linepos[nearest+1]|| ptk.header.eot): ptk.header.eot;
    const ancestors=ancestorChunks.call(this,at,start);
    const out=ancestors.map(it=>ptk.getChunk.call(ptk,it));
    const prev=prevsiblingChunk.call(this,at);
    if (prev>-1 && (!ancestors.length||ancestors[ancestors.length-1]<prev) ) {
        out.push( this.getChunk(prev) );
    } 
    out.push(this.getChunk(at));
    //add bookname
    const first=firstChildChunk.call(this,at, start);
    if (first>-1) out.push(this.getChunk(first));
    const next=nextsiblingChunk.call(this,at, end);
    if (next>-1) out.push( this.getChunk(next) );
    return out;
}