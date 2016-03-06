var queries = require('./token.queries.js');

module.exports = function verify(token){
  return gladys.utils.sqlUnique(queries.getTokenUser, [token]);
};