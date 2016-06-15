module.exports = get;

var queries = require('./device.queries.js');

function get(options) {

    return gladys.utils.sql(queries.getByService, [options.service])
}
