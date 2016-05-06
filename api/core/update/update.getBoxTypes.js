var Promise = require('bluebird');

module.exports = function(user) {
    if(!user || !user.language) {
        return Promise.reject(new Error('No user provided'));
    }
    
    return gladys.utils.request(sails.config.update.boxTypesBaseUrl + user.language.substr(0,2) + '.json')
        .then(function(boxTypes) {
            if(boxTypes === 'Not Found') return Promise.reject('Not Found');
            
            return Promise.map(boxTypes, function(type){
                return gladys.boxType.create(type)
                  .catch(function(err){
                     return Promise.resolve(); 
                  });
            });
        });
};
