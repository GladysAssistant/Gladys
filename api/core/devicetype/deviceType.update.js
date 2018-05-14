const Promise = require('bluebird');

module.exports = function update(id, deviceType) {

    delete deviceType.lastValue;
    delete deviceType.lastValueDateTime;

    // update the device
    return DeviceType.update({
            id: id
        }, deviceType)
        .then((deviceTypes) => {

            if (deviceTypes.length === 0) {
                return Promise.reject(new Error('deviceType not found'));
            }

            return Promise.resolve(deviceTypes[0]);
        });
}