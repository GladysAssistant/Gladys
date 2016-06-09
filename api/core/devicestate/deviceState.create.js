var Promise = require('bluebird');

module.exports = function(state){
    return DeviceState.create(state)
      .then(function(state){
         var event = {
           code: 'devicetype-new-value',
           value: state.devicetype, 
           scope: state
         };
         return [state, gladys.event.create(event)]; 
      })
      .spread(function(state, event){
         return state; 
      });
}