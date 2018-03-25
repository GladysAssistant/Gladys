const queries = require('./deviceState.queries');

module.exports = function(state) {
    
    if (state.value === true || state.value == 'true') {
        state.value = 1;
    } else if (state.value === false || state.value == 'false') {
        state.value = 0;
    }

    return DeviceState.create(state)

      // update denormalized field in deviceType table
      .then((state) => gladys.utils.sql(queries.updateDeviceTypeLastValue, [state.value, state.datetime, state.devicetype, state.datetime]).then(() => state))
      .then((state) => {

         // broadcast news to everyone
         gladys.socket.emit('newDeviceState', state); 

         var event = {
           code: 'devicetype-new-value',
           value: state.devicetype, 
           scope: state
         };

         return [state, gladys.event.create(event)]; 
      })
      .spread((state, event) => state);
}