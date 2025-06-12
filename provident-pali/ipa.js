//IPA Transcript from the World Tipitaka Edition 2009
const p2e={
    'a':'a','A':'a:','I':'i','IA':'i:','U':'u','UA':'u:','e':'e','o':'o',
    'aA':'a:','iI':'i:','uU':'u:','E':'e',
    'k':'k','K':'kh','g':'g','G':'gh','NVk':'Nk','NVK':'Nkh','NVg':'Ng','NVG':'Ngh',
    'c':'c','C':'ch','j':'J','J':'Jh','Y':'n^', 'y':'j',
    'W':'t','X':'th','F':'d.','Q':'d.h','N':'n.','r':'r','L':'l.',
    't':'t[','T':'t[h','d':'d[','D':'d[h','n':'n[','l':'l[','s':'s[',
    'p':'p','P':'ph','b':'b','B':'bh','m':'m',
    'v':'v',
    'M':'~',

};
/*
export const toESpeak=(str,opts={})=>{
    let out='';
    const convert=p=>{
        let s='',idx=0,needVowel=false;
        while (idx<p.length) {
            let sub=p[idx];
            const v='aeiouMAEIOU'.indexOf(sub);
            needVowel= (v==-1) ;
            while (idx<p.length && p2e[sub+p[idx+1]]) {
                idx++;
                sub+=p[idx];
            }
            idx++;
            
            if (needVowel && p[idx]&& 'aeiouMEIOU'.indexOf(p[idx])==-1 ) {
                s+='a';
            }
            s+=p2e[sub];
            sub='';
        }
        return s;
    }

    const parts=(opts.format==='xml')?str.split(/(<[^<]+>)/):[str];
    for (let j=0;j<parts.length;j++) {
        if (parts[j][0]=='<') {
            out+=parts[j];
            continue;
        }
        const units=parts[j].split(/([aeiouVBCDFGHJKLNPQRSTVWXYZbcdghjklmnprstuvyAEIOUM]+)/);
        units.forEach(s=>{
            const m=s.match(/[aeiouVBCDFGHJKLNPQRSTVWXYZbcdghjklmnprstuvyAEIOUM]/);
            if (!m) {
                out+=s;
            } else {
                out+=convert(s);    
            }
        })
    }

    return out;
}
*/