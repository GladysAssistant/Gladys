const Promise = require('bluebird');
const uuid = require('uuid');
const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const OAuth2Manager = require('../../../lib/oauth2');
const logger = require('../../../utils/logger');
const { OAUTH2 } = require('../../../utils/constants.js');

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

    const oauth2Manager = new OAuth2Manager(this.gladys);
    const withingsDeviceId = device.params.find((oneParam) => oneParam.name === 'WITHINGS_DEVICE_ID').value;

    // Get all users of gladys
    const users = await this.gladys.user.get();
    await Promise.map(
      users,
      async (user) => {
        const withingsClientId = await this.gladys.variable.getValue(
          `${OAUTH2.VARIABLE.CLIENT_ID}`,
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
              logger.debug('Current feature last value changed: ', feature.last_value_changed);

              const measureResult = await oauth2Manager.executeOauth2HTTPQuery(
                this.serviceId,
                user.id,
                'get',
                `${this.withingsUrl}/measure`,
                `action=getmeas&meastype=${withingsType}&category=1&lastupdate=${feature.last_value_changed.getTime() /
                  1000 +
                  1}`,
              );

              if (measureResult.data.body.measuregrps) {
                const mapOfMeasuresGrpsByWithingsDeviceId = new Map();
                await Promise.each(measureResult.data.body.measuregrps, async (element) => {
                  if (element) {
                    // Build map of measuregrps by withings device id
                    const measureList = mapOfMeasuresGrpsByWithingsDeviceId.get(element.deviceid) || [];
                    measureList.push(element);
                    mapOfMeasuresGrpsByWithingsDeviceId.set(element.deviceid, measureList);
                  }
                });
                await Promise.each(mapOfMeasuresGrpsByWithingsDeviceId, async (value) => {
                  const key = value[0];
                  const valueList = value[1];
                  await Promise.each(valueList, async (currentGroup) => {
                    if (key) {
                      logger.debug('currentGroup: ', currentGroup);

                      await Promise.each(currentGroup.measures, async (measure) => {
                        // Build a feature state
                        const featureState = {
                          id: uuid.v4(),
                          device_feature_id: feature.id,
                          value: (measure.value * 10 ** measure.unit).toFixed(2),
                          created_at: new Date(currentGroup.created * 1000),
                          updated_at: new Date(),
                        };
                        await this.gladys.device.saveHistoricalState(device, feature, featureState);
                      });
                    }
                  });
                });
              }
            }

            if (withingsType === -1) {
              const userResult = await oauth2Manager.executeOauth2HTTPQuery(
                this.serviceId,
                user.id,
                'get',
                `${this.withingsUrl}/v2/user`,
                'action=getdevice',
              );

              if (userResult.data && userResult.data.body && userResult.data.body.devices) {
                await Promise.each(userResult.data.body.devices, async (element) => {
                  logger.debug('withingsDeviceId: ', withingsDeviceId);
                  logger.debug('featureBattery: ', featureBattery);

                  if (element.deviceid === withingsDeviceId) {
                    const currentDate = new Date();
                    let currentBatValueString;
                    let currentBatValue = 100;
                    switch (element.battery) {
                      case 'low':
                        currentBatValueString = `${element.battery} (< 30%)`;
                        currentBatValue = 20;
                        break;
                      case 'medium':
                        currentBatValueString = `${element.battery} (> 30%)`;
                        currentBatValue = 30;
                        break;
                      case 'high':
                        currentBatValueString = `${element.battery} (> 75%)`;
                        currentBatValue = 75;
                        break;
                      default:
                        currentBatValueString = `No value`;
                        currentBatValue = 0;
                        break;
                    }

                    featureBattery.last_value_changed = currentDate;
                    featureBattery.last_value = currentBatValue;
                    featureBattery.last_value_string = currentBatValueString;

                    const featureState = {
                      id: uuid.v4(),
                      device_feature_id: feature.id,
                      value: currentBatValue,
                      created_at: currentDate,
                      updated_at: currentDate,
                    };
                    await this.gladys.device.saveHistoricalState(device, featureBattery, featureState);
                  }
                });
              }
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
