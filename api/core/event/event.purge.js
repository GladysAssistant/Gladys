var queries = require('./event.queries.js');

module.exports = function purge(options) {

    options.days = parseInt(options.days) || 10;
    return gladys.utils.sql(queries.purge, [options.days]);
};