module.exports = create;

var Promise = require('bluebird');

/**
 * Create a Device and its DeviceType.
 */
function create(param) {

    // first, we create the device
    return Device.create(param.device)
        .then(function(device) {

            // we create all the types
            return Promise.map(param.types, function(type) {
                type.device = device.id;
                return DeviceType.create(type);
            })

            // we return the results
            .then(function(types) {
                var result = {
                    device: device,
                    types: types
                };
                return Promise.resolve(result);
            });
        });
}
