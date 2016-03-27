var Promise = require('bluebird');

module.exports = function(user) {
    return gladys.utils.request(sails.config.update.eventsBaseUrl + user.language.substr(0,2) + '.json')
        .then(function(events) {
            if(events === 'Not Found') return Promise.reject('Not Found');
            
            return Promise.map(events, function(event){
                return gladys.eventType.create(event)
                  .catch(function(err){
                     return Promise.resolve(); 
                  });
            });
        });
};
