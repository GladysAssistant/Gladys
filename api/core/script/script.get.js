var queries = require('./script.queries.js');

module.exports = function(options) {

    // default params
    options = options || {};
    options.skip = parseInt(options.skip) || 0;
    options.take = parseInt(options.take) || 50;

    return gladys.utils.sql(queries.getScripts, [options.user.id, options.take, options.skip]);
};
