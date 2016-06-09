
module.exports = function(calendarEvent){
    var id = calendarEvent.id;
    delete calendarEvent.id;
    return CalendarEvent.update({id}, calendarEvent)
        .then(function(calendarEvents){
            
            if(calendarEvents.length === 0){
                return Promise.reject(new Error('CalendarEvent not found'));
            } else {
                return Promise.resolve(calendarEvents[0]);
            }
        });
};