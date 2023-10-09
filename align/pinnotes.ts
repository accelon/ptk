import { pinPos } from "./pinpos.js";

export const pinNotes=(lines,notes,opts={})=>{
    const out=[];
    const NoteIdx={};
    const pat=opts.pat||/⚓(\d+)( ?)/g;
    const keepmarker=opts.keepmarker;
    console.log(keepmarker,'keepmarker')
    notes.forEach(note=>NoteIdx[note.id]=note);
    let nnote=0;
    for (let i=0;i<lines.length;i++) {
        let line=lines[i],accwidth=0;
        const nline=line.replace(pat,(m,nid,space,off)=>{
            const note=NoteIdx[nid];
            if (note) {
                note.y=i;    
                note.pin=off-accwidth; //update the position to be pinned (foot note marker removed)
                NoteIdx[nid]=note;
            } else {
                console.log('note not found',nid)
            }
            accwidth+=m.length;
            nnote++;
            return keepmarker?('^f'+nnote+space) :'';
        })
        if (nline!==line) lines[i]=nline;
    }

    nnote=0;
    for (let nid in notes) {
        const note=notes[nid];
        nnote++;
        if (typeof note.y=='undefined') continue;
        let item=[];
        if (keepmarker) {
            item=nnote+'\t'+note.val.replace(/\n/g,'\\n');
        } else {
            const pin=pinPos(lines[note.y], note.pin, {wholeword:true,backward:true,offtext:true});
            item=[note.y,pin, note.val.replace(/\n/g,'\\n')]; //bb has multi line notes 
            if (!opts.removeId) item.push(note.id);
        }

        out.push(item)
    }
    return out;
}
export const stripLinesNote=(lines,notes,marker='⚓')=>{
    const regex=new RegExp(marker+'([0-9]+)','g');

    lines=lines.map((line,y)=>{
        let accwidth=0;
        let nline=line.replace(regex,(m,m1,offset)=>{
            const note=notes[m1];
            if (note) {
                note[0]=y;
                note[1]=offset-accwidth;    
            } else {
                /* skip note in the first line , difficult to pin */
                if (y) console.log('note not found',m1,y,line)
            }
            accwidth+=m.length;
            return '';
        })
        return nline;
    })
    return lines;
}
