import Tokenizers from './tokenizers.js';
import Markups from './markups.js';
import Serializers from './serializers.js';
export class TDenList {
    constructor(str,opts={}) {
        this.data=[];
        this.akey=opts.akey||'attr';
        this.markup=opts.markup;
        this.lang=opts.lang;
        this.akey=this.akey;
        this.deserialize(str,opts);
    }
    deserialize(str,opts){
        const markupParser=Markups[opts.markup||'plain'];
        const tokenize=Tokenizers[opts.lang||'iast'];
        if (!markupParser) throw "unknown data format "+opts.markup;
        if (!tokenize) throw "unknown language "+opts.lang;        

        const pieces=(typeof str==='string')?markupParser(str,opts):str;
        this.data=[];
        for (let i=0;i<pieces.length;i++) {
            const [phrase,attr]=pieces[i];
            const tokens=tokenize(phrase,opts);
            
            if (attr.open) tokens[0][1]={open:attr.open};
            if (tokens.length==1) {
                if (!tokens[0][1]) tokens[0][1]={}; //no attribute
                tokens[0][1].close=attr.close;       //close this token
            } else if (attr.close) {
            	tokens[tokens.length-1][1]={close:attr.close};
            }
            for (let j=0;j<tokens.length;j++){
            	const [lead,tk,tail]=tokenize.splitPunc(tokens[j][0]);
                if (!tk.length) continue;
            	const o={tk,...attr};
            	if (lead) o.lead=lead;if (tail) o.tail=tail;
            	o[this.akey]=tokens[j][1];
                this.data.push(o)
            }
        }
    }
    serialize(markup) {
        const m=markup||this.markup||'plain';
        const serializer=Serializers[m];
        let out='';
        if (!serializer) {
            console.log('no serializer for markup',m)
        } else {
            out=serializer(this);
        }
        return out;
    }
    items(){
        return this.data;
    }
    add(tk,attr){
        this.data.push({tk,attr});
    }
    length(){
        return this.data.length;
    }
    token(i) {
        const o=this.data[i];
        if (o) return o.tk;
    }
    attr(i,akey) {
        const o=this.data[i];
        if (o) return o[akey||this.akey];
    }

}
export default TDenList;
