const Promise = require('bluebird');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');

const { getDeviceParam } = require('../../../../utils/device');

const { LIGHT_EXTERNAL_ID_BASE, BRIDGE_SERIAL_NUMBER } = require('../utils/consts');

/**
 * @description Get lights from all connected bridges.
 * @returns {Promise<Array>} Resolve with array of lights.
 * @example
 * getLights();
 */
async function getLights() {
  const lightsToReturn = [];
  await Promise.map(this.connnectedBridges, async (device) => {
    const serialNumber = getDeviceParam(device, BRIDGE_SERIAL_NUMBER);
    const hueApi = this.hueApisBySerialNumber.get(serialNumber);
    if (!hueApi) {
      throw new NotFoundError(`HUE_API_NOT_FOUND`);
    }
    const lights = await hueApi.lights.getAll();

    lights.forEach((philipsHueLight) => {
      // White + Color Lights
      if (philipsHueLight.modelid === 'LCT007') {
        lightsToReturn.push({
          name: philipsHueLight.name,
          service_id: this.serviceId,
          external_id: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}`,
          selector: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}`,
          should_poll: true,
          model: philipsHueLight.modelid,
          poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
          features: [
            {
              name: `${philipsHueLight.name} On/Off`,
              read_only: false,
              has_feedback: false,
              external_id: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}:${
                DEVICE_FEATURE_TYPES.LIGHT.BINARY
              }`,
              selector: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}:${
                DEVICE_FEATURE_TYPES.LIGHT.BINARY
              }`,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
              min: 0,
              max: 1,
            },
            {
              name: `${philipsHueLight.name} Color`,
              read_only: false,
              has_feedback: false,
              external_id: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}:${
                DEVICE_FEATURE_TYPES.LIGHT.COLOR
              }`,
              selector: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}:${
                DEVICE_FEATURE_TYPES.LIGHT.COLOR
              }`,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
              min: 0,
              max: 0,
            },
            {
              name: `${philipsHueLight.name} Brightness`,
              read_only: false,
              has_feedback: false,
              external_id: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}:${
                DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS
              }`,
              selector: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}:${
                DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS
              }`,
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
              min: 0,
              max: 100,
            },
          ],
        });
      }
    });
  });

  return lightsToReturn;
}

module.exports = {
  getLights,
};
