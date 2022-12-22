import {parseAddress} from '../basket/index.ts';

import {RangeAction} from "./rangeaction.ts";

import {GuideAction} from "./guideaction.ts";
import {CustomAction} from "./customaction.ts";
import {ExcerptAction} from "./excerptaction.ts";
import {BooleanExcerptAction} from "./booleanexcerptaction.ts";
import {TitleCountAction} from "./titlecountaction.ts";
import {QueryAction} from "./queryaction.ts";

import {EXCERPTACTIONPREFIX,GUIDEACTIONPREFIX,TITLECOUNTACTIONPREFIX,OWNERDRAWPREFIX} from './baseaction.ts'
export const makeExcerptAddress=(ptkname:string,section:string,tofind:string,chunk='')=>{
	return '*'+section+(chunk?('.'+chunk):'') +'='+tofind; //
}
export const createAction=(addr, depth=0)=>{
	const at=addr.action.indexOf('=');
	const atype=addr.action.slice(0,1);
	if (at>0) {
		if (atype==EXCERPTACTIONPREFIX) {
			if (~addr.action.indexOf('@')) {
				return new BooleanExcerptAction(addr, depth);
			} else {
				return new ExcerptAction(addr, depth);
			}
		} else if (atype==TITLECOUNTACTIONPREFIX) {
			return new TitleCountAction(addr, depth);
		} else {
			return new QueryAction(addr, depth);
		}
	} else {
		if (atype==OWNERDRAWPREFIX) { //ownerdraw
			return new CustomAction(addr, depth);
		} else if (atype==GUIDEACTIONPREFIX) {
			return new GuideAction(addr, depth);
		} else {
			return new RangeAction(addr,depth);
		}
	}
}
export const createNestingAction=(address:string,ctx)=> {
	const addr=parseAddress(address);
	if (!addr) return null;
	//補足文字型可省略的信息
	if (addr.action) ctx.actions[ctx.depth]=addr.action;
	if (addr.ptkname)  ctx.ptknames[ctx.depth]=addr.ptkname;
	addr.action= addr.action || ctx.actions[ctx.depth] || ctx.same_level_action;
	addr.ptkname= addr.ptkname || ctx.ptknames[ctx.depth] || ctx.same_level_ptkname;
	ctx.same_level_ptkname=addr.ptkname;
	ctx.same_level_action=addr.action;
	if (addr.from && addr.till&& addr.till<addr.from) addr.till=addr.from;

	return createAction(addr, ctx.depth);
}