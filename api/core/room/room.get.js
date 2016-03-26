var queries = require('./room.queries.js');

module.exports = function(options){
    
  options = options || {};
  options.skip = parseInt(options.skip) || 0;
  options.take = parseInt(options.take) || 50;
  
  return gladys.utils.sql(queries.get, [options.take, options.skip]);  
};