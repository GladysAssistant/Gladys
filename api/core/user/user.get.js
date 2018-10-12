var queries = require('./user.queries.js');

module.exports = function get(){
  return gladys.utils.sql(queries.get, []);
};