const { BadParameters } = require('../../../utils/coreErrors');
const { EVENTS } = require('../../../utils/constants');
const { transformValueFromMELCloud } = require('./device/air-to-air.device');

/**
 * @description Poll values of a MELCloud Home device.
 * @param {object} device - The device to poll.
 * @returns {Promise} Promise of nothing.
 * @example
 * poll(device);
 */
async function poll(device) {
  const externalId = device.external_id;
  const [prefix, unitId] = externalId.split(':');

  if (prefix !== 'melcloud-home') {
    throw new BadParameters(
      `MELCloud Home device external_id is invalid: "${externalId}" should starts with "melcloud-home:"`,
    );
  }
  if (!unitId || unitId.length === 0) {
    throw new BadParameters(`MELCloud Home device external_id is invalid: "${externalId}" have no network indicator`);
  }

  const units = await this.loadDevices();
  const unit = units.find((currentUnit) => currentUnit.id === unitId);

  if (!unit) {
    return;
  }

  device.features.forEach((deviceFeature) => {
    const value = transformValueFromMELCloud(deviceFeature, unit);

    if (deviceFeature.last_value !== value) {
      if (value !== null && value !== undefined) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: deviceFeature.external_id,
          state: value,
        });
      }
    }
  });
}

module.exports = {
  poll,
};
