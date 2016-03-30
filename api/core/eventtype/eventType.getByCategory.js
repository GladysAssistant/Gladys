var queries = require('./eventType.queries.js');

module.exports = function(options){
  return gladys.utils.sql(queries.getByCategory, [options.category]);  
};