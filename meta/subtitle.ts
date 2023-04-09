import {addTemplate} from '../compiler/template.ts'
import {parseOfftext} from "../offtext/parser.ts"

const parseTimeStamp=str=>{ // see ptk/cli/subtitle.js
    let [m0,start,delta]=str.match(/(\d+)\-(\d+)/);
    start=parseInt(start) / 10;
    const end= parseInt(delta)/10 + start;
    return [start,end]
}
const mpegfileOfID=(id)=>{
    const filename=(id.endsWith('.mp3')||id.endsWith('.mp4'))?id:id+'.mp4';
    return filename;
}
const subtitleOfID=async (ptk,id)=>{
    const addr=await ptk.fetchAddress('mpeg#'+id);
    const blob=new Blob([genWebVTT(addr)],{type:'plain/text'});
    return URL.createObjectURL(blob);
}
const formatSeconds=sec=>{
    const hh=Math.floor(sec/3600).toString();
    const mm=Math.floor( (sec - hh*3600) /60).toString();
    const ss=Math.floor(((sec-hh*3600-mm*60) % 60)).toString();
    return hh.padStart(2,'0')+':'+mm.padStart(2,'0')+':'+ss.padStart(2,'0')+  
     (sec - Math.floor(sec)).toFixed(3).slice(1) ;
}
const genWebVTT=lines=>{
    const out=['WEBVTT','',''];
    for (let i=0;i<lines.length;i++) {
        const [ot,tags]=parseOfftext(lines[i]);
        if (tags.length && tags[0].name=='ts') {
            const [startsec,endsec]=parseTimeStamp(tags[0].attrs.id);
            out.push( formatSeconds(startsec) + ' --> '+ formatSeconds(endsec) )            
        }
        out.push(ot);
    }
    //console.log(out)
    return out.join('\n')
}
export const meta_subtitle={ guidedrawer:'subtitle',genWebVTT, parseTimeStamp,mpegfileOfID,subtitleOfID};
addTemplate('subtitle',meta_subtitle);
