var queries = require('./room.queries.js');

module.exports = function(){
  return gladys.utils.sql(queries.getAll, []);  
};