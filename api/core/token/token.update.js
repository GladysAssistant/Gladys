var Promise = require('bluebird');

module.exports = function(token){
  var id = token.id;
  delete token.id;
  
  return Token.update({id}, token)
    .then(function(tokens){
      if(tokens.length){
        return tokens[0];
      } else {
        return Promise.reject(new Error('NotFound'));
      }
    });
};