const { DEVICE_MAPPERS } = require('./features');

/**
 * @description Load Broadlink device mapper.
 * @param {Object} broadlinkDevice - Broadlink device.
 * @returns {Object} The matching device mapper.
 * @example
 * loadMapper({});
 */
function loadMapper(broadlinkDevice) {
  const deviceType = broadlinkDevice.constructor.name;
  return DEVICE_MAPPERS.find((mapper) => (mapper.deviceClasses || {})[deviceType] !== undefined);
}

module.exports = {
  loadMapper,
};
