var queries = require('./area.queries.js');

module.exports = function(area){
    return gladys.utils.sql(queries.delete, [area.id]);
};