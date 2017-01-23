var queries = require('./calendar.queries.js');

module.exports = function getByService(service) {
    return gladys.utils.sql(queries.getByService, [service]);
};