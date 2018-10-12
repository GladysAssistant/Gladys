var queries = require('./user.queries.js');

module.exports = function (user){
  return gladys.utils.sql(queries.delete, [user.id]);
};