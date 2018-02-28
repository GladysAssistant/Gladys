const queries = require('./location.queries');

module.exports = function getUser(options) {
    options = options || {};
    options.take = parseInt(options.take) || 50;
    options.skip = parseInt(options.skip) || 0;
    options.accuracy = options.accuracy  || 300;

    return gladys.utils.sql(queries.getLocationsUserPaginated, [options.user, options.accuracy, options.take, options.skip]);
};