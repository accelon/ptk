export const diffList=(IList,JList,opts={})=>{
    const maxdiff=opts.maxdiff||10;
    const out=[];
    const I=IList.items(), J=JList.items(), attrI=IList.akey, attrJ=JList.akey;
    const Ilen=I.length, Jlen=J.length;
    let i=0,j=0;
    const add=(m,a=-1,b=-1)=>{ // m:0 equal , m:1 only in I , m:-1 only in J
        let obj;
        if (a>-1) obj={m,tk:I[a].tk,[attrI]:I[a][attrI], lead:I[a].lead, tail:I[a].tail };
        if (b>-1) {
            if (!obj) {
                obj={m,tk:J[b].tk,[attrJ]:J[b][attrJ], lead:J[b].lead, tail:J[b].tail };
            } else {
                obj[attrJ]=J[b][attrJ];
            }
        }
        if (obj) out.push(obj);
    }
    while (i<Ilen && j<Jlen) {
        if (I[i].tk===J[j].tk) {
            add(0,i,j);
            i++,j++;
            continue;
        } else {
            let pj=j, pi=i,match=false;
            while (j<Jlen && j-pj<maxdiff) { //search J for a match
                j++;
                if (j<Jlen && I[i].tk===J[j].tk) {
                    for (let j2=pj;j2<j;j2++) add(-1, -1 ,j2); //extra on J
                    match=true;
                    break;
                }
            }
            if (match) continue;
            j=pj;   //reset
            if (j<Jlen) while (i<Ilen &&i-pi<maxdiff) { //search I for a match
                i++;
                if (i<Ilen&&[i].tk===J[j].tk) {
                    for (let i2=pi;i2<i;i2++) add(1, i2, -1); //extra on I
                    match=true;
                    break;
                }
            }
            if (match) continue;
            add(1, pi, -1);
            i=pi+1;  //no match , advance I
        }
    }
    while (i<Ilen) add(1,i++,-1);
    while (j<Jlen) add(-1,-1,j++);
    return out;
}