var queries = require('./script.queries.js');

module.exports = function(options) {

    // default params
    options = options || {};

    return gladys.utils.sql(queries.getScripts, [options.user.id]);
};
