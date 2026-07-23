const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { getGladysDeviceFeatures } = require('./air-to-air.device');

/**
 * @description Transform a MELCloud Home air-to-air unit into a Gladys device.
 * @param {object} unit - MELCloud Home air-to-air unit (annotated with buildingId).
 * @returns {object} Gladys device.
 * @example
 * convertDevice({ id: '...', givenDisplayName: '...', buildingId: '...' });
 */
function convertDevice(unit) {
  const externalId = `melcloud-home:${unit.id}`;

  return {
    name: unit.givenDisplayName || unit.id,
    features: getGladysDeviceFeatures(externalId, unit),
    external_id: externalId,
    selector: externalId,
    model: unit.model || null,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    should_poll: true,
    params: [
      {
        name: 'buildingID',
        value: unit.buildingId,
      },
    ],
  };
}

module.exports = {
  convertDevice,
};
