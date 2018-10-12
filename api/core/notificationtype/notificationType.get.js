var queries = require('./notificationType.queries.js');

module.exports = function(){
  return gladys.utils.sql(queries.get, []);
};