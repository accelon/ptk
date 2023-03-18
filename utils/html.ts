export const escapeHTML=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const Entities={
	lt:'<',gt:'>','amp':'&',
	'ntilde':'ñ','Ntilde':'Ñ',
	'nbsp':' ','quot':'"',"ucirc":'û','acirc':'â','icirc':'î'
}

export const entity2unicode=s=>{
    s=s.replace(/&#x([\dABCDEF]+);/g,(m,m1)=>{
        return String.fromCodePoint( parseInt(m1,16));
    }).replace(/&#(\d+);/g,(m,m1)=>{
        return String.fromCodePoint( parseInt(m1,10));
    }).replace(/&([^;]+);/g,(m,m1)=>{
    	const rep=Entities[m1];
    	if (!rep) {
    		console.log('cannot parse','&'+m1+';');
    		throw "wrong entity";
    	}
    	return rep;
    });
    return s;
}
