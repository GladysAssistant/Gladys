const { isSupportedDevice } = require('./awox.mesh.ble.isSupportedDevice');
const { setValue } = require('./awox.mesh.ble.setValue');
const { getDevice } = require('./awox.mesh.ble.getDevice');
const { authenticate } = require('./awox.mesh.ble.authenticate');
const { getSessionKey } = require('../awox.mesh.getSessionKey');

const AwoxBLEMesh = function AwoxBLEMesh(gladys, bluetooth) {
  this.gladys = gladys;
  this.bluetooth = bluetooth;
};

AwoxBLEMesh.prototype.isSupportedDevice = isSupportedDevice;
AwoxBLEMesh.prototype.setValue = setValue;
AwoxBLEMesh.prototype.getDevice = getDevice;
AwoxBLEMesh.prototype.authenticate = authenticate;
AwoxBLEMesh.prototype.getSessionKey = getSessionKey;

module.exports = AwoxBLEMesh;
