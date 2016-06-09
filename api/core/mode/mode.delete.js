var queries = require('./mode.queries.js');

module.exports = function(mode){
    return gladys.utils.sql(queries.delete, mode.id);
};