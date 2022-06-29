export interface KeyValuePair {
    key: string;
    value: string;
}
export interface OffTag {
	 name: string;
	 attrs: KeyValuePair[];
	 y,x,w, offset:number;
}

export interface OffText {
	text : string;
	tags : OffTag[];
}
export interface HTMLTag {
	x:number;       //offset from begining of line
    closing:number; //one-base to opening HTMLTag
    name:string;
    attrs:KeyValuePair[] ;
    y:number;        //relative line index
    w:number;        //width
    tempclose:boolean;
    empty:boolean;
}
export interface RenderOptions {

}