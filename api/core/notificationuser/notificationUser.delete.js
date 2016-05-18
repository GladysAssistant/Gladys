var queries = require('./notificationUser.queries.js');

module.exports = function(notificationUser){
    return gladys.utils.sql(queries.delete, [notificationUser.id]);
};