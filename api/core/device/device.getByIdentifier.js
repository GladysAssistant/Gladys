module.exports = get;

var queries = require('./device.queries.js');

/**
 * @public
 * @description This function return one device
 * @name gladys.device.getByIdentifier
 * @param {Object} options
 * @param {String} options.identifier he identifer of the device
 * @param {String} options.service The service of the device
 * @returns {device} device
 * @example
 * var options = {
 *      identifier: 'milight-122',
 *      service: 'milight'
 * }
 * gladys.device.getByIdentifier(options)
 *      .then(function(device){
 *          // do something
 *      })
 */

function get(options) {
    return gladys.utils.sqlUnique(queries.getByIdentifier, [options.identifier, options.service]);
}
