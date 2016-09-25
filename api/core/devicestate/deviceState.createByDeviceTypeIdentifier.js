var queries = require('./deviceState.queries.js');

module.exports = function(identifier, service, state){
    
    // we get the devicetype
    return gladys.utils.sqlUnique(queries.getDeviceTypeByIdentifierAndService, [identifier, service])
      .then(function(deviceType){
          
          // we create the deviceState
          state.devicetype = deviceType.id;
          return gladys.deviceState.create(state);
      });
};