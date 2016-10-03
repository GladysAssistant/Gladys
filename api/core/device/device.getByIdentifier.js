module.exports = get;

var queries = require('./device.queries.js');

function get(options) {
    return gladys.utils.sqlUnique(queries.getByIdentifier, [options.identifier, options.service]);
}
