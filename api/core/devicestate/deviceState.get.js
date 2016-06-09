var queries = require('./deviceState.queries.js');

module.exports = function get(options){
    options.take = parseInt(options.take) || 25;
    options.skip = parseInt(options.skip) || 0;
    
    return gladys.utils.sql(queries.get, [options.devicetype, options.take, options.skip]);
};