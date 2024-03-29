export const sleep=time=>new Promise(r=>{ setTimeout(()=>r() , time)});

export const updateUrl=(address)=>{
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
