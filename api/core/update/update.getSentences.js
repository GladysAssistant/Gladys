var Promise = require('bluebird');

module.exports = function(user) {
    if(!user || !user.language) {
        return Promise.reject(new Error('No user provided'));
    }
    return gladys.utils.request(sails.config.update.sentencesBaseUrl + user.language.substr(0,2) + '.json')
        .then(function(sentences) {
             if(sentences === 'Not Found') return Promise.reject(new Error('Not Found'));
             
            return Promise.map(sentences, function(sentence){
                return gladys.sentence.create(sentence);
            });
        });
};
