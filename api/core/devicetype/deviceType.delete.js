var queries = require('./deviceType.queries.js');

/**
 * @public
 * @description This function delete an deviceType
 * @name gladys.deviceType.delete
 * @param {Object} devicType
 * @param {integer} devicType.id The id of the deviceType
 * @returns {DeviceType} deviceType
 * @example
 * var devicType = {
 *      id: 1
 * };
 * 
 * gladys.deviceType.delete(devicType)
 *      .then(function(devicType){
 *         // deviceType deleted ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function (deviceType){
  
  // delete all deviceState from this deviceType
  return gladys.utils.sql(queries.deleteDeviceStates, [deviceType.id])
    .then(() => {

        // delete deviceType
        return gladys.utils.sqlUnique(queries.delete, [deviceType.id]);  
    });
};