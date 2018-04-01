var queries = require('./deviceType.queries.js');

/**
 * @public
 * @description This function return all deviceTypes of one type
 * @name gladys.deviceType.getByType
 * @param {Object} device
 * @param {String} device.type The type of deviceType we want to get
 * @returns {Array<deviceType>} deviceType
 * @example
 * var device = {
 *      type: "binary"
 * }
 * 
 * gladys.deviceType.getByType(device)
 *      .then(function(deviceTypes){
 *          // do something
 *      })
 */

module.exports = function(device){
    return gladys.utils.sql(queries.getByType, [device.type]);
}