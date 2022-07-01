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

export {nodefs};