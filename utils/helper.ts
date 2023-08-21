export const sleep=time=>new Promise(r=>{ setTimeout(()=>r() , time)});

export const updateUrl=(address)=>{
    window.location.hash='#'+address;
}
export const addressFromUrl=()=>{
    let hash=window.location.hash;
    if (hash[0]=='#') hash=hash.slice(1);
    const address=decodeURI(hash);
    return address; 
}
