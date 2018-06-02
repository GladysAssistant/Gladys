var queries = require('./deviceType.queries.js');

/**
 * @public
 * @description This function return all deviceTypes of an device
 * @name gladys.deviceType.getByDevice
 * @param {Object} device
 * @param {String} device.id The id of device we want to get the deviceType
 * @returns {Array<deviceType>} deviceType
 * @example
 * var device = {
 *      id: 1
 * }
 * 
 * gladys.deviceType.getByDevice(device)
 *      .then(function(deviceType){
 *          // do something
 *      })
 */

module.exports = function(device){
    return gladys.utils.sql(queries.getByDevice, [device.id]);
};