var queries = require('./deviceType.queries.js');

/**
 * @public
 * @description This function delete an deviceType
 * @name gladys.deviceType.delete
 * @param {Object} deviceType
 * @param {integer} deviceType.id The id of the deviceType
 * @returns {DeviceType} deviceType
 * @example
 * var deviceType = {
 *      id: 1
 * };
 * 
 * gladys.deviceType.delete(deviceType)
 *      .then(function(deviceType){
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