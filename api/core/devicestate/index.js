
/**
 * Don't remove, it is useful for generating documentation :)
 * @public
 * @name DeviceState
 * @class
 */

module.exports.create = require('./deviceState.create.js');
module.exports.createByIdentifier = require('./deviceState.createByIdentifier.js');
module.exports.createByDeviceTypeIdentifier = require('./deviceState.createByDeviceTypeIdentifier.js');
module.exports.get = require('./deviceState.get.js');
module.exports.getFiltered = require('./deviceState.getFiltered.js');
module.exports.getFilteredMinMax = require('./deviceState.getFilteredMinMax');
module.exports.purge = require('./deviceState.purge.js');
module.exports.refreshDeviceTypeLastValue = require('./deviceState.refreshDeviceTypeLastValue');
