module.exports = update;

var Promise = require('bluebird');

/**
 * @public
 * @description This function update an device and its deviceType
 * @name gladys.device.update
 * @param {Object} device
 * @param {integer} device.id The id of the device
 * @param {String} device.name The name of the device
 * @param {String} device.identifer The identifer of the device, it must be unique
 * @param {String} device.protocol The protocol of the device
 * @param {String} device.service The service of the device, the module to which it must be connected
 * @returns {Device} device
 * @example
 * var device: {
 *      id: 1
 *      name: 'Light updated',
 *      identifier: 'milight-122',
 *      protocol: 'milight',
 *      service: 'milight'
 * };
 * 
 * gladys.device.update(device)
 *      .then(function(device){
 *         // device updated ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

function update(device) {
    var id = device.id;
    delete device.id;

    // update the device
    return Device.update({
            id: id
        }, device)
        .then(function(devices) {

            if (devices.length === 0) {
                return Promise.reject(new Error('Device not found'));
            }

            return Promise.resolve(devices[0]);
        });
}
