const { DEVICE_POLL_FREQUENCIES, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const { convertFeature } = require('./tuya.convertFeature');
const logger = require('../../../../utils/logger');
const { INFRARED_CATEGORIES } = require('../utils/tuya.constants');

/**
 * @description Transform Tuya device to Gladys device.
 * @param {object} tuyaDevice - Tuya device.
 * @returns {object} Glladys device.
 * @example
 * tuya.convertDevice({ ... });
 */
function convertDevice(tuyaDevice) {
  const { name, product_name: model, id, gateway_id, specifications = {}, keys = [] } = tuyaDevice;
  const externalId = [INFRARED_CATEGORIES.INFRARED_AC, INFRARED_CATEGORIES.INFRARED_TV].includes(specifications.category)
    ? `tuya:${id}_${gateway_id}`
    : `tuya:${id}`;
  const { functions = [], status = [] } = specifications;

  logger.debug(`Tuya convert device"${name}, ${model}"`);
  // Groups functions and status on same code
  const groups = {};

  if (
    gateway_id.length > 0 &&
    ([INFRARED_CATEGORIES.INFRARED_AC, INFRARED_CATEGORIES.INFRARED_TV].includes(specifications.category))
  ) {
    if (specifications.category === INFRARED_CATEGORIES.INFRARED_AC) {
      groups['power'] = {
        code: 'power',
        type: Boolean,
        readOnly: false,
        name: 'Power',
      };
      groups['mode'] = {
        code: 'mode',
        type: Number,
        readOnly: false,
        name: 'Mode',
        values: JSON.stringify({
          min: 0,
          max: 4,
        }),
      };
      groups['temp'] = {
        code: 'temp',
        type: Number,
        readOnly: false,
        name: 'Temperature',
        values: JSON.stringify({
          min: 16,
          max: 30,
        }),
      };
      groups['wind'] = {
        code: 'wind',
        type: Number,
        readOnly: false,
        name: 'Fan',
        values: JSON.stringify({
          min: 0,
          max: 4,
        }),
      };
    } else if (specifications.category === INFRARED_CATEGORIES.INFRARED_TV) {
      keys.forEach((key) => {
        groups[DEVICE_FEATURE_CATEGORIES.TELEVISION + '_' + key.key] = {
          code:
            DEVICE_FEATURE_CATEGORIES.TELEVISION +
            '_' +
            (key.key.includes('-')
              ? key.key.replaceAll('-', 'Down')
              : key.key.includes('+')
              ? key.key.replaceAll('+', 'Up')
              : key.key),
          type: Number,
          readOnly: false,
          name: key.key_name + ':' + key.category_id + ':' + key.key_id,
        };
      });
    } else {
      return;
    }
  } else {
    status.forEach((stat) => {
      const { code } = stat;
      groups[code] = { ...stat, readOnly: true };
    });
    functions.forEach((func) => {
      const { code } = func;
      groups[code] = { ...func, readOnly: false };
    });
  }

  const features = Object.values(groups).map((group) => convertFeature(group, externalId));

  const device = {
    name,
    features: features.filter((feature) => feature),
    external_id: externalId,
    selector: externalId,
    model,
    service_id: this.serviceId,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
    should_poll: specifications.category === INFRARED_CATEGORIES.INFRARED_TV ? false : true,
  };
  return device;
}

module.exports = {
  convertDevice,
};
