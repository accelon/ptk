function readToken (token) {
  if (token === '(') {
    return {type: 'OPENING_PARENS'};
  } else if (token === ')') { 
    return {type: 'CLOSING_PARENS'};
  } else if (token.match(/^\d+$/)) {
    return {type: 'INTEGER',value: parseInt(token) };
  } else if (token.match(/^[a-z]*\d+~\d+$/)) {
    return {type: 'RANGE', value: token };
  } else {
    return {type: 'SYMBOL', value: token };
  }
}

export function tokenize (expression) {
  return expression
  .replace(/\(/g, ' ( ')
  .replace(/\)/g, ' ) ')
  .replace(/([a-z]*\d+)~(\d+)/g, ' $1~$2 ')
  .trim().split(/[\+\s]+/).map(readToken);
}

export function buildAST (tokens) {
  return tokens.reduce((ast, token) => {
    if (token.type === 'OPENING_PARENS') {
      ast.push([]);
    } else if (token.type === 'CLOSING_PARENS') {
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