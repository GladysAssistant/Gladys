var queries = require('./deviceType.queries.js');

module.exports = function (deviceType){
  
  // delete all deviceState from this deviceType
  return gladys.utils.sql(queries.deleteDeviceStates, [deviceType.id])
    .then(() => {

        // delete deviceType
        return gladys.utils.sqlUnique(queries.delete, [deviceType.id]);  
    });
};