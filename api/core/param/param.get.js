var queries = require('./param.queries.js');

module.exports = function(){
  return gladys.utils.sql(queries.get, []);  
};