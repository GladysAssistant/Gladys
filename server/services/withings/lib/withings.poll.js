const Promise = require('bluebird');
const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { OAUTH2 } = require('./oauth2-client/utils/constants.js');

/**
 * @description Poll value of a withings device.
 * @param {Object} device - The device to update value.
 * @returns {Promise} Resolve.
 * @example
 * poll(device);
 */
async function poll(device) {
  logger.debug('Device to poll:', device);

  if (device.features) {
    logger.debug('Features : ', device.features);

    const withingsDeviceId = device.params.find((oneParam) => oneParam.name === 'WITHINGS_DEVICE_ID').value;

    // Get all users of gladys
    const users = await this.gladys.user.get();
    await Promise.map(
      users,
      async (user) => {
        const withingsClientId = await this.gladys.variable.getValue(
          OAUTH2.VARIABLE.CLIENT_ID,
          this.serviceId,
          user.id,
        );

        if (withingsClientId) {
          await Promise.each(device.features, async (feature) => {
            // Convert type to int wihings
            // (cf https://developer.withings.com/oauth2/#tag/measure%2Fpaths%2Fhttps%3A~1~1wbsapi.withings.net~1measure%3Faction%3Dgetmeas%2Fget)
            let withingsType;
            let featureBattery;
            switch (feature.type) {
              case DEVICE_FEATURE_TYPES.HEALTH.WEIGHT:
                withingsType = 1;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.HEIGHT:
                withingsType = 4;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.FAT_FREE_MASS:
                withingsType = 5;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.FAT_RATIO:
                withingsType = 6;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.FAT_MASS_WEIGHT:
                withingsType = 8;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.DIASTOLIC_BLOOD_PRESSURE:
                withingsType = 9;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.SYSTOLIC_BLOOD_PRESSURE:
                withingsType = 10;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.HEARTH_PULSE:
                withingsType = 11;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.TEMPERATURE:
                withingsType = 12;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.SPO2:
                withingsType = 54;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.BODY_TEMPERATURE:
                withingsType = 71;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.SKIN_TEMPERATURE:
                withingsType = 73;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.MUSCLE_MASS:
                withingsType = 76;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.HYDRATION:
                withingsType = 77;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.BONE_MASS:
                withingsType = 88;
                break;
              case DEVICE_FEATURE_TYPES.HEALTH.PULSE_WAVE_VELOCITY:
                withingsType = 91;
                break;
              case DEVICE_FEATURE_TYPES.SENSOR.INTEGER:
                withingsType = -1;
                featureBattery = { ...feature };
                break;
              default:
                withingsType = 0;
                break;
            }

            if (withingsType > 0) {
              await this.getAndSaveMeasures(feature, withingsType, user.id);
            }

            if (withingsType === -1) {
              await this.getAndSaveBatteryLevel(featureBattery, withingsDeviceId, user.id);
            }
          });
        }
      },
      { concurrency: 2 },
    );
  }
}

module.exports = {
  poll,
};
