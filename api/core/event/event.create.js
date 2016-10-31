var queries = require('./event.queries.js');

module.exports = function create(event){
    
   sails.log.info(`Event : create : new Event with code ${event.code}`);

   // looking if the eventtype exist 
   return gladys.utils.sql(queries.getByCode, [event.code])
        .then(function(types) {
            
            if(types.length === 0){
                return Promise.reject(new Error('EventType not found'));
            }
            
            var eventToSave = {
              eventtype: types[0].id,
              datetime: event.datetime || new Date(),
            };
            
            if(event.user) {
                eventToSave.user = event.user;
            }
            
            if(event.value) {
                eventToSave.value = event.value;
            }
            
            if(event.room) {
                eventToSave.room = event.room;
            }
            
            if(event.house){
                eventToSave.house = event.house;
            }
           
           // inserting the Event in the database
           return Event.create(eventToSave);
        })
        .then(function(eventSaved){
            gladys.scenario.trigger(event);
            return eventSaved;
        });
};
