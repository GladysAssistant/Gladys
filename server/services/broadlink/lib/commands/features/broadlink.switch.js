const deviceClasses = require('node-broadlink/dist/switch');

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../../utils/constants');

// Broadlink devices handled by the "SP4" node-broadlink class (SP4, SP4L-*, SP4M, MCB1, SCB1E...).
const SP4_TYPES = ['SP4', 'SP4B'];

/**
 * @description Sends a new state to a SP4-like Broadlink device.
 * `Sp4.setState` from node-broadlink decodes the raw (still encrypted) response, which always
 * throws "SyntaxError: Unexpected end of JSON input" even though the command reached the device.
 * The payload is decrypted here before being decoded, as `Sp4.getState` already does.
 * @param {object} broadlinkDevice - Broadlink device.
 * @param {object} state - State to send to the device.
 * @returns {Promise<object>} Resolve with the device state.
 * @example
 * await setSp4State(broadlinkDevice, { pwr: true });
 */
async function setSp4State(broadlinkDevice, state) {
  const response = await broadlinkDevice.sendPacket(broadlinkDevice.encode(2, state));
  return broadlinkDevice.decode(broadlinkDevice.decrypt(response));
}

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
  } else if (SP4_TYPES.includes(TYPE)) {
    await setSp4State(broadlinkDevice, { pwr: valueTosend });
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
  const { TYPE, checkPower } = broadlinkDevice;
  const { features } = gladysDevice;
  const messages = [];

  // switches
  const switchFeatures = features.filter((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.SWITCH);
  if (switchFeatures.length > 0 && typeof checkPower === 'function') {
    // MP1 devices return the state of all their 4 switches at once
    const power = await broadlinkDevice.checkPower();
    switchFeatures.forEach((feature) => {
      const [, , , switchNb] = feature.external_id.split(':');
      const state = TYPE === 'MP1' ? power[`s${switchNb}`] : power;
      messages.push({
        device_feature_external_id: feature.external_id,
        state: state ? 1 : 0,
      });
    });
  }

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
