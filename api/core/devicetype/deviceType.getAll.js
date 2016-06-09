var queries = require('./deviceType.queries.js');

module.exports = function(){
    return gladys.utils.sql(queries.getAll, []);
};