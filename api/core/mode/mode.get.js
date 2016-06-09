var queries = require('./mode.queries.js');

module.exports = function(){
  return gladys.utils.sql(queries.get, []);
};