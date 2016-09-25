var queries = require('./deviceType.queries.js');
var Promise = require('bluebird');

module.exports = function(device){

    // get state for a given devicetype id
    return gladys.utils.sql(queries.getById, [device.id]);
}
