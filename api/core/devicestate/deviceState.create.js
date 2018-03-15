var Promise = require('bluebird');

/**
 * @public
 * @description This function create an deviceState
 * @name gladys.deviceState.create
 * @param {Object} state
 * @param {float} state.value The value of state
 * @param {Devicetype} state.devicetype The id of deviceType to which state has been assigned
 * @returns {State} state
 * @example
 * var state = {
 *      value: 50,
 *      devicetype: 2
 * }
 * 
 * gladys.deviceState.create(state)
 *      .then(function(state){
 *         // deviceState created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

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