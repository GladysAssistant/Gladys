var queries = require('./event.queries.js');

/**
 * @public
 * @description This function create an event
 * @name gladys.event.create
 * @param {Object} event
 * @param {String} event.code The event code you want to create
 * @param {integer} event.user The id of the user concerned by the event (only for user-related event) (optional)
 * @param {integer} event.house The id of the house where the events take place (optional)
 * @param {integer} event.room The id of the room where the events take place (optional)
 * @returns {Event} event
 * @example
 * var event = {
 *      code: 'wakeup',
 *      user: 1,
 *      house: 1,
 *      room: 2
 * };
 *
 * gladys.event.create(event)
 *      .then(function(event){
 *         // event created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

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

   var eventType;
     
   // looking if the eventtype exist (by code or by id)
   return gladys.utils.sql(query, [param])
        .then((types) => {
            
            if(types.length === 0){
                return Promise.reject(new Error('EventType not found'));
            }

            eventType = types[0];
            
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
        })
        .then((eventSaved) => {
            gladys.socket.emit('newEvent', {
                id: eventSaved.id,
                name: eventType.name,
                iconColor: eventType.iconColor,
                faIcon: eventType.faIcon,
                datetime: eventSaved.datetime,
                user: eventSaved.user,
                house: eventSaved.user,
                room: eventSaved.room
            });
            return eventSaved;
        });
};