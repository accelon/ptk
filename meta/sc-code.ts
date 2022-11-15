//do no import nodefs.ts
import {filesFromPattern} from "../platform/fsutils.ts"
const BookPrefix={
    vin:"pj,pc,mv,cv,pvr",
    dn:"dn1,dn2,dn3",
    mn:"mn1,mn2,mn3",
    sn:"sn1,sn2,sn3,sn4,sn5",//match subfolder 
    an:"an1,an2,an3,an4,an5,an6,an7,an8,an9,an10,an11",
    ab:"ds,dt,kv,pt,pp,vb,ya",
    kn:"dhp,iti,ud,thag,thig"
}
const AB='abhidhamma',VIN='vinaya';
export const booksOf=id=>{ //id can be separated by "," , or a book prefix
    const idarr=id.split(',');
    const out=[];
    idarr.forEach(id=>{
        const s=BookPrefix[id];
        if (typeof s==='string') {
            out.push(...s.split(","));
        } else {
            out.push(id)
        }
    })
    return out.filter(it=>!!it);
}
export const sortFilenames=filenames=>{
	return filenames.sort((f1,f2)=>{
		const m2f1=f1.match(/(\d+)\.(\d+)/);
		const mf1=f1.match(/(\d+)/);
		const m2f2=f2.match(/(\d+)\.(\d+)/);
		const mf2=f2.match(/(\d+)/);
		if (!m2f1||!m2f2) return parseInt(mf1[1])-parseInt(mf2[1]);
		
		return m2f1[1]==m2f2[1]?(parseInt(m2f1[2])-parseInt(m2f2[2])):
			                    (parseInt(m2f1[1])>parseInt(m2f2[1])?1:-1)
	})
}
export const getFilesOfBook=(pat,filesFolders,rootfolder)=>{
    let folders=filesFolders[pat];
    if (!folders) return [];
    if (typeof folders==='string') {
        const out=[];
        folders.split(',').forEach(f=>{
        	if (filesFolders[f]) out.push(... filesFolders[f]);
        	else out.push(f);
        });
        folders=out;
    }
    const files=[];
    folders.forEach(subfolder=>{
        const f=filesFromPattern(subfolder,rootfolder);
        files.push(... sortFilenames(f));
    })
    return files;
}
export const pitakaOf=id=>{
    const pf=id.replace(/\d+$/,'');
    return {pj:VIN,pc:VIN,mv:VIN,cv:VIN,pvr:VIN,vin:VIN,
         ab:AB,ds:AB,dt:AB,kv:AB, pt:AB,pp:AB,vb:AB,ya:AB}[pf] || 'sutta';
}

export default {getFilesOfBook,booksOf,pitakaOf}