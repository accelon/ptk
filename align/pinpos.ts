import { parseOfftext } from '../offtext/parser.ts';
const PINSEP='>',BACKPINSEP='<' ;
export const posBackwardPin=(linetext,x,{wholeword,cjk})=>{
    if (x<1) return '';
    let len=2,occur=0; //start from 2 char for better looking of foot note
    if (cjk) len=1;

    if (wholeword) {
        while (x>len&&linetext.substr(x-len,1).match(/[\dA-Za-z]/)) len++;
        if (len>2) len--;
    }

    let at=linetext.indexOf(linetext.substr(x-len,len));

    // while (at!==x-len && x) {
    //     if (!wholeword && linetext.substr(x-len,len).trim().length>4) break;
    //     if (wholeword && !linetext.substr(x-len,1).match(/[\dA-Za-z]/) ) break;
    //     if (cjk && !linetext.substr(x-len,1).match(/[\u3400-\u9fff]/) ) break;
    //     len++;
    //     at=linetext.indexOf(linetext.substr(x-len,len));
    // }
    // if (at!==x-len && linetext.charCodeAt(x)>0xff) len=2;


    while (at!==x-len && at>-1) {
        occur++;
        at=linetext.indexOf(linetext.substr(x-len,len),at+1);
    }
    const pin=linetext.substring(x-len,x);
    let pass=at===x-len&&linetext[x-len]!==BACKPINSEP&&linetext.charCodeAt(x-len)>=0x20;
    return pass?(pin+(occur?BACKPINSEP+occur:'')):null;
}
export const pinPos=(_linetext,x,opts={})=>{
    const backward=opts.backward;
    const wholeword=opts.wholeword;
    const offtext=opts.offtext;
    let linetext=_linetext;
    const marker=opts.marker||'⚓'
    if (offtext) {
        linetext=linetext.substring(0,x)+marker+linetext.substring(x);
        linetext=parseOfftext(linetext)[0];
        x=linetext.indexOf(marker);
        linetext=linetext.substring(0,x)+linetext.substring(x+1);
    }
    const cjk=opts.cjk;
    let pin='';
    if (linetext.charCodeAt(x)<0x20 || linetext[x]===PINSEP) {
        // console.log('cannot pin separator or control chars')
        return null;
    }
    if (x>linetext.length) {
        // console.log('beyond string boundary',x,linetext.length,linetext.substr(0,30));
        return null;
    }
    
    if (backward) {
        pin=posBackwardPin(linetext,x,{wholeword,cjk})
    }
    if (pin) return pin;

    let len=4,occur=0;
    if (cjk) len=1;
    let at=linetext.indexOf(linetext.substr(x,len));

    while (x+len<linetext.length && x>at) {
        if (!wholeword && linetext.substring(x,len).trim().length>2) break;
        if (wholeword && len>2 && !linetext.substr(x+len,1).match(/[\dA-Za-zñṅḍṭṃṇāūḷī]/) ) break;
        len++;
        at=linetext.indexOf(linetext.substr(x,len));
    }

    // console.log(linetext.substr(x,len),len,linetext.substr(x+len,1), linetext.substr(x,len+1))
    
    if (at!==x && linetext.charCodeAt(x)>0xff
    &&linetext.charCodeAt(x+1)>0xff && cjk) {
        len=2;//shorter pin for non-ascii
        at=linetext.indexOf(linetext.substr(x,len));
    }

    // if (at!==x && linetext.substr(x,len).trim().length==0) len=; 
      //如果是很長的空白(可能是一連串標點)，必須弄短，否則會找不到
    while (at!==x && at>-1 && at<linetext.length) {
        occur++;
        const newat=linetext.indexOf(linetext.substr(x,len),at+len-1); 
        if (at==-1 || newat==at) break;
        at=newat;
    }
    return (at===x)?linetext.substr(x,len)+(occur?PINSEP+occur:''):null;
}
export const posPin=(linetext,pin)=>{
    if (typeof pin==='number') {
        if (pin<0 || pin>linetext.length) {
            console.error('error pin',pin,linetext);
            return 0;
        }
        return pin;
    }

    if (pin[0]===PINSEP) {
        pin=pin.substr(1);
        return linetext.indexOf(pin)+pin.length;
    }

    const m=pin.match(/:(\d+)$/);
    const mb=pin.match(/^(\d+):/);

    let occur=0,backward=0;

    if (mb) {
        occur=parseInt(mb[1]);
        pin=pin.substr(PINSEP.length+mb[1].length);
        backward=pin.length;
    } else if (m) {
        occur=parseInt(pin.substr( pin.length-m[1].length ));
        pin=pin.substr(0,pin.length-m[1].length-1);
    }

    let at=linetext.indexOf(pin);
    while (occur) {
        at=linetext.indexOf(pin,at+pin.length-1); //see line 77 , 至少要2個中文字。
        occur--;
    }
    if (at==-1) return -1;//console.error("cannot pospin",pin,linetext);
    return at+backward;
}
//hook 文鉤 : 以一或兩字表達引文的起訖，不能跨段。
export const makeHook=(linetext,x,w)=>{
    if (w<0)return '';
    let lead=linetext.substr(x,2);
    let end='';
    let occur=0; //0-base occurance
    let eoccur=0; //0-base occurance

    if (w>2) {
        end=linetext.substr(x+w-2,2);
    }

    let at=linetext.indexOf(lead);
    while (at>-1 && at<x) {
        at=linetext.indexOf(lead,at+1);
        occur++;
    }

    if (occur==0) {
        at=linetext.indexOf(lead.substr(0,1));
        if (at==x) {
            lead=lead.substr(0,1);//one char is enough
            if (!end) end=linetext.substr(x+w-1,1);
        }
    }

    let hook=lead+(occur?PINSEP+occur:'');

    if (end) {
        let at=linetext.indexOf(end,x);
        while (at>-1 && at<x) {
            at=linetext.indexOf(end,at+1);
            eoccur++;
        }
        if (at>-1) {
            if (eoccur==0&&linetext.indexOf(end.substr(1),x)==at+1) end=end.substr(1);
            hook+='/'+end+(eoccur?PINSEP+eoccur:'');
        } else {
            end='';
        }
    }

    return hook;
}

export const parseHook=(str_arr,linetext,y=0)=>{
    if (!str_arr)return null;

    const [L,E]=Array.isArray(str_arr)?str_arr:str_arr.split(PATHSEP);
    let [s,nos]=(L||'').split(PINSEP);
    let [e,noe]=(E||'').split(PINSEP);

    nos=parseInt(nos)||0;
    noe=parseInt(noe)||0;
    
    let x=0;
    x=linetext.indexOf(s);
    let n=nos;
    while (n) {
        x=linetext.indexOf(s,x+1);
        n--;
    }

    let x2=linetext.indexOf(e,x);
    n=noe;
    while (n) {
        x2=linetext.indexOf(s,x2+1);
        n--;
    }

    return {y,x,w:x2-x+e.length,s,nos,e,noe}
}

export default {parseHook,makeHook,pinPos,posPin }