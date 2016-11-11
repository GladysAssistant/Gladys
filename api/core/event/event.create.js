var queries = require('./event.queries.js');

module.exports = function create(event){

   var query = queries.getByCode;
   var param = event.code;

   // handling scenario
   if(event.params && event.params.eventtype) {
       query = queries.getById;
       param = event.params.eventtype;
       event = event.params;
       sails.log.info(`Event : create : new Event with eventtype id : ${event.eventtype}`);
   } else {
       sails.log.info(`Event : create : new Event with code : ${event.code}`);
   }
     
   // looking if the eventtype exist (by code or by id)
   return gladys.utils.sql(query, [param])
        .then(function(types) {
            
            if(types.length === 0){
                return Promise.reject(new Error('EventType not found'));
            }
            
            var eventToSave = {
              eventtype: types[0].id,
              datetime: event.datetime || new Date(),
            };

            event.code = types[0].code;
            
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
