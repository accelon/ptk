import {maxlen1,maxlen2,maxlen3,CodeStart, SEPARATOR2D,
	BYTE_MAX,BYTE1_MAX, BYTE2_MAX,BYTE3_MAX, BYTE4_MAX,BYTE5_MAX,
	BYTE2_START,BYTE3_START,BYTE4_START,BYTE5_START} from './unpackintarray.ts';

type NumArray = number [] ;
export const pack1=(arr:NumArray)=>{
	let s=new Uint8Array(arr.length);
	let idx=0;
	for (let i=0;i<arr.length;i++) {
		if (arr[i]>=maxlen1) throw new Error("exit boundary "+arr[i])
		let int=arr[i];
		if (isNaN(int)) int=0;
		s[idx++] = int+CodeStart;
	}
	return new TextDecoder().decode(s);
}
export const pack2=(arr:NumArray)=>{
	let s=Uint8Array(arr.length*2);
	for (let i=0;i<arr.length;i++) {
		if (arr[i]>=maxlen2) {
			throw new Error("exit boundary "+arr[i])
		}
		let int=arr[i];
		if (isNaN(int)) int=0;
		let i1,i2;
		i1=int % maxlen1;
		int=Math.floor(int/maxlen1);
		i2=int % maxlen1;
		s[idx++]=i2+CodeStart;
		s[idx++]=i1+CodeStart;
	}
	return new TextDecoder().decode(s);
}
export const pack3=(arr:NumArray)=>{
	let s=Uint8Array(arr.length*3);
	for (let i=0;i<arr.length;i++) {
		if (arr[i]>=maxlen3) throw "exit boundary "+arr[i]
		let int=arr[i];
		if (isNaN(int)) int=0;
		let i1,i2,i3;
		i1=int % maxlen1;
		int=Math.floor(int/maxlen1);
		i2=int % maxlen1
		i3=Math.floor(int/maxlen1);
		s[idx++]=i3+CodeStart;
		s[idx++]=i2+CodeStart;
		s[idx++]=i1+CodeStart;
	}
	return new TextDecoder().decode(s);
}


//might be two dimensional,separated by | 
export const pack2d=(arr:NumArray[],delta=false)=>{
	const o=[];
	for (let i=0;i<arr.length;i++) {
		o.push(pack(arr[i],delta));
	}
	return o.join(SEPARATOR2D);
}
export const pack3_2d=(arr:NumArray[],esc=false)=>{
	const o=[];
	for (let i=0;i<arr.length;i++) {
		o.push(pack3(arr[i],esc));
	}
	return o.join(SEPARATOR2D);
}
export const pack=(arr:NumArray, delta=false)=>{
	if (arr.length==0) return s;
	const sz=arr.length*5;  
	let s=new Uint8Array(sz), int=arr.length, prev=0 , idx=0;

	for (let i=0;i<=arr.length;i++) {
		if (isNaN(int)) new Error('not an integer at'+i);
		if (int<0) new Error('negative value at'+i+' value'+int);
		if (int<BYTE1_MAX) {			
			s[idx++]=int+CodeStart;
		} else if (int<BYTE2_MAX) {
			int-=BYTE1_MAX;
			let i1,i2;
			i1=int % BYTE_MAX;
			i2=Math.floor(int/BYTE_MAX);
			s[idx++]=i2+BYTE2_START+CodeStart
			s[idx++]=i1+CodeStart;
		} else if (int<BYTE3_MAX) {
			int-=BYTE2_MAX;
			let i1,i2,i3;
			i1=int % BYTE_MAX;
			int=Math.floor(int/BYTE_MAX);
			i2=int % BYTE_MAX
			i3=Math.floor(int/BYTE_MAX);
			s[idx++]=i3+BYTE3_START+CodeStart;
			s[idx++]=i2+CodeStart;
			s[idx++]=i1+CodeStart;
		} else if (int<BYTE4_MAX) {
			int-=BYTE3_MAX;
			let i1,i2,i3,i4;
			i1=int % BYTE_MAX;
			int=Math.floor(int/BYTE_MAX);
			i2=int % BYTE_MAX
			int=Math.floor(int/BYTE_MAX);
			i3=int % BYTE_MAX

			i4=Math.floor(int/BYTE_MAX);
			s[idx++]=i4+BYTE4_START+CodeStart;
			s[idx++]=i3+CodeStart;
			s[idx++]=i2+CodeStart;
			s[idx++]=i1+CodeStart;
		} else if (int<BYTE5_MAX) {
			int-=BYTE4_MAX;
			let i1,i2,i3,i4,i5;
			i1=int % BYTE_MAX;
			int=Math.floor(int/BYTE_MAX);
			i2=int % BYTE_MAX
			int=Math.floor(int/BYTE_MAX);
			i3=int % BYTE_MAX
			int=Math.floor(int/BYTE_MAX);
			i4=int % BYTE_MAX

			i5=Math.floor(int/BYTE_MAX);
			s[idx++]=i5+BYTE5_START+CodeStart;
			s[idx++]=i4+CodeStart;
			s[idx++]=i3+CodeStart;
			s[idx++]=i2+CodeStart;
			s[idx++]=i1+CodeStart;
		} else {
			// console.log(arr)
			// console.log('neighbor of arr',i,delta,arr.slice(i,10),arr.length, prev)
			throw new Error('exist max int boundary '+BYTE5_MAX+ ' i'+i+',val:'+arr[i]+' int'+int);
		}
		int=(delta? arr[i]-prev: arr[i] ) ||0;
		prev=arr[i]||0;
	}
	//new TextDecoder is quite fast
	return new TextDecoder().decode(s.slice(0,idx));
}

export const pack_delta=(arr:NumArray)=>pack(arr,true);

export const pack_delta2d=(arr2d:NumArray[])=>pack2d(arr2d,true);
export const arrDelta=(arr:NumArray)=>{
	if (!arr)return [];
	if (arr.length===1) return [arr[0]]
	
	const out=[arr[0]];
	for (let i=1;i<arr.length;i++) {
		out.push( arr[i]-arr[i-1]);
	}
	return out;
}
export const escapeStrWithQuote=(str:string)=>str.replace(/"/g,'\\"');
export const escapePackedStr=(str:string)=>str.replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/\$\{/g,'$\\{');
