var queries = require('./calendar.queries.js');

module.exports = function(options) {
    
    // start date default is today at 00:00
    var date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);

    
    // end date default is today at the end of the day
    var endDate = new Date();
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    
    // settings default options if not defined
    options = options || {};
    options.start = options.start || date.toString();
    options.end = options.end || endDate.toString();
    
    return gladys.utils.sql(queries.getEventsDates, [options.user.id, options.start, options.end]);
};
