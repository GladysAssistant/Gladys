const { isSupportedDevice } = require('./awox.legacy.isSupportedDevice');
const { setValue } = require('./awox.legacy.setValue');
const { getDevice } = require('./awox.legacy.getDevice');

const AwoxLegacy = function AwoxLegacy(gladys, bluetooth) {
  this.gladys = gladys;
  this.bluetooth = bluetooth;
};

AwoxLegacy.prototype.isSupportedDevice = isSupportedDevice;
AwoxLegacy.prototype.setValue = setValue;
AwoxLegacy.prototype.getDevice = getDevice;

module.exports = AwoxLegacy;
