var Promise = require('bluebird');

module.exports = function(action){
  var id = action.id;
  delete action.id;
    
  return Action.update({id}, action)
    .then(function(actions){
      if(actions.length){
        return actions[0];
      } else {
        return Promise.reject(new Error('NotFound'));
      }
    });
};