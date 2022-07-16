export const loadScript=async (src, cb)=>{
    if (cb()) {
        return true//no need to load
    }
    const promise=new Promise((resolve,reject)=>{
        const script=document.createElement("script");
        script.src=src;
        script.type='text/javascript';
        script.onerror = reject;
        script.async = true;
        script.onload = resolve;
        document.head.appendChild(script);
    })
    
    return promise;
}