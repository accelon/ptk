import {OffText,OffTag} from './interfaces.ts';
import {AUTO_TILL_END,ALWAYS_EMPTY} from './constants.ts';

const offTextToHTML=(offtext:OffText)=>{
	const {text,tags}=offtext;
	if (!tags.length) return [];
	let T : HTMLTag [] = [];
	let ntag=0, offset=0, tagcount=0;
	let y=0;
	let tag:OffTag = tags[ntag];
    while (ntag<tags.length && tag) {
        let w=tag.w;
        if (w==0 && AUTO_TILL_END[tag.name]) w=line.length-tag.x; // 自動標記到行尾
        offset+tag.x;
        T.push( {x:offset+tag.x,closing:0,name:tag.name, attrs:tag.attrs,y,w} );  //open tag
        tagcount++;        
        if (tag.name!=='r' && tag.name!=='br') { //closing a tag
            T.push({x:offset+tag.x+w, closing:tagcount, name:tag.name, attrs:tag.attrs, y, w }); // close after n characters
        }
        ntag++;
        tag=tags[ntag];
    }
    //offset += lines[y].length+1; //width of \n
    return T;
}

const lastSpan=(T:OffTag[],activetags,idx,x)=>{ //if last span of a tag, return -name
    const out=[];
    for (let j=0;j<activetags.length;j++) {
        const tag=T[activetags[j].i];
        const tagend=tag.x+tag.w;
        let hasopentag=false;
        for (let i=idx;i<T.length;i++) {
            if (!T[i].closing) {
                hasopentag=true;
                break;
            }
            if (T[i].x + T[i].w > tagend) break;
        }
        if (!hasopentag && tagend==x && !activetags[j].closed) {
            out.push('-'+tag.name);
            activetags[j].closed=true;
            break;
        }
    }
    return out;
}
const toSim=str=>str;
const htmlAttrs=(attrs)=>{
    if (!attrs)return '';
    let s='';
    for (let name in attrs) {
        let aname=name;
        if (name=='#') aname='n';
        else if (name=='@') aname='hook'; //link
        // else if (name=='id') aname='n';
        else if (name=='~') continue;
        const val=attrs[name];
        s+=' '+aname+'="'+val+'"';//do not convert @,#
    }
    return s;
}
const renderSnippet=(offtext:OffText)=>{
	let {text}=offtext, prev=0, i=0;
	const T=offTextToHTML(offtext);
	const out=[];
	let activetags=[];//active classes
    for(let idx=0;idx<T.length;idx++) { //idx=html tag index
        const {x,closing,name,attrs,y,w} = T[idx];
        const s=text.substring(prev, x);
        s&&out.push([s,prev]);
        if (ALWAYS_EMPTY[name]) {
            out.push({empty:name,i,attrs,x,y,w,extra:(name=='br'?' ':'')});
            prev=x;
            continue;
        }
        if (closing) {
            const actives=activetags.filter( c=>c.i==closing-1);
            let name='';
            if (actives.length) {
                name=actives[0].name;
            }
            const openx=T[closing-1].x;
            if (name) out.push({i:closing,closing:true, name ,attrs}); //第i個tag關閉
            activetags=activetags.filter( c=>c.i!==closing-1);
            const clss=activetags.map(t=>t.name);
            clss.push( ... lastSpan(T,activetags,idx,x) );
            if (clss.length) {
                out.push({clss,attrs,x:openx,y,w});
            }
        } else {
            let clss=activetags.map(t=>t.name);
            if (clss.length) {
                out.push({attrs,closing:true}); //attrs is needed sometime
            }
            clss.push(name);
            if (w) clss.push(name+'-'); //原始的標記位置，不是自動補上的

            if (!ALWAYS_EMPTY[name]) activetags.unshift( {i,attrs, clss,idx,name,closed:false} );
            i++;
            out.push({i,name,clss,attrs,x,y,w}); 
        }
        prev=x;
    }
    if (text.substring(prev)) out.push([text.substring(prev),prev]);

   let py=0;
    i=0;
    const units=[]; 
    while (i<out.length) {
        if (typeof out[i][0]=='string') {
            const [text,x]=out[i];
            units.push({ text,open:{x,y:py}, close:{closing:true} } ); 
            i++;
        } else {
            let text='';
            const open=out[i];i++;
            while (i<out.length && (typeof out[i][0]=='string' || out[i].empty)) {
                const emptytag=out[i].empty
                    ?(out[i].extra+'<'+out[i].empty
                        +(open.i?' i="'+i+'" ':'')
                        +' x="'+open.x+'" '+' y="'+open.y+'" '
                        +htmlAttrs(open.attrs)+'/>')
                    :'';
                py=open.y;
                text+=emptytag||out[i][0];
                i++;
            }
            const close=out[i];i++;
            units.push({text,open,close});
        }
    }
    
    return units;
}
export const composeSnippet=(snippet,lineidx)=>{
    const {text,open,close}=snippet;
    let t=text;

    let out='';
    if (open && open.empty) {
        out+=open.extra+'<'+open.empty+(open.i?' i="'+open.i+'" ':'')
            +' x="'+open.x+'" '+' y="'+(lineidx+open.y)+'" '+htmlAttrs(open.attrs)+'/>';
    } else {
        if (!open) out+=t;
        else out+=
        '<t'+ htmlAttrs(open.attrs)
                +(open.clss&&open.clss.length?' class="'+open.clss.join(' ')+'"':'')
                +' x="'+open.x+'"'+' y="'+(lineidx+open.y)+'"'
                + (open.w?' w="'+(open.w)+'"':'')
                +(open.i?' i="'+open.i+'" ':'')
                //+(oritext?' ori="'+oritext+'" ':'')
                +'>'
        +t
        +'</t'+(close&&close.i?' i="'+close.i+'" ':'')+'>';
    }
    return out;
}

export const renderHTML=(text, tags:OffTag[], opt:RenderOptions)=>{
	const snippets=renderSnippet({text, tags});
    let out='';
    for (let i=0;i<snippets.length;i++) {
        out+=composeSnippet(snippets[i]);
    }
    return out;
}