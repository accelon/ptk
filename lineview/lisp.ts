export enum LispToken{
  Opening=1,
  Closing=2,
  // Integer=3,
  // Range=4,
  // Symbol=5,
  Address=6,
}
function readToken (token) {
  if (token === '(') {
    return {type:LispToken.Opening, value:null};
  } else if (token === ')') { 
    return {type:LispToken.Closing, value:null};
  // } else if (token.match(/^\d+$/)) {
  //   return {type:LispToken.Integer, value:parseInt(token) };
  // } else if (token.match(/^[a-z]*\d+~\d+$/)) {
  //   return {type:LispToken.Range,  value: token };
  // } else if (token.match(/^@.+/)){
  //   return {type:LispToken.Address,  value: token};
  // } else {
  } else {
    return {type:LispToken.Address, value: token };
  }
}

export function tokenize (expression) {
  return expression
  .replace(/\(/g, ' ( ')
  .replace(/\)/g, ' ) ')
  // .replace(/(\d+)~(\d+)/g, ' $1~$2 ') 
  .trim().split(/[\+\s]+/).map(readToken);
}

export function buildAST (tokens) {
  let depth=0;
  const out=[];
  for (let i=0;i<tokens.length;i++) {
    const token=tokens[i];
    if (token.type==LispToken.Opening) {
      depth++;
    } else if (token.type==LispToken.Closing) {
      if (depth>0) depth--;
    } else {
      out.push([depth, token.value])
    }
  }
  return out;
}

export function parseLisp (expression) {
  return buildAST(tokenize(expression));
}