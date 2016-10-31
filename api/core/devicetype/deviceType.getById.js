var queries = require('./deviceType.queries.js');

module.exports = function(device){
    return gladys.utils.sqlUnique(queries.getById, [device.id]);
}
