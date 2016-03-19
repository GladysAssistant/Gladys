var queries = require('./boxType.queries.js');

module.exports = function getAll(){
    return gladys.utils.sql(queries.getAll, []);
};