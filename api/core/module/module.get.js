var queries = require('./module.queries.js');

module.exports = function get(options){
  return gladys.utils.sql(queries.get, []);
};