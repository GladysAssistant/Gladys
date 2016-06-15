var queries = require('./deviceState.queries.js');

module.exports = function(identifier, type, state){
    
    // we get the devicetype
    return gladys.utils.sqlUnique(queries.getDeviceTypeByIdentifierAndType, [identifier, type])
      .then(function(deviceType){
          
          // we create the deviceState
          state.devicetype = deviceType.id;
          return gladys.deviceState.create(state);
      });
};