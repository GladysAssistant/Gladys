var queries = require('./deviceType.queries.js');

/**
 * @public
 * @description This function return an deviceTypes
 * @name gladys.deviceType.getById
 * @param {Object} device
 * @param {String} device.id The id of deviceType we want to get
 * @returns {DeviceType} deviceType
 * @example
 * var device = {
 *      id: 1
 * }
 * 
 * gladys.deviceType.getById(device)
 *      .then(function(deviceType){
 *          // do something
 *      })
 */

module.exports = function(device){
    return gladys.utils.sqlUnique(queries.getById, [device.id]);
}
