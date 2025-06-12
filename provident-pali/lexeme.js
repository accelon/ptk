
export const NormLexeme={
	'bODI':'bOjVJ',
	'smVbODI':'smVbOjVJ',
	// 'vVyy':'bVby',
	// 'vVyyYV':'bVbyYV', //can be removed if smarter
}
export const DeNormLexeme={}
export const samecount=(s1,s2)=>{
	let c=0,i1=0,i2=0;
	while (i1 < s1.length&&i2<s2.length) {
		if (s1[i1]==s2[i2]) c++;
		else break;
		i1++;i2++;
	}
	return c;
}
export const sameendcount=(s1,s2)=>{
	let c=0,i1=s1.length-1,i2=s2.length-1;
	while (i1>0&&i2>0) {
		if (s1[i1]==s2[i2]) c++;
		else break;
		i1--;i2--;
	}
	return c;
}
for (let key in NormLexeme) {
	const rkey=NormLexeme[key];
	if (key.indexOf('>')>-1) continue;
	const cnt=samecount(rkey,key);
	if (cnt) {
		DeNormLexeme[rkey]=cnt?(key.slice(0,cnt)+'<'+key.slice(cnt)):key;
	} else {
		const cnt=sameendcount(rkey,key);
		DeNormLexeme[rkey]=cnt?(key.slice(0,key.length-cnt)+'>'+key.slice(key.length-cnt)):key;
	}
}

// console.log('denor',DeNormLexeme)