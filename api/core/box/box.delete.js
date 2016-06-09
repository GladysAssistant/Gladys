var queries = require('./box.queries.js');

module.exports = function(box){
    return gladys.utils.sql(queries.delete, [box.id]);
};