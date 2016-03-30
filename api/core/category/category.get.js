var queries = require('./category.queries.js');

module.exports = function(){
    return gladys.utils.sql(queries.get, []);
};