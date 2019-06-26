const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');
const i18n = require('../../../../config/i18n');

const EXTERNAL_ID_BASE = 'philips-hue';

/**
 * @description Get lights from Philips Hue bridge
 * @example
 * getLightsFromBridge();
 */
async function getLightsFromBridge() {
  if (!this.hueApi) {
    throw new Error(`Hue bridge not connected`);
  }
  const { lights } = await this.hueApi.lights();
  const systemLanguage = this.gladys.stateManager.get('system', 'SYSTEM_LANGUAGE');
  const all = lights.map((philipsHueLight) =>
    this.gladys.device.create({
      name: philipsHueLight.name,
      service_id: this.serviceId,
      external_id: `${EXTERNAL_ID_BASE}:${philipsHueLight.id}`,
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
      features: [
        {
          name: `${philipsHueLight.name} ${i18n[systemLanguage].device.binarySuffix}`,
          type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          read_only: false,
          has_feedback: false,
          external_id: `${EXTERNAL_ID_BASE}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          min: 0,
          max: 1,
        },
        {
          name: `${philipsHueLight.name} ${i18n[systemLanguage].device.brightnessSuffix}`,
          type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
          read_only: false,
          has_feedback: false,
          external_id: `${EXTERNAL_ID_BASE}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          min: 0,
          max: 255,
        },
        {
          name: `${philipsHueLight.name} ${i18n[systemLanguage].device.hueSuffix}`,
          type: DEVICE_FEATURE_TYPES.LIGHT.HUE,
          read_only: false,
          has_feedback: false,
          external_id: `${EXTERNAL_ID_BASE}:${philipsHueLight.id}:${DEVICE_FEATURE_TYPES.LIGHT.HUE}`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          min: 0,
          max: 65535,
        },
        {
          name: `${philipsHueLight.name} ${i18n[systemLanguage].device.saturationSuffix}`,
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
  getLightsFromBridge,
};
