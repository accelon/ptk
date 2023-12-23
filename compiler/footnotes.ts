import { bsearchNumber } from '../utils/bsearch.ts';
import { alphabetically } from '../utils/sortedarray.ts';
import {arraydiff} from '../utils/array.ts'
/*以文字連結注釋
^ck5
^f<@釋目>(顯示文字)     word 顯

tsv footnote=ck
5.釋目  解釋

兩種不能混用
*/
const groupnotes=notekeys=>{
    const Notes={};
    for (let i=0;i<notekeys.length;i++) {
        const m=notekeys[i].match(/(\d+)\.(.+)/);
        if (!m) throw "invalid note "+notekeys[i]+" filename:"+filename;
        if (!Notes[m[1]]) Notes[m[1]]={};
        if (Notes[m[1]][m[2]]) {
            throw "repeat note "+notekeys[i];
        }
        Notes[m[1]][m[2]]=0;
    }
    return Notes;
}
//檢查每個內文及 tsv 是否能對映
const mapFootnoteId=(tag,ftag,Notes,tagname)=>{
    for (let i=0;i<tag.fields.id.values.length;i++) {
        const groupid=tag.fields.id.values[i];
        const from=tag.linepos[i];
        const to=tag.linepos[i+1];
        const start=bsearchNumber(ftag.linepos,from);
        let end=bsearchNumber(ftag.linepos,to);
        if (!end||ftag.linepos[end]<to) end=ftag.linepos.length //fix last item

        const offtextfootnote=ftag.innertext.slice(start,end);
        for (let j=start;j<end;j++) {
            if (ftag.fields.ln && ftag.fields.ln.values[j]) {//has alias replace it 
                offtextfootnote[ j-start]=ftag.fields.ln.values[j];
            }
        }
        for (let j=0;j<offtextfootnote.length;j++) {
            const f=offtextfootnote[j];
            if (!Notes[groupid]) {
                console.log('no such id',groupid)
                continue;
            }
            if (Notes[groupid].hasOwnProperty(f)) Notes[groupid][f]++;
            else {
                console.log(tagname,groupid,'not found',f,j)
            }
        }
        // console.log(groupid,start,end,offtextfootnote);
    }   
}
export function checkFootnoteInnertext(attrs:Object,notekeys,filename){
    //group notekeys
    const Notes=groupnotes(notekeys);
    const tagname=attrs.footnote||'bk';
    const tag=this.typedefs[tagname];
    const ftag=this.typedefs.i;
    mapFootnoteId(tag,ftag,Notes,tagname);
}

/*以id連結注釋
^f11    
tsv footnote=bk
11   解釋
*/

export function checkFootnote(attrs:Object,notekeys,filename){
    if (!attrs.footnote) return;
    const tagname=attrs.footnote||'bk';//default name same with bk
    const tag=this.typedefs[tagname];
    const ftag=this.typedefs.f;
    if (!tag) {
        console.log('unknown tag',tag,'checkfootnote');
        return;
    }
    if (!ftag && this.typedefs.i) {//try inline footnote
        return checkFootnoteInnertext.call(this,attrs,notekeys,filename);
    }
    if (!ftag ) { 
        console.log('no f tag in source');        
    }
    //note tsv name == bk name
    const at=tag.fields.id.values.indexOf(attrs.name);
    const from=tag.linepos[at];
    const to=tag.linepos[at+1]||this.compiledLine; //assuming foot note just after off

    const start=bsearchNumber(ftag.linepos,from);
    let end=bsearchNumber(ftag.linepos,to);
    if (!end||ftag.linepos[end]<to) end=ftag.linepos.length //fix last item
    
    if (tagname=='bk') { //id is simple number
        const offtextfootnote=ftag.fields.id.values.slice(start,end).sort(alphabetically);
        if (offtextfootnote.join()!==notekeys.join()) {
            console.log(filename,'footnote missing match',arraydiff(notekeys,offtextfootnote),notekeys.join())
        }
    } else { //id prefix with chunk or other tag
        const Notes=groupnotes(notekeys);
        mapFootnoteId(tag,ftag,Notes,tagname);
    }
}