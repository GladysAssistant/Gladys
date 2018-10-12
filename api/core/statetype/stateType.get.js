var queries = require('./stateType.queries.js');    

module.exports = function(){
  return gladys.utils.sql(queries.get, []);
};