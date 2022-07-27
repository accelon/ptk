export interface KeyValuePair {
    key: string;
    value: string;
}
export interface IOfftag {
	 name: string;
	 attrs: KeyValuePair[];
     offset: number ; //標籤起點
     aoffset:number;  //屬性起點
     choff:number;   //正字串座標 (UTF16)
     width:number;   //正字串包夾文字長度 (UTF16)
     start:number; //包夾文字起點 (標籤終點)
     end:number; //包夾文字終點
     line:nubmer;    //行號
     active:boolean; 
}

export interface IOfftext {
	text : string;
	tags : Offtag[];
}
// export interface HTMLTag {
// 	x:number;       //offset from begining of line
//     closing:number; //one-base to opening HTMLTag
//     name:string;
//     attrs:KeyValuePair[] ;
//     y:number;        //relative line index
//     w:number;        //width
//     tempclose:boolean;
//     empty:boolean;
// }
export interface IRenderUnit {
    token:Token,   //raw token from tokenize
    open  :IOfftag, //tag open at this token
    close :IOfftag, //tag close at this token
    text :string,  //the text to display
    css  :string,  //the classes of css
    hide: boolean, //hide the text
}
export interface RenderOptions {

}