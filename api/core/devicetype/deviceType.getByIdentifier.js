var queries = require('./deviceType.queries.js');

/**
 * @public
 * @description This function return an deviceTypes
 * @name gladys.deviceType.getByIdentifier
 * @param {Object} options
 * @param {String} options.deviceIdentifier The identifier of device we want to get the deviceType
 * @param {String} options.deviceService The service of device we want to get the deviceType
 * @param {String} options.deviceTypeIdentifier The identifier of deviceType we want to get
 * @returns {DeviceType} deviceType
 * @example
 * var options = {
 *      deviceIdentifier: "milight-1",
 *      deviceService: "milight",
 *      deviceTypeIdentifier: "milight_light_1"
 * }
 * 
 * gladys.deviceType.getByIdentifier(options)
 *      .then(function(deviceType){
 *          // do something
 *      })
 */

module.exports = function(options){
    return gladys.utils.sqlUnique(queries.getByIdentifier, [options.deviceIdentifier, options.deviceService, options.deviceTypeIdentifier]);
};