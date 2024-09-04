export const parseXMLAttribute=(attrs)=>{
    const arr=attrs.split(/([a-z\:\_]+=".+?")/).filter(it=>!!it.trim());
    const out={};
    for (let i=0;i<arr.length;i++) {
        const [key,value]=arr[i].split(/=["＂]/);
        if (!value) {
            console.log('invalid attrs',arr[i],attrs)
        };
        out[key]=value.slice(0,value.length-1);//remove tailing ""
    }
    return out;
}