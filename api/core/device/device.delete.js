var queries = require('./device.queries.js');

/**
 * @public
 * @description This function delete an device and its deviceType
 * @name gladys.device.delete
 * @param {Object} device
 * @param {integer} device.id The id of the device
 * @returns {Device} device
 * @example
 * var device: {
 *      id: 1
 * };
 * 
 * gladys.device.delete(device)
 *      .then(function(device){
 *         // device deleted ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function (device){
  
  // we delete all the devicetypes associated to the device
  return gladys.utils.sql(queries.deleteDeviceTypes, [device.id])
    .then(function(){
        
        // then we delete the device itself
        return gladys.utils.sqlUnique(queries.delete, [device.id]);
    });    
};