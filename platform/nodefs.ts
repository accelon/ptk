export const writeChanged=(fn,buf,enc='utf8')=>{ //write to fn only if changed
    const oldbuf=fs.existsSync(fn) && fs.readFileSync(fn,enc);
    if (oldbuf!==buf) {
        fs.writeFileSync(fn,buf,enc);
        return true;
    }
    return false;
}
const nodefs=new Promise(resolve=>{
    if (typeof process!=='undefined' &&  parseInt(process.version.substr(1))>12) {
        import('fs').then(fs=>{
            global.fs=fs;
            import('path').then(p=>{
                global.Path=p;
            })
            resolve();
        })
    } else {
        resolve(null)
    }
})
export const readTextContent=(fn,enc='utf8')=>{
    let s=fs.readFileSync(fn,enc);
    if (s.charCodeAt(0)===0xfeff) s=s.substr(1);
    return s.replace(/\r?\n/g,'\n');
}
export  const readTextLines=(fn,enc='utf8')=>readTextContent(fn,enc).split(/\r?\n/);
export {nodefs};