var queries = require('./deviceType.queries.js');
var Promise = require('bluebird');

module.exports = function(device){
    
    // get all deviceTypes for a given tag
    return gladys.utils.sql(queries.getByType, [device.type]);
}
