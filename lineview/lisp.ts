export enum LispToken{
  Opening=1,
  Closing=2,
  Action=3,
}
function readToken (token) {
  if (token === '(') {
    return {type:LispToken.Opening, value:null};
  } else if (token === ')') { 
    return {type:LispToken.Closing, value:null};
  } else {
    return {type:LispToken.Action, value: token };
  }
}

export function tokenize (expression) {
  return expression
  .replace(/\(/g, ' ( ')
  .replace(/\)/g, ' ) ')
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