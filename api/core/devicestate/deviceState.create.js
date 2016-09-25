var Promise = require('bluebird');

module.exports = function(state){
    
    if (state.value === true || state.value == 'true') {
        state.value = 1;
    } else if (state.value === false || state.value == 'false') {
        state.value = 0;
    }

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

         // broadcast news to everyone
         gladys.socket.emit('newDeviceState', state); 

         return state; 
      });
}