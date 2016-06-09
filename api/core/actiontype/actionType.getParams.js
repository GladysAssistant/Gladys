var queries = require('./actionType.queries.js');

module.exports = function(options){
    return gladys.utils.sql(queries.getParams, [options.id]);
};