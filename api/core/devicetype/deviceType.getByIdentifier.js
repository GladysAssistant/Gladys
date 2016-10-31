var queries = require('./deviceType.queries.js');

module.exports = function(options){
    return gladys.utils.sqlUnique(queries.getByIdentifier, [options.deviceIdentifier, options.deviceService, options.deviceTypeIdentifier]);
};