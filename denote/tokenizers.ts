export const isIASTToken=w=>w.match(/^[a-zA-Zḍṭṇñḷṃṁṣśṅṛāīūâîû]+\d*$/);
export const tokenizeIAST=(str,opts={})=>{
    const pattern=opts.pattern||/([a-zA-Zḍṭṇñḷṃṁṣśṅṛāīūâîû]+\d*)/ig
    let o=str.split(pattern).filter(it=>!!it);
    if (opts.removeBlank) o=o.filter(isIASTToken);
    if (opts.tokenOnly) return o;
    else return o.map(raw=>{return [raw,null]});
}

tokenizeIAST.splitPunc=str=>str;
tokenizeIAST.isToken=isIASTToken;

export const tokenizeIASTPunc=(str,opts={})=>{
    opts.pattern=/([“‘]*[a-zA-Zḍṭṇñḷṃṁṣśṅṛāīūâîû]+\d*[’।॥\.,;?\!…”–]* *)/ig
    return tokenizeIAST(str,opts);
}
tokenizeIASTPunc.splitPunc=token=>{
    const mlead=token.match(/^([“‘]*)/);
    let lead,tail;
    if (mlead) {
    	lead=mlead[1];
		token=token.slice(lead.length);
	}
	const mtail=token.match(/(\d*[’।॥\.,;?\!…”–]* *)$/);
	if (mtail) {
		tail=mtail[1];
		token=token.slice(0,token.length-tail.length);
	}
    return [ lead, token,tail];
}
tokenizeIASTPunc.isToken=w=>w.match(/^([“‘]*[a-zA-Zḍṭṇñḷṃṁṣśṅṛāīūâîû]+\d*[’।॥\.,;?\!…”–]* *)$/)
export default {'iast':tokenizeIASTPunc};