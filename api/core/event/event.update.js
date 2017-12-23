const Promise = require('bluebird');

module.exports = function (event){
    var id = event.id;
    delete event.id;

    return Event.update({id}, event)
        .then(function(events) {
        
            if (events.length === 0) {
                return Promise.reject(new Error('Event not found'));
            }

            return events[0];
        });
}