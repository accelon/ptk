// Step 1: start the fetch and obtain a reader
import {humanBytes} from '../utils/misc.ts'
import {unique} from '../utils/sortedarray.ts'
import { isLocalhost } from 'ptk/platform/pwa.js';

export const isLatest=async(url,cacheName)=>{
    if (!navigator.onLine && !isLocalhost()) return true;
    const cachefn=url.replace(/\?.+/,'');
    const fetchurl=cachefn+'?'+(new Date()).toISOString();
    const ContentType=~fetchurl.indexOf('.mp3')?"audio/mpeg":"application/octet-stream";
    const headresponse = await fetch(fetchurl,{method:"HEAD", mode:"no-cors",redirect:"follow", credentials: "omit", origin,headers:{Accept:ContentType}});
    const cache=await caches.open(cacheName);
    const cached=await cache.match(cachefn)
    const contentlength=headresponse.headers.get('Content-Length');
    const isLatest=(cached && contentlength == cached.headers.get('Content-Length'));
    return isLatest;
}
export const downloadToCache=async(cacheName,url,cb)=>{
    const cachefn=url.replace(/\?.+/,'');//remove tailing timestamp

    // if (location.host!=='nissaya.cn' 
    // && location.host.indexOf('localhost')==-1 
    // && location.host.indexOf('127.0.0.1')==-1) url="https://nissaya.cn/"+url.replace(/^\//,'');
    
    const ContentType=~url.indexOf('.mp3')?"audio/mpeg":"application/octet-stream";
    const origin="https://nissaya.cn";

    const cache=await caches.open(cacheName);
    const cached=await cache.match(cachefn);

    if (!navigator.onLine && !isLocalhost()) {
        return cached || cache.match('/offline.html');;
    }
    
    //once download , zip and mp3 need to manually delete
    if (cached && cached.statusText=='OK' && (url.endsWith(".zip") || url.endsWith(".mp3")||url.endsWith(".ptk"))) {
        return cached;
    }
    //HEAD is slow occasionally, clear it manually if want to update
    let headresponse = await fetch(url,{method:"HEAD", mode:"no-cors",redirect:"follow", credentials: "omit", origin,headers:{Accept:ContentType}});
    const lastmodified=headresponse.headers.get('Content-Length');
    if (cached && lastmodified == cached.headers.get('Content-Length')) {
        // console.log('use cached')
        return cached;
    }

    cb&&cb('requesting')
    let response = await fetch(url,{method:"GET",mode:"no-cors",
    redirect:"follow", credentials: "omit", origin,
    headers:{Accept:ContentType}});

    cb&&cb('responsed')

    if (response.status>=400) {
        cb&&cb(response.statusText);
        return;
    }

    if (response.body) { //support progress
        const reader = response.body.getReader();
        // Step 2: get total length
        const contentLength = +response.headers.get('Content-Length');
        // Step 3: read the data
        let receivedLength = 0; // received that many bytes at the moment
        let chunks = []; // array of received binary chunks (comprises the body)
        while(true) {
            const {done, value} = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedLength += value.length;
            cb&&cb( Math.floor( (100*receivedLength/contentLength))+'% / '+humanBytes(contentLength));
        // console.log(`Received ${receivedLength} of ${contentLength}`)
        }
    
        // Step 4: concatenate chunks into single Uint8Array
        let chunksAll = new Uint8Array(receivedLength); // (4.1)
        let position = 0;
        for(let chunk of chunks) {
            chunksAll.set(chunk, position); // (4.2)
            position += chunk.length;
        }
        //put to cache
        const resp= {
            status:response.status,
            statusText:response.statusText,
            headers: {'X-Shaka-From-Cache': true,"Content-Type":ContentType,
            "Content-Length": contentLength}
        };
        const res=new Response(chunksAll,resp)
        cache.put(cachefn, res.clone());
        cb&&cb('cached');
        return res;
    } else { //doesn't support download progress
        cache.put(cachefn, response.clone());
        cb&&cb('cached');
        return response;
    }
}


export const fileInCache=async (pat,cacheName,ext='.ptk')=>{
    const cache=await caches.open(cacheName);
    const keys=await cache.keys();
    const incaches=keys.filter(it=>it.url.endsWith(ext)).map(it=>it.url.match(pat)).filter(it=>!!it).map(it=>it[1])
    return unique(incaches);
}
export const ptkInCache=async (cacheName)=> {
    return await fileInCache(/([a-z_\-]+)\.ptk/,cacheName);
}
export const mp3InCache=async (cacheName)=> {
    return await fileInCache(/([a-z_\-]+)\.mp3/,cacheName,'.mp3');
}
export const isMobile=()=>{
    const ua=navigator?.userAgent;
    return ~ua.indexOf('iPhone')||~ua.indexOf('iPad')||~ua.indexOf('Android')||~ua.indexOf('Mobile')
}