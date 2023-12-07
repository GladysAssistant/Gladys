const { EVENTS } = require('../../../utils/constants');
const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { readValues } = require('./device/netatmo.deviceMapping');
const { SUPPORTED_MODULE_TYPE } = require('./utils/netatmo.constants');

/**
 *
 * @description Poll values of an Netatmo device.
 * @param {object} netatmoHandler - Of nothing.
 * @param {object} deviceGladys - Of nothing.
 * @param {object} deviceNetatmo - Of nothing.
 * @param {string} externalId - Of nothing.
 * @returns {Promise} Promise of nothing.
 * @example
 * updateValues(netatmoHandler, deviceGladys, deviceNetatmo, externalId);
 */
async function updateValues(netatmoHandler, deviceGladys, deviceNetatmo, externalId) {
  const [prefix, topic] = externalId.split(':');
  if (prefix !== 'netatmo') {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" should starts with "netatmo:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" have no network indicator`);
  }
  const { setpoint, measured, room } = deviceNetatmo;
  deviceGladys.features.forEach((deviceFeature) => {
    const externalIdFeature = deviceFeature.external_id.split(':');
    const featureName = externalIdFeature[externalIdFeature.length - 1];
    let value;
    if (typeof deviceNetatmo[featureName] !== 'undefined') {
      value = deviceNetatmo[featureName];
    } else if (setpoint && typeof setpoint[featureName] !== 'undefined') {
      value = setpoint[featureName];
    } else if (measured && typeof measured[featureName] !== 'undefined') {
      value = measured[featureName];
    } else if (room && typeof room[featureName] !== 'undefined') {
      value = room[featureName];
    }
    if (featureName === 'reachable' && typeof value === 'undefined') {
      switch (deviceNetatmo.type) {
        case SUPPORTED_MODULE_TYPE.PLUG: {
          const now = new Date();
          const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
          if (deviceNetatmo.last_therm_seen && new Date(deviceNetatmo.last_therm_seen) > thirtyMinutesAgo) {
            value = true;
            break;
          }
          value = false;
          break;
        }
        default:
          break;
      }
    }
    if (typeof value !== 'undefined') {
      const transformedValue = readValues[deviceFeature.category][deviceFeature.type](value);
      if (deviceFeature.last_value !== transformedValue && deviceFeature.type !== 'text') {
        if (transformedValue !== null && transformedValue !== undefined) {
          netatmoHandler.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: deviceFeature.external_id,
            state: transformedValue,
          });
        }
      } else if (deviceFeature.type === 'text' && deviceFeature.last_value_string !== transformedValue) {
        netatmoHandler.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: deviceFeature.external_id,
          text: transformedValue,
        });
      }
    } else {
      logger.error(
        'deviceGladys: ',
        deviceGladys.name,
        'featureName: ',
        featureName,
        ' not found in the root of the Netatmo device nor in the other properties',
      );
    }
  });
}

module.exports = {
  updateValues,
};
