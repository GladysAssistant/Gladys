const deviceClasses = require('node-broadlink/dist/switch');

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../../utils/constants');

/**
 * @description Builds switch Broadlink features.
 * @param {string} deviceName - Device name.
 * @param {string} deviceExternalId - Device external ID.
 * @param {object} broadlinkDevice - Broadlink device.
 * @returns {Array} Gladys features.
 * @example
 * buildFeatures(a1Device);
 */
function buildFeatures(deviceName, deviceExternalId, broadlinkDevice) {
  const { TYPE, getEnergy } = broadlinkDevice;
  const features = [];

  // check for number of switch features
  const nbSwitch = TYPE === 'MP1' ? 4 : 1;

  for (let i = 0; i < nbSwitch; i += 1) {
    const switchNb = i + 1;
    const featureExternalId = `${deviceExternalId}:switch:${switchNb}`;
    features.push({
      name: `${deviceName}${nbSwitch > 1 ? ` ${switchNb}` : ''}`,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      external_id: featureExternalId,
      selector: featureExternalId,
      min: 0,
      max: 1,
      read_only: false,
      has_feedback: false,
    });
  }

  // check for energy sensor
  if (typeof getEnergy === 'function') {
    const featureExternalId = `${deviceExternalId}:energy-sensor`;
    features.push({
      name: `${deviceName} energy`,
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
      external_id: featureExternalId,
      selector: featureExternalId,
      min: 0,
      max: 1000,
      unit: DEVICE_FEATURE_UNITS.WATT,
      read_only: true,
      has_feedback: false,
    });
  }

  return features;
}

/**
 * @description Send value to switch device.
 * @param {object} broadlinkDevice - Broadlink device.
 * @param {object} gladysDevice - Gladys device.
 * @param {object} gladysFeature - Gladys feature.
 * @param {number} value - Value to send.
 * @example
 * async setValue({}, {}, {}, 3);
 */
async function setValue(broadlinkDevice, gladysDevice, gladysFeature, value) {
  const valueTosend = value === 1;
  const { TYPE } = broadlinkDevice;
  if (TYPE === 'MP1') {
    // load switch number
    const { external_id: externalId } = gladysFeature;
    const [, , , switchNb] = externalId.split(':');
    await broadlinkDevice.setPower(Number.parseInt(switchNb, 10), valueTosend);
  } else {
    await broadlinkDevice.setPower(valueTosend);
  }
}

/**
 * @description Polling Broadlink device values.
 * @param {object} broadlinkDevice - Broadlink device.
 * @param {object} gladysDevice - Gladys device.
 * @returns {Promise} Messages to emit.
 * @example
 * await poll(broadlinkDevice, device);
 */
async function poll(broadlinkDevice, gladysDevice) {
  const { features } = gladysDevice;
  const messages = [];

  // energy
  const energyFeature = features.find((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR);
  if (energyFeature) {
    const state = await broadlinkDevice.getEnergy();
    messages.push({
      device_feature_external_id: energyFeature.external_id,
      state,
    });
  }

  return messages;
}

module.exports = {
  deviceClasses,
  buildFeatures,
  setValue,
  poll,
  canLearn: false,
};
