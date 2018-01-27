var queries = require('./calendar.queries.js');

module.exports = function(options) {
    
    options = options || {};
    
    return gladys.utils.sql(queries.getAllEvents, [options.user.id]);
};