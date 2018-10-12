var Promise = require('bluebird');

module.exports = function (state){
  var id = state.id;
  delete state.id;
  return State.update({id}, state) 
    .then(function(states){
      if(states.length){
        return states[0];
      } else {
        return Promise.reject(new Error('NotFound'));
      }
    });
};