var queries = require('./notification.queries.js');

module.exports = function (options){
    
    options = options || {};
    options.take = parseInt(options.take) || 50;
    options.skip = parseInt(options.skip) || 0;
    
    return gladys.utils.sql(queries.get, [options.user.id, options.take, options.skip]);
};