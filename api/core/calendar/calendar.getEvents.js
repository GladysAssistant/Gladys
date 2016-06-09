var queries = require('./calendar.queries.js');

module.exports = function(options) {
    
    options = options || {};
    options.take = options.take || 50;
    options.skip = options.skip || 0;
    
    return gladys.utils.sql(queries.getNextEvents, [options.user.id, options.take, options.skip]);
};
