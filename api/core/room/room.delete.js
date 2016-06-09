var queries = require('./room.queries.js');

module.exports = function(room){
    return gladys.utils.sqlUnique(queries.delete, [room.id]);
};