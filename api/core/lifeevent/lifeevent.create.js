var queries = require('./lifeevent.queries.js');

module.exports = function create(lifeevent){
    
   // looking if the eventtype exist 
   return gladys.utils.sql(queries.getByCode, [lifeevent.code])
        .then(function(types) {
            
            if(types.length === 0){
                return Promise.reject(new Error('EventType not found'));
            }
            
            lifeevent.eventtype = types[0].id;
            delete lifeevent.code;
           
           // inserting the lifeEvent in the database
           return LifeEvent.create(lifeevent); 
        });
};