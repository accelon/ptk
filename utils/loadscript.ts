export const unloadScript=src=>{
    if (src.slice(0,2)=='./') src=src.slice(2);
    const css=src.endsWith('.css');
    const children=document.head.children;
    for (let i=0;i<children.length;i++) {
        const ele=children[i];
        if (css && ele.tagName=='LINK' && ele.href.endsWith('/'+src)
            || (ele.tagName=='SCRIPT' && ele.src.endsWith('/'+src) )) {
            document.head.removeChild(ele);
        }
    }       
}
export const loadScript=async (src, cb)=>{
    if (cb&&cb()) {
        return true//no need to load
    }
    if (src.slice(0,2)=='./') src=src.slice(2);
    const css=src.endsWith('.css');
    const children=document.head.children;
    for (let i=0;i<children.length;i++) {
        const ele=children[i];
        if (css && ele.tagName=='LINK' && ele.href.endsWith('/'+src)) {
            if (i<children.length-1) { //precedence by later append
                document.head.removeChild(ele);
                document.head.appendChild(ele);
            }
            return true;
        }
        else if (ele.tagName=='SCRIPT' && ele.src.endsWith('/'+src)) return true;
    }

    const promise=new Promise((resolve,reject)=>{
        const script=document.createElement(css?"link":"script");
        script.type=css?'text/css':'text/javascript';
        if (css) {
            script.rel='stylesheet';
            script.href=src;
        } else {
            script.src=src;
        }
        script.onerror = reject;
        script.async = true;
        script.onload = resolve;
        document.head.appendChild(script);
    });
    return promise;
}
