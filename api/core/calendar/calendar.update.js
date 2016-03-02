var Promise = require('bluebird');

module.exports = function(calendar){
    var id = calendar.id;
    delete calendar.id;
    
    // we update the calendar
    return Calendar.update({id}, calendar)
        .then(function(calendars){
            
            if(calendars.length === 0){
                return Promise.reject(new Error('Calendar not found'));
            } else {
                return Promise.resolve(calendars[0]);
            }
        });
};