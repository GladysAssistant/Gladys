var queries = require('./notificationUser.queries.js');

module.exports = function(user){
  return gladys.utils.sql(queries.get, [user.id]);
};