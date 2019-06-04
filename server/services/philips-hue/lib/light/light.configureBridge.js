const logger = require('../../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');
const i18n = require('../../../../config/i18n');

const EXTERNAL_ID_BASE = 'philips-hue';
const SYSTEM_LANGUAGE = 'en';

/**
 * @description Configure the philips hue bridge.
 * @param {string} name - Name of the bridge.
 * @param {string} ipaddress - IP Address of the bridge.
 * @param {string} userId - User Id used to connect to the bridge.
 * @param {Object[]} lights - List of lights to configure.
 * @example
 * configureBridge('bridge1', '162.198.1.1', '8RNCl60x5dNWEPuGMIRPevXsPwPPAja3WBcQcLjF',
 *  [{name: 'Philips Hue 1', id: 1}]});
 */
async function configureBridge(name, ipaddress, userId, lights) {
  logger.info(`Configuring Hue bridge ${name} at ${ipaddress}...`);
  await this.gladys.device.create({
    name,
    service_id: this.serviceId,
    external_id: `${EXTERNAL_ID_BASE}:${ipaddress}:${userId}`,
    features: [],
    params: [
      {
        name: 'BRIDGE_IP_ADDRESS',
        value: ipaddress,
      },
      {
        name: 'BRIDGE_USER_ID',
        value: userId,
      },
    ],
  });
  const all = lights.map((philipsHueLight) =>
    this.gladys.device.create({
      name: philipsHueLight.name,
      service_id: this.serviceId,
      external_id: `${EXTERNAL_ID_BASE}:${philipsHueLight.id}`,
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
      features: [
        {
          name: `${philipsHueLight.name} ${i18n[SYSTEM_LANGUAGE].device.binarySuffix}`,
          type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          read_only: false,
          has_feedback: false,
          external_id: `${EXTERNAL_ID_BASE}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          min: 0,
          max: 1,
        },
        {
          name: `${philipsHueLight.name} ${i18n[SYSTEM_LANGUAGE].device.brightnessSuffix}`,
          type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
          read_only: false,
          has_feedback: false,
          external_id: `${EXTERNAL_ID_BASE}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          min: 0,
          max: 255,
        },
        {
          name: `${philipsHueLight.name} ${i18n[SYSTEM_LANGUAGE].device.hueSuffix}`,
          type: DEVICE_FEATURE_TYPES.LIGHT.HUE,
          read_only: false,
          has_feedback: false,
          external_id: `${EXTERNAL_ID_BASE}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.HUE}`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          min: 0,
          max: 65535,
        },
        {
          name: `${philipsHueLight.name} ${i18n[SYSTEM_LANGUAGE].device.saturationSuffix}`,
          type: DEVICE_FEATURE_TYPES.LIGHT.SATURATION,
          read_only: false,
          has_feedback: false,
          external_id: `${EXTERNAL_ID_BASE}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.SATURATION}`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          min: 0,
          max: 255,
        },
      ],
    }),
  );
  return Promise.all(all);
}

module.exports = {
  configureBridge,
};
