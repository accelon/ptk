export enum LispToken{
  Opening=1,
  Closing=2,
  Integer=3,
  Range=4,
  Symbol=5,
  Address=6,
}
function readToken (token) {
  if (token === '(') {
    return {type:LispToken.Opening, value:null};
  } else if (token === ')') { 
    return {type:LispToken.Closing, value:null};
  } else if (token.match(/^\d+$/)) {
    return {type:LispToken.Integer, value:parseInt(token) };
  } else if (token.match(/^[a-z]*\d+~\d+$/)) {
    return {type:LispToken.Range,  value: token };
  } else if (token.match(/^@.+/)){
    return {type:LispToken.Address,  value: token};
  } else {
    return {type:LispToken.Symbol, value: token };
  }
}

export function tokenize (expression) {
  return expression
  .replace(/\(/g, ' ( ')
  .replace(/\)/g, ' ) ')
  .replace(/(\d+)~(\d+)/g, ' $1~$2 ') 
  .trim().split(/[\+\s]+/).map(readToken);
}

export function buildAST (tokens) {
  return tokens.reduce((ast, token) => {
    if (token.type === LispToken.Opening) {
      ast.push([]);
    } else if (token.type === LispToken.Closing) {
      const current_expression = ast.pop();
      ast[ast.length - 1].push(current_expression);
    } else {
      const current_expression = ast.pop();
      current_expression.push(token);
      ast.push(current_expression);
    }　 
    return ast;
  }, [[]])[0][0];
}

export function parseLisp (expression) {
  return buildAST(tokenize(expression));
}