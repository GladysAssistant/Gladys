const { DEVICE_TYPES } = require('../utils/awox.constants');
const AwoxLegacy = require('./legacy');
const AwoxBLEMesh = require('./mesh/ble');

module.exports = {
  [DEVICE_TYPES.LEGACY]: AwoxLegacy,
  [DEVICE_TYPES.MESH]: AwoxBLEMesh,
};
