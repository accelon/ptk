const isStopChar=ch=>{
    return ch==='的' || ch=='了' || ch=='是'||ch==='之'||ch=='矣'||ch==='與'||ch==='曰'||ch==='曰'
}
class nGram {
    constructor (opts) {
        this.gram=opts.gram;
        this.stockgram=opts.stockgram;
        this.ngram={};
    }
    add(content:string){
        for (let j=0;j<content.length;j++) {
            let prev=0;
            let line=content[j];
            //if (this.lemma) line=removeLemma(content[j],this.lemma);
            for (let i=0;i<line.length;i++) {
                const cp=line.charCodeAt(i);
                if (cp>=0x3400 && cp<=0x9FFF) { //BMP CJK ONLY
                    if (prev) {
                        let pass=true;
                        if (this.stockgram) {
                            pass=!!this.stockgram[prev];
                        } 
                        if (pass) {
                            const g=prev+line.charAt(i);
                            if (!this.ngram[g]) this.ngram[g]=0;
                            this.ngram[g]++;        
                        }
                    }
                    prev+=line[i];
                    if (prev.length>=this.gram) {
                        prev=prev.substr(1);
                    }
                } else {
                    prev='';
                }
            }
        }
    }
    dump() {
        let out=[],total=0;
        for (let g in this.ngram) {
            out.push([g,this.ngram[g]]);
            total+=this.ngram[g];
        }
        const average=total/out.length;
        out=out.filter(a=>a[1]>average*3 && a[1]>10);
        const result=out.sort((a,b)=>b[1]-a[1]);
        return {filename:'ngram-'+this.gram+'.txt', result};
    }

}

export default nGram;