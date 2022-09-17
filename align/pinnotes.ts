import { pinPos } from "./pinpos.js";

export const pinNotes=(lines,notes,opts={})=>{
    const out=[];
    const NoteIdx={};
    const pat=opts.pat||/⚓(\d+) ?/g;
    notes.forEach(note=>NoteIdx[note.id]=note);
    for (let i=0;i<lines.length;i++) {
        let line=lines[i],accwidth=0;
        const nline=line.replace(pat,(m,nid,off)=>{
            const note=NoteIdx[nid];
            if (note) {
                note.y=i;    
                note.pin=off-accwidth; //update the position to be pinned (foot note marker removed)
                NoteIdx[nid]=note;
            } else {
                console.log('note not found',nid)
            }
            accwidth+=m.length;
            return '';
        })
        if (nline!==line) lines[i]=nline;
    }

    for (let nid in notes) {
        const note=notes[nid];
        if (typeof note.y=='undefined') continue;
        const pin=pinPos(lines[note.y], note.pin, {wholeword:true,backward:true,offtext:true});
        const item=[note.y,pin, note.val.replace(/\n/g,'\\n')]; //bb has multi line notes 
        if (!opts.removeId) item.push(note.id);
        out.push(item)
    }
    return out;
}

export default {pinNotes};