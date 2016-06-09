var Promise = require('bluebird');

module.exports = function(user) {
    if(!user || !user.language) {
        return Promise.reject(new Error('No user provided'));
    }
    
    return gladys.utils.request(sails.config.update.categoryBaseUrl + user.language.substr(0,2) + '.json')
        .then(function(categories) {
            if(categories === 'Not Found') return Promise.reject(new Error('Not Found'));
            
            // promise.each so it's inserted in the right order
            return Promise.each(categories, function(category){
                return gladys.category.create(category);
            });
        });
};
