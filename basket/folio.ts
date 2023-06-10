import {parseOfftext, removeBracket, splitUTF32Char,CJKRangeName} from 'ptk'
export const fetchFolioText=async (ptk,bk,pb)=>{
    const [from,to]=ptk.rangeOfAddress("bk#"+bk+"vcpp.pb#"+pb);
    await ptk.loadLines([from,to])
    
    const lines=ptk.slice(from,to+1);
    let firstline=lines[0];
    let lastline=lines[lines.length-1];

    let m=firstline.match(/(\^pb\d+)/);
    lines[0]=firstline.slice( m.index+m[1].length);
    m=lastline.match(/(\^pb\d+)/);
    const remain=lines[lines.length-1].slice(m.index);
    lines[lines.length-1]=lastline.slice(0, m.index);
    

    const text=lines.join('\t').replace(/\^ck(\d+)【([^】]+?)】/g,'^ck$1<caption=$2>').split('^lb');
    text.push(remain);
    return [text,from,to];
}

export const getConreatePos=(linetext,nth,nextline)=>{
    let [text,tags]=parseOfftext(linetext);
    const isgatha=!!tags.filter(it=>it.name=='gatha').length;

    text=removeBracket(text).replace(/\t/g,'');
    const chars=splitUTF32Char(text);
    let pos=0, i=0;
    while (nth&& i<chars.length) {
        const r=CJKRangeName(chars[i]);
        if (r) { // a punc
            nth--;
        } else {
            if (isgatha && ~"，、．；".indexOf(chars[i])) {
                nth--;
            }
        }
        pos+=chars[i].codePointAt(0)>=0x20000?2:1;
        i++;
    }
    while (i<chars.length) { //skip leading punc
        const r=CJKRangeName(chars[i]);
        if (!r) { // a punc
            pos++;
        } else break;
        i++;
    }
    let s=text.slice(pos);
    if (nextline) {
        const [nextlinetext]=parseOfftext(nextline);
        s+=nextlinetext;
    }
    return s;
}