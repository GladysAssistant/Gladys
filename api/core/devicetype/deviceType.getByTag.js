var queries = require('./deviceType.queries.js');

module.exports = function(options){
    return gladys.utils.sql(queries.getDeviceTypeByTag, [options.tag]);
};