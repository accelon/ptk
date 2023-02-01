/* 
搜尋 ptk 中的 tag innertext ，補上txt 中的id
用於加上 湯方 或藥名 id


輸出檔名後綴 .out
*/
import {writeChanged, bsearchNumber,similarSentence,
    similarSet,unique,
    openPtk, readTextLines, parseAddress, parseAction, rangeOfAddress, alphabetically, closeBracketOf} from '../nodebundle.cjs'
export const markid=async ()=>{
    console.time('markj')
    const address=process.argv[3];
    const txtfile=process.argv[4];
    const addr=parseAddress(address);

    const ptk=await openPtk(addr.ptkname);
    if (!ptk) {
        console.log('cannot open ptk',addr.ptkname);
        return;
    }
    const tagname=addr.action;
    const tag=ptk.defines[tagname];
    if (!tag) {
        console.log('no such tag',tagname);
        return;
    }
    const lines=readTextLines(txtfile);
    const pat=new RegExp('\\^'+tagname+'([^#\\d])');
    let foundcount=0,totalcount=0;
    for (let i=0;i<lines.length;i++) {
        const m=lines[i].match(pat);
        if (m){
            const closebracket=closeBracketOf(m[1]);
            if (!closebracket) continue;
            const closeat=lines.indexOf(closebracket);
            const innertext=lines[i].slice(m[0].length,closeat);
            let id='';
            totalcount++;
            const at=tag.innertext.indexOf(innertext);
            if (at>-1) {
                id=tag.fields.id.values[at];
                if (id ) {
                    foundcount++;
                    id=isNaN(parseInt(id)?'#':'')+id;
                    lines[i]=lines[i].slice(0,m[0].length-1)+id+lines[i].slice(m[0].length-1)
                }
            } else {
                // console.log(innertext)
            }
        }
    }
    console.log('total',totalcount,'found',foundcount)
    writeChanged(txtfile+'.out',lines.join('\n'),true)
}

        
