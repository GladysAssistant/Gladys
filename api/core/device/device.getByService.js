module.exports = get;

var queries = require('./device.queries.js');

/**
 * @public
 * @description This function return one device
 * @name gladys.device.getByService
 * @param {Object} options
 * @param {String} options.service The service of the device
 * @returns {device} device
 * @example
 * var options = {
 *      service: 'milight'
 * }
 * gladys.device.getByService(options)
 *      .then(function(device){
 *          // do something
 *      })
 */

function get(options) {

    return gladys.utils.sql(queries.getByService, [options.service])
}
