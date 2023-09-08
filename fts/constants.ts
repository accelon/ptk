export const TOKENIZE_REGEX=/(([\u0021-\u1fff]+)|([\u2000-\u2fff\u3001-\uffff]+))/g
export const CJKWord_Reg=/([\u2e80-\u2fd5\u3400-\u9fff\ud400-\udfff\ue000\uffff]+)/g;
export const CJKWordEnd_Reg=/([\u2e80-\u2fd5\u3400-\u9fff\ud400-\udfff\ue000\ufadf]+$)/;
export const CJKWordBegin_Reg=/(^[\u2e80-\u2fd5\u3400-\u9fff\ud400-\udfff\ue000\uffff]+)/;
export const Word_tailspace_Reg=/([\dA-Za-z\u1000-\u1049\u0900-\u0963\u96f\u00c0-\u02af\u1e00-\u1faf][\dA-Za-z\u1000-\u1049\u0900-\u0963\u96f\u00c0-\u02af\u1e00-\u1faf\d]* ?)/g;

export const MAXPHRASELEN = 16;
export const EXCERPT_PAGESIZE = 5;