var Promise = require('bluebird');

module.exports = function(user) {
    return gladys.utils.request(sails.config.update.sentencesBaseUrl + user.language.substr(0,2) + '.json')
        .then(function(sentences) {
             if(sentences === 'Not Found') return Promise.reject('Not Found');
             
            return Promise.map(sentences, function(sentence){
                return gladys.sentence.create(sentence)
                  .catch(function(err){
                     return Promise.resolve(); 
                  });
            });
        });
};
