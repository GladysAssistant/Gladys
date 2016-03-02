var queries = require('./house.queries.js');

module.exports = function get (options){
    
    options = options || {};
    options.take = options.take || 50;
    options.skip = options.skip || 0;
    
    return gladys.utils.sql(queries.get, [options.user.id, options.take, options.skip]);
};