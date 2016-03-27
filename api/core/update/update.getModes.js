var Promise = require('bluebird');

module.exports = function(user) {
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