import {parseOfftext, splitUTF32Char,CJKRangeName, toVerticalPunc,styledNumber,bsearchNumber} from 'ptk'
export const VALIDPUNCS="「」『』。，；：、！？"
export const fetchFolioText=async (ptk,bk,pb)=>{
    const [from,to]=ptk.rangeOfAddress("folio#"+bk+ (pb?".pb#"+pb:''));
    if (from==to) return ['',from,to];

    await ptk.loadLines([from,to])
    
    const lines=ptk.slice(from,to+1);
    let firstline=lines[0];
    let lastline=lines[lines.length-1];

    let m=firstline.match(/(\^pb\d+)/);
    lines[0]=firstline.slice( m.index+m[1].length);
    m=lastline.match(/(\^pb\d+)/);
    let till = m?.index||0;
    let remain='';
    if (m) {
        till=m.index;
        remain = lines[lines.length - 1].slice(m.index);
    }
    lines[lines.length - 1] = lastline.slice(0, till);
    
    const text=lines.join('\t')
    .replace(/\^folio#[a-z\d]+【([^】]+?)】/g,'')// 只作為 foliolist 的名字，查字典內文用不到
    .replace(/\^ck(\d+)【([^】]+?)】/g,'^ck$1<caption=$2>').split('^lb');
    text.push(remain);
    return [text,from,to];
}
export const concreateLength=(linetext)=>{
    let [text,tags]=parseOfftext(linetext);
    const isgatha=!!tags.filter(it=>it.name=='gatha').length;
    if (isgatha) {text=text.replace(/．/g,'　')}; //replace punc inside gatha to ． 
    const chars=splitUTF32Char(text);
    let i=0,chcount=0;
    while (i<chars.length) {
        const r=CJKRangeName(chars[i]);
        if (r || chars[i]=='　') {
            chcount++;
        }
        i++;    
    }
    return chcount;
}
export const getConcreatePos=(linetext,nth,nextline)=>{
    let [text,tags]=parseOfftext(linetext);
    const isgatha=!!tags.filter(it=>it.name=='gatha').length;
    if (isgatha) {text=text.replace(/．/g,'　')}; //replace punc inside gatha to ． 
    let ntag=0;
    const chars=splitUTF32Char(text);
    let pos=0, i=0, tagstart=0;
    if (ntag<tags.length && pos>tags[ntag].choff) tagstart=tags[ntag].start;
    while (nth&& i<chars.length) {
        const r=CJKRangeName(chars[i]);
        if (r || chars[i]=='　') {
            nth--;
        }
        pos+=chars[i].codePointAt(0)>=0x20000?2:1;
        if (ntag<tags.length &&  pos>tags[ntag].choff ) {
            if (ntag<tags.length) tagstart=tags[ntag].start;
            ntag++;
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
    let textbefore='';
    let s=text.slice(pos);
    if (pos>0) {
        const befores= splitUTF32Char(text.slice(0,pos));
        let back=befores.length-1;

        while (pos>0 && back>0 && CJKRangeName(befores[back])) {
            textbefore=befores[back]+textbefore;
            back--;
            pos--;
        }
    }
    if (textbefore) textbefore=textbefore+'^';
    if (nextline) {
        const [nextlinetext]=parseOfftext(nextline);
        s=s+nextlinetext;
    }
    // returh "pure text with ^ " ,   offset of offtext
    return [textbefore+s,pos + tagstart ];
}

export const chunkOfFolio=(ptk,_bk,_pb)=>{
    const pb=ptk.defines.pb;
    const bk=ptk.defines.bk;
    const ck=ptk.defines.ck;
    if (!pb) return -1;

    if (typeof _pb=='number') _pb=_pb.toString();
    const [start,end]=ptk.rangeOfAddress('bk#'+_bk);
    
    const from= bsearchNumber(pb.linepos, start);
    const pbat=pb.fields.id.values.indexOf(_pb,from );
    const line=pb.linepos[pbat];

    const at=bsearchNumber(ck.linepos,line+1);
    //console.log('ck', ck.fields.id.values[at])
    return ck.fields.id.values[at];
}
//convert folio position to chunk-line
export const folio2ChunkLine=async (ptk,foliotext,from,cx,pos)=>{
	const out=[];
    if (!foliotext.length) return '';
	for (let i=0;i<=cx;i++) {
        foliotext[i]=foliotext[i]||'';
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
    if (~at) s=s.slice(at);
	else {
		while (startline>0) {
			startline--;
			await ptk.loadLines([startline]);
			const line=ptk.getLine(startline);
			out.unshift(line);
            if (out.length>100) break;
			if (~line.indexOf('^ck')) break;
		}
		const at=out[0].indexOf('^ck');
		out[0]=out[0].slice(at);
		s=out.join('\t')+'\t'+s;	
	}

	const lines=s.split('\t');
	const m=lines[0].match(/\^ck#?([a-z\d\-_]+)/);
    if (!m) return '';
	const ck=parseInt(m[1]);
    const lineoff=lines.length-1;
    if (ck) {
        return 'ck#'+ck+ (lineoff?':'+lineoff:'');
    } else {
        return '';
    }
	
}

export const extractPuncPos=(foliotext,foliolines=5,validpuncs=VALIDPUNCS)=>{
    const puncs=[];
    for (let i=0;i<foliotext.length;i++) {
        let ch=0,ntag=0,textsum=0;
        let [text,tags]=parseOfftext(foliotext[i]);
        const isgatha=!!tags.filter(it=>it.name=='gatha').length;
        if (i>=foliolines) break;
        if (isgatha) {text=text.replace(/．/g,'　')}; //replace punc inside gatha to ． 
        const chars=splitUTF32Char(text);
        for (let j=0;j<chars.length;j++) {
            while (ntag<tags.length&&textsum>tags[ntag].choff) {
                if (tags[ntag].name=='ck') {
                    puncs.push({line:i,ch, text: styledNumber(parseInt(tags[ntag].attrs.id),'①') });
                }
                ntag++;
            }

            textsum+=chars[j].length;
            if (~validpuncs.indexOf(chars[j])) {
                let text=toVerticalPunc(chars[j]);
                puncs.push({line:i,ch, text });
            }

            const r=CJKRangeName(chars[j]);
            if (r|| chars[j]=='　') {
                ch++;
            }

        }
    }
    return puncs;
}

export const folioPosFromLine=async (ptk, pb,line,bookid,fl,fc)=>{
    const [text,start]=await fetchFolioText(ptk,bookid, pb);
    if (!text) return;
    const str=text.join('\n');
    let linediff=line-start;
    let foliolinecount=0;
    let tappos=(parseInt(pb)-1)*fl*fc;
    let next=0,n=0,linestart=0;
    while (n<str.length && linediff>0) {
        const ch=str.charAt(n);
        if (ch=='\n') {
            linestart=n+1;
            foliolinecount++;
        } else if (ch=='\t') {
            linediff--;
            next=n+1;
        }
        n++;
    }
    tappos+=foliolinecount*fc;
    let str2=str.slice(linestart,next);;
    const [leading]=parseOfftext(str2);
    tappos+=concreateLength(leading);
    return tappos;
}