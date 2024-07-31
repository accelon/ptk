export const sleep=(time:number)=>new Promise(r=>{ setTimeout(()=>r() , time)});

export const updateUrl=(address:String)=>{
    window.location.hash='#'+address;
}
export const addressFromUrl=()=>{
    let hash=window.location.hash;
    if (hash[0]=='#') hash=hash.slice(1);
    let address=decodeURI(hash);
    if (~address.indexOf('%')) address=decodeURIComponent(address)
    if (!~address.indexOf('bk')&&!~address.indexOf('ak')) address='';//invalid adress
    return address; 
}
export const loadUrl=async (url:URL)=>{
    let text='';
    const response=await fetch(url);
    if (response.status>=200 && response.status<300) {
        text=await response.text()
    }
    return text;
}