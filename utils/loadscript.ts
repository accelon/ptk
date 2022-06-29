export const loadScript=async (src, cb)=>{
    if (cb()) {
        return true//no need to load
    }
    const script=document.createElement("script");
    script.src=src;
    const promise=new Promise((resolve,reject)=>{
        let tried=0;
        const timer=setInterval(function(){
            if ( cb() ) {
                clearInterval(timer);
                resolve(true);
            } else if (tried>50) {
                clearInterval(timer);
                reject('too many trieds loading '+src);
            }
            tried++;
        },50);    
    });
    document.getElementsByTagName("body")[0].appendChild(script);
    return promise;
}