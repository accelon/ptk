/* browser is save to include this file, used by meta*/
export const filesFromPattern=(pat,rootdir='')=>{
    const outfiles={};
    const patterns=(typeof pat==='string')?pat.split(/[;,]/):pat;
    if (rootdir&&rootdir.slice(rootdir.length-1)!=='/') rootdir+='/';

    patterns.forEach(pat=>{
        const at=pat.lastIndexOf('/');
        let dir='';
        let subfolders=[''];
        if (at>-1) {
            dir=pat.slice(0,at);
            pat=pat.slice(at+1);
            subfolders=expandWildcard(rootdir,dir,true);
        } else {
            subfolders=['']
        }
        
        subfolders.forEach(subfolder=>{
            const files=expandWildcard(rootdir+subfolder,pat);
            files.forEach(f=>{
                outfiles[(subfolder?subfolder+'/':'')+f]=true;
            })    
        })
    });
    const out=[];
    for (let fn in outfiles){
        if (fs.statSync(rootdir+fn).isDirectory()) {
            const files=fs.readdirSync(rootdir+fn).map(f=>fn+'/'+f);
            out.push(...files);
        } else {
            out.push(fn);
        }
    }
    return out;
}
