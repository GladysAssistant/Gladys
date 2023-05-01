const { BadParameters } = require('../../../../utils/coreErrors');
const { PARAMS } = require('../utils/broadlink.constants');

/**
 * @description Send the new device value to Broadlink device.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @returns {Promise<object>} Resolve with new value.
 * @example
 * await setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  const { params = [] } = device;

  const peripheralParam = params.find((p) => p.name === PARAMS.PERIPHERAL);

  if (!peripheralParam) {
    throw new BadParameters(`${device.external_id} device is not well configured, please try to update it`);
  }

  const broadlinkDevice = await this.getDevice(peripheralParam.value);
  const deviceMapper = this.loadMapper(broadlinkDevice);

  if (!deviceMapper || typeof deviceMapper.setValue !== 'function') {
    throw new BadParameters(`${device.external_id} device is not managed by Broadlink`);
  }

  await deviceMapper.setValue(broadlinkDevice, device, deviceFeature, value);

  return value;
}

module.exports = {
  setValue,
};
