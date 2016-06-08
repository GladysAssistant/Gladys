var queries = require('./eventType.queries.js');

module.exports = function(){
  return gladys.utils.sql(queries.get, []);  
};