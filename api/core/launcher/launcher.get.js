var queries = require('./launcher.queries.js');

module.exports = function(options){
  return gladys.utils.sql(queries.get, [options.user.id]);  
};