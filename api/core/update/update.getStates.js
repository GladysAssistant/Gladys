var Promise = require('bluebird');

module.exports = function(user) {
    
    if(!user || !user.language) {
        return Promise.reject(new Error('No user provided'));
    }
    
    return gladys.utils.request(sails.config.update.stateBaseUrl + user.language.substr(0,2) + '.json')
        .then(function(stateTypes) {
            
            if(stateTypes === 'Not Found') return Promise.reject(new Error('Not Found'));
            
            // Insert all stateTypes
            return gladys.stateType.insertBatch(stateTypes)

                // then clean duplicate (due to old versions of Gladys :/)
                .then(() => gladys.stateTypeParam.cleanDuplicate());
        });
};
