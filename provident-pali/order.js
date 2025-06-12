const CharOrder=[];
const Order='aiueokKgGMcCjJYWXFQNtTdDnpPbBmhHyrRlLvsSZAIUEOV';
for (let i=0;i<Order.length;i++) {
    CharOrder[ Order.charCodeAt(i) ] = i+1;
}

export const providently=(s1,s2)=>{
    let i=0,j=0;
    while (i<s1.length && j<s2.length) {
        const c1=  CharOrder[ s1.charCodeAt(i) ] || 100 ;
        const c2=  CharOrder[ s2.charCodeAt(j) ] || 100;
        if (c1!==c2) {
            return c1-c2;
        }
        i++;j++;
    }
    return 0;
}
export const providently0=(s1,s2)=>providently(s1[0],s2[0])
export const providently1=(s1,s2)=>providently(s1[1],s2[1])

