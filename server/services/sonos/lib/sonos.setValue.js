const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  const deviceUuid = device.external_id.split(':')[1];
  const sonosDevice = this.manager.Devices.find((d) => d.uuid === deviceUuid);
  if (deviceFeature.type === DEVICE_FEATURE_TYPES.MUSIC.PLAY) {
    await sonosDevice.Play();
  }
  if (deviceFeature.type === DEVICE_FEATURE_TYPES.MUSIC.PAUSE) {
    await sonosDevice.Pause();
  }
  if (deviceFeature.type === DEVICE_FEATURE_TYPES.MUSIC.NEXT) {
    await sonosDevice.Next();
  }
  if (deviceFeature.type === DEVICE_FEATURE_TYPES.MUSIC.PREVIOUS) {
    await sonosDevice.Previous();
  }
  if (deviceFeature.type === DEVICE_FEATURE_TYPES.MUSIC.VOLUME) {
    await sonosDevice.SetVolume(value);
  }
}

module.exports = {
  setValue,
};
