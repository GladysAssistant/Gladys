var queries = require('./calendar.queries.js');

module.exports = function(options) {
    
    // start date default is today
    var date = new Date();
    
    // end date default is today + 7 days
    var endDate = new Date(date.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    // settings default options if not defined
    options = options || {};
    options.start = options.start || date.toString();
    options.end = options.end || endDate.toString();
    
    return gladys.utils.sql(queries.getNextEvents, [options.user.id, options.take, options.skip]);
};
