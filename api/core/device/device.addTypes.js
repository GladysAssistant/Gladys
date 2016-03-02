module.exports = addTypes;

var Promise = require('bluebird');
var createDeviceType = Promise.promisify(DeviceType.create);

function addTypes(types) {
    return Promise.map(types, function(type) {
        return createDeviceType(type);
    });
}
