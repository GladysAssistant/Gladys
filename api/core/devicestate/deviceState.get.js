var queries = require('./deviceState.queries.js');

module.exports = function get(options){
    options.take = parseInt(options.take) || 25;
    options.skip = parseInt(options.skip) || 0;

    if(options.devicetype) {
        return gladys.utils.sql(queries.getByDeviceType, [options.devicetype, options.take, options.skip]);
    }  else {
        return gladys.utils.sql(queries.get, [options.take, options.skip]);
    }
};