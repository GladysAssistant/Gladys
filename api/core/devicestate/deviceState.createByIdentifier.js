var queries = require('./deviceState.queries.js');

module.exports = function(identifier, service, type, state){
    
    // we get the devicetype
    return gladys.utils.sqlUnique(queries.getDeviceTypeByIdentifierAndType, [identifier, service, type])
      .then(function(deviceType){
          
          // we create the deviceState
          state.devicetype = deviceType.id;
          return gladys.deviceState.create(state);
      });
};