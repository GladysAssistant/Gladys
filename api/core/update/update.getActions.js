var Promise = require('bluebird');

module.exports = function(user) {
  if(!user || !user.language) {
    return Promise.reject(new Error('No user provided'));
  }
  return gladys.utils.request(sails.config.update.actionTypeUrl + user.language.substr(0, 2) + '.json')
    .then(function(actionTypes) {
      if(actionTypes === 'Not Found') {
        return Promise.reject(new Error('Not Found')); 
      }
            
      return gladys.actionType.insertBatch(actionTypes);
    });
};
