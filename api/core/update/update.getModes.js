var Promise = require('bluebird');

module.exports = function(user) {
    if(!user || !user.language) {
        return Promise.reject(new Error('No user provided'));
    }
    return gladys.utils.request(sails.config.update.modesBaseUrl + user.language.substr(0,2) + '.json')
        .then(function(modes) {
            if(modes === 'Not Found') return Promise.reject('Not Found');
            
            return Promise.map(modes, function(mode){
                return gladys.mode.create(mode)
                  .catch(function(err){
                     return Promise.resolve(); 
                  });
            });
        });
};