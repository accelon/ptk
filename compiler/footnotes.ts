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
export function checkInlineFootnote(attrs:Object,notekeys){
    //group notekeys
    const Notes=groupnotes(notekeys);
    const tagname=attrs.footnote||'bk';
    const tag=this.typedefs[tagname];
    const itag=this.typedefs.i;
    for (let i=0;i<tag.fields.id.values.length;i++) {
        const groupid=tag.fields.id.values[i];
        const from=tag.linepos[i];
        const to=tag.linepos[i+1];
        
        const start=bsearchNumber(itag.linepos,from);
        let end=bsearchNumber(itag.linepos,to);
        if (itag.linepos[start]<from) continue;
        
        if (!end||itag.linepos[end]<to) end=itag.linepos.length //fix last item

        const offtextfootnote=itag.innertext.slice(start,end);
        for (let j=start;j<end;j++) {
            if (itag.fields.ln && itag.fields.ln.values[j]) {//has alias replace it 
                offtextfootnote[ j-start]=itag.fields.ln.values[j];
            }
        }
        for (let j=0;j<offtextfootnote.length;j++) {
            let gid=groupid; // use local chunk id if not specified
            let  f=offtextfootnote[j];
            let at=f.indexOf('.');
            if (at>0) { //specified
                gid=f.slice(0,at);
                f=f.slice(at+1);
                if (!f){// use innertext if only specified chunk id, e.g ^i10<@1.>(半自耕農)
                    f=itag.innertext[j+start];
                }
            }
            if (!Notes[gid]) {
                console.log('no such id',gid, f, tagname,tag.fields.id.values)
                continue;
            }
            if (Notes[gid].hasOwnProperty(f)) {
                Notes[gid][f]++;
            }  else {
                console.log(tagname+'#'+groupid,'not found',offtextfootnote[j],j)
            }
        }
        // console.log(groupid,start,end,offtextfootnote);
    }   
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
    if (this.typedefs.i) {//try inline footnote
        checkInlineFootnote.call(this,attrs,notekeys);
    }
    if (!ftag) { 
        console.log('no f tag in source');        
        return ;
    }
    if (tagname=='bk') { //id is simple number, cannot mix with i
        //note tsv name == bk name
        const at=tag.fields.id.values.indexOf(attrs.name);
        const from=tag.linepos[at];
        const to=tag.linepos[at+1]||this.compiledLine; //assuming foot note just after off

        const start=bsearchNumber(ftag.linepos,from);
        let end=bsearchNumber(ftag.linepos,to);
        if (ftag.linepos[start]>from) {
            if (!end||ftag.linepos[end]<to) end=ftag.linepos.length //fix last item

            const offtextfootnote=ftag.fields.id.values.slice(start,end).sort(alphabetically);
            if (offtextfootnote.join()!==notekeys.join()) {
                console.log(filename,'footnote missing match',arraydiff(notekeys,offtextfootnote),notekeys.join())
            }    
        }
    } else { //id prefix with chunk or other tag
        const Notes=groupnotes(notekeys);

        for (let key in Notes) {
            const notes=Notes[key];
            const at=tag.fields.id.values.indexOf(key);
            const from=tag.linepos[at];
            const to=tag.linepos[at+1]||this.compiledLine; //assuming foot note just after off
    
            const start=bsearchNumber(ftag.linepos,from);
            let end=bsearchNumber(ftag.linepos,to);

            const offtextfootnote=ftag.fields.id.values.slice(start,end).sort(alphabetically);
            
            for (let i=0;i<offtextfootnote.length;i++) {
                const id=offtextfootnote[i];
                if (!notes.hasOwnProperty(id)) {
                    console.log('no note for ^f'+id, 'in ^'+tagname+key);
                } else notes[id]++;
            }
        }
    }
}