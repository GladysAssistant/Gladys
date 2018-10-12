var Promise = require('bluebird');

module.exports = function(user) {
  if(!user || !user.language) {
    return Promise.reject(new Error('No user provided'));
  }
  return gladys.utils.request(sails.config.update.answersUrl + user.language.substr(0, 2) + '.json')
    .then(function(answers) {
      if(answers === 'Not Found') {
        return Promise.reject(new Error('Not Found')); 
      }
            
      return gladys.answer.insertBatch(answers);
    });
};
