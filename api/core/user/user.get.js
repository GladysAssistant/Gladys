var queries = require('./user.queries.js');

module.exports = function get(options){
    
    options = options || {};
    options.take = parseInt(options.take) || 50;
    options.skip = parseInt(options.skip) || 0;
    
    return gladys.utils.sql(queries.get, [options.take, options.skip]);
};