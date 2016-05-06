var Promise = require('bluebird');

module.exports = function(user) {
    if(!user || !user.language) {
        return Promise.reject(new Error('No user provided'));
    }
    return gladys.utils.request(sails.config.update.eventsBaseUrl + user.language.substr(0,2) + '.json')
        .then(function(events) {
            if(events === 'Not Found') return Promise.reject('Not Found');
            
            return Promise.map(events, function(event){
                return gladys.eventType.create(event)
                  .then(function(newEventType){
                      
                      // if eventtype has params, add all params
                      if(event.params){
                          return [newEventType, gladys.launcherParam.insertBatch(newEventType.id, event.params)]
                      } else {
                          return [newEventType, []];
                      }
                  })
                  .spread(function(newEventType, params){
                      newEventType.params = params;
                      return newEventType;
                  })
                  .catch(function(err){
                     return Promise.resolve(); 
                  });
            });
        });
};
