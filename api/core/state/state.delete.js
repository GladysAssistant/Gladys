var queries = require('./state.queries.js');

module.exports = function(state){
    return gladys.utils.sql(queries.delete, [state.id]);
}