var queries = require('./deviceState.queries.js');

module.exports = function purge(options){
    options.days = parseInt(options.days) || 60;
    
    return gladys.utils.sql(queries.purge, [options.devicetype, options.days]);
};
