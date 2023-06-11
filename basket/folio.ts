import {parseOfftext, splitUTF32Char,CJKRangeName} from 'ptk'
export const fetchFolioText=async (ptk,bk,pb)=>{
    const [from,to]=ptk.rangeOfAddress("bk#"+bk+".pb#"+pb);
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
    let ntag=0;
    const chars=splitUTF32Char(text);
    let pos=0, i=0, tagstart=0;
    if (ntag<tags.length) tagstart=tags[ntag].start;
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
        if (ntag<tags.length &&  tags[ntag].choff > pos ) {
            ntag++;
            if (ntag<tags.length) tagstart=tags[ntag].start;
        }
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

    return [s,pos + tagstart ];
}

//convert folio position to chunk-line
export const folio2ChunkLine=async (ptk,foliotext,from,cx,pos)=>{
	const out=[];
	for (let i=0;i<=cx;i++) {
		if (i==cx) {
			out.push(foliotext[i].slice(0,pos))
		} else {
			out.push(foliotext[i]);
		}
	}
	let startline=from;
	let s=out.join('');
    out.length=0;
	let at=s.lastIndexOf('^ck');
	if (at==-1) {
		while (startline>0) {
			startline--;
			await ptk.loadLines([startline]);
			const line=ptk.getLine(startline);
			out.unshift(line);
			if (~line.indexOf('^ck')) break;
		}
		const at=out[0].indexOf('^ck');
		out[0]=out[0].slice(at);
		s=out.join('\t')+'\t'+s;
	} else {
		s=s.slice(at);
	}

	const lines=s.split('\t');
	const m=lines[0].match(/\^ck#?([a-z\d\-_]+)/);
	const ck=m[1];
    const lineoff=lines.length-1;
	return 'ck#'+ck+ (lineoff?'>'+lineoff:'');
}