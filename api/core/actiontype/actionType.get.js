var queries = require('./actionType.queries.js');

module.exports = function(){
    return gladys.utils.sql(queries.get, []);
};