export const escapeHTML=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const Entities={
	lt:'<',gt:'>','amp':'&',
	'eacute':'é',
	'agrave':'à',
	'hellip':'…',
	'igrave':'ì',
	'ugrave':'ù',
	'ntilde':'ñ','Ntilde':'Ñ',
	'nbsp':' ','quot':'"',"ucirc":'û','acirc':'â','icirc':'î'
}

export const entity2unicode=s=>{
    s=s.replace(/&#x([\dABCDEF]{3,20});/g,(m,m1)=>{
        return String.fromCodePoint( parseInt(m1,16));
    }).replace(/&#(\d{2,5});/g,(m,m1)=>{
        return String.fromCodePoint( parseInt(m1,10));
    }).replace(/&([^;]{5,20});/g,(m,m1)=>{
    	const rep=Entities[m1];
    	if (!rep) {
    		console.log('cannot parse','&'+m1+';');
    		throw "wrong entity ";
    	}
    	return rep;
    });
    return s;
}
