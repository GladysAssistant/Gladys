var queries = require('./house.queries.js');

module.exports = function(room){
    return gladys.utils.sqlUnique(queries.deleteRoom, [room.id]);
};