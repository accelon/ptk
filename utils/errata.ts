/* Errata 順序無所謂，每次會從頭找，比較慢 */
export const patchBuf=(buf:string,errata:Array,fn='')=>{
    if (!errata||!errata.length) return buf;
    let outbuf=buf;
    for (let i=0;i<errata.length;i++) {
        const [from,to]=errata[i];
        let n=errata[i][3]||0;
        let occur=errata[i][2]||1;
        const unlimited=occur==-1;
        let newoutbuf=outbuf;
        if (typeof to==='function'){
            if (typeof from==='string') {
                while (occur>0) {
                    newoutbuf=newoutbuf.replace(from, (m,m1,m2)=>{
                        occur--;
                        return to(m,m1,m2,m3);    
                    });
                    occur--;
                }    
            } else { //regex
                newoutbuf=newoutbuf.replace(from,(m,m1,m2,m3)=>{
                    occur--;
                    return to(m,m1,m2,m3);
                });
            }
        } else {
            if (typeof from==='string') {
                while (occur>0) {
                    let torepl=to.replace(/\$\$/g,n);
                    newoutbuf=newoutbuf.replace(from,torepl);
                    n++;
                    occur--;
                }    
            } else { //regex from , string to
                newoutbuf=newoutbuf.replace(from,(m,m1,m2)=>{
                    let torepl=to.replace(/\$1/g,m1).replace(/\$2/g,m2).replace(/\$\$/g,n);
                    n++;
                    occur--;
                    return torepl;
                })
            }
        }
        
        if (newoutbuf===outbuf && !unlimited) {
            console.log(fn,"cannot replace",errata[i]);
        } else {
            if (typeof errata[i][2]!=='undefined')  errata[i][2]=occur;
        }
        outbuf=newoutbuf;
        if (occur!==0 && !unlimited) {
            console.log(fn,"errata is not cleared!",occur,'left',errata[i]);
        }
    }
    return outbuf;
}

export const RemainingErrata=(Erratas:Array)=>{
    let count=0;
    for (let key in Erratas) {
        let arr=Erratas[key];
        if (!Array.isArray(arr)) arr=[arr];
        
        arr.forEach(([from,to,remain])=>{
            if (remain) {
                count++;
                console.log(key,'remain',remain,'from',from);
            }
        });
    }
    return count;
}
/* 順序找定位點，插入文字，比 patchBuf 快，盡量用這個除非要刪改文字。*/
export const insertBuf=(buf:string, inserts:Array ,fn='')=>{
    if (!inserts||!inserts.length) return buf;
    let outbuf='', prev=0;
    for (let i=0;i<inserts.length;i++) {
        let [tofind, insert , offset  ]=inserts[i];
        let insertbefore=false;
        if (~tofind.indexOf('>') || ~tofind.indexOf('<')) {//has pin
            let at=tofind.indexOf('>'); 
            if (at==-1) {
                at=tofind.indexOf('<');
                insertbefore=true;
            }
            offset=tofind.slice(at+1);
            tofind=tofind.slice(0,at);
        }

        let at=buf.indexOf(tofind,prev);
        if (at==-1) {
            console.log("cannot find",tofind,'#'+i,fn);
            outbuf+=buf.slice(prev);
            return outbuf;
        }
        at+=tofind.length;
        if (typeof offset=='number' && offset) {
            at+=offset;
        } else if (typeof offset=='string') {
            const at2=buf.indexOf(offset,at);
            if (at2==-1) {
                console.log("cannot find offset",tofind,'offset',offset,'#'+i,fn);
                outbuf+=buf.slice(prev);
                return outbuf;
            } else {
                at=at2;
            }
            if (!insertbefore) {
                at+=offset.length;
            }
        }

        outbuf+=buf.slice(prev,at);
        outbuf+=insert;
        prev=at;
    }
    outbuf+=buf.slice(prev);
    return outbuf;
}

export default {patchBuf,RemainingErrata, }