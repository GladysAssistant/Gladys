var queries = require('./box.queries.js');

module.exports = function (options){
  return gladys.utils.sql(queries.get, [options.user.id]);  
};