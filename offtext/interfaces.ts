export interface KeyValuePair {
    key: string;
    value: string;
}
export interface IOfftag {
	 name: string;
	 attrs: KeyValuePair[];
	 line:nubmer;
     choff:number;
     width:number;
     offset:number;
     endoffset:number; //ending offset of raw offtextline 
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