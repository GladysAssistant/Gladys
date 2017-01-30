var queries = require('./deviceType.queries.js');

module.exports = function(options){
    return gladys.utils.sql(queries.getDeviceTypeByCategory, [options.category, options.room, options.room, options.type, options.type]);
};