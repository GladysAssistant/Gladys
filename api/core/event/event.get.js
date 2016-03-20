var queries = require('./event.queries.js');

module.exports = function(options){
    options = options || {};
    options.skip = parseInt(options.skip) || 0;
    options.take = parseInt(options.take) || 50;

    return gladys.utils.sql(queries.getByUser, [options.user.id, options.take, options.skip]);
};