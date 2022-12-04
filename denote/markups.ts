import {OFFTAG_REGEX_SPLIT,OFFTAG_LEADBYTE,packOfftagAttrs,parseOfftag}
 from '../offtext/index.ts'

const plainMarkup=str=>{
    return [[str,{}]];
}
const offtextMarkup=str=>{ //offtext assumn linux linebreak
    const tokens=str.split(OFFTAG_REGEX_SPLIT);
    let i=0,open='';
    const out=[];
    while (i<tokens.length) {
        const tk=tokens[i];
        i++;
        if (!tk) continue;
        if (tk[0]===OFFTAG_LEADBYTE) {
            const [tagName,attrs,putback]=parseOffTag( tk,tokens[i++]);
            let attr=packOfftagAttrs(attrs);
            if (putback) { //包夾文字
                attr=attr.slice(0,attr.length-1);//去 ']'
                out.push([putback,{open: open+tk+attr, close:']' }])
                open='';
            } else { //依附下個字
                open+=OFFTAG_LEADBYTE+tagName+attr;
            }
        } else {
            out.push([tk,{open}]);
            open='';
        }
    }

    return out;
}

const XMLMarkup=str=>{ //naive , doesn't deal with CDATA
    const out=[];
    const tokens=str.split(/(<[^>]+>)/);
    let open='',attr;
    for (let i=0;i<tokens.length;i++) {
        const tk=tokens[i];
        if (tk[0]=='<') {
            if (tk[1]=='/') {
                attr.close+=tk; 
            } else {
                open+=tk;
            }
        } else if (tk){
            attr={open,close:''};
            open='';
            out.push([tk,attr]);
        }
    }

    return out;
}

export default {'plain':plainMarkup,offtext:offtextMarkup,'xml':XMLMarkup}