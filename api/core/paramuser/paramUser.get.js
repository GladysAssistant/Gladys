var queries = require('./paramUser.queries.js');

module.exports = function(user){
    return gladys.utils.sql(queries.get, [user.id]);  
};