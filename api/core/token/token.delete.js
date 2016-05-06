var queries = require('./token.queries.js');

module.exports = function(token){
  return gladys.utils.sql(queries.delete, [token.id]);  
};