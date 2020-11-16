const Promise = require('bluebird');
const uuid = require('uuid');
const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const OAuth2Manager = require('../../../lib/oauth2');
const logger = require('../../../utils/logger');

/**
 * @description Poll value of a withings device.
 * @param {Object} device - The device to update value.
 * @returns {Promise} Resolve with withings device poll.
 * @example
 * poll(device);
 */
async function poll(device) {
  logger.debug('Device to poll:', device);
  if (device.features) {
    const oauth2Manager = new OAuth2Manager(this.gladys);
    const withingsDeviceId = device.params.find((oneParam) => oneParam.name === 'withingsDeviceId').value;

    logger.debug('Features : ', device.features);

    const { gladys } = this;
    const { serviceId } = this;

    // Get all users of gladys
    const users = await gladys.user.get();
    await Promise.map(
      users,
      async (user) => {
        const withingsClienId = await gladys.variable.getValue('WITHINGS_CLIENT_ID', serviceId, user.id);

        if (withingsClienId) {
          device.features.forEach(async (feat) => {
            // logger.trace('Current feature : ', feat);
            // Convert type to int wihings
            // (cf https://developer.withings.com/oauth2/#tag/measure%2Fpaths%2Fhttps%3A~1~1wbsapi.withings.net~1measure%3Faction%3Dgetmeas%2Fget)
            let withingsType;
            let featureBattery;
            switch (feat.type) {
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
                featureBattery = feat;
                break;
              default:
                withingsType = 0;
                break;
            }

            if (withingsType > 0) {
              logger.debug('Current feature last value changed: ', feat.last_value_changed);

              const measureResult = await oauth2Manager.executeQuery(
                serviceId,
                user.id,
                this.integrationName,
                'get',
                `${this.withingsUrl}/measure`,
                `action=getmeas&meastype=${withingsType}&category=1&lastupdate=${feat.last_value_changed.getTime() /
                  1000 +
                  1}`,
              );

              // logger.trace('Poll result : ', measureResult);
              if (measureResult.data.body.measuregrps) {
                const mapOfMeasuresGrpsByWithingsDeviceId = new Map();
                await measureResult.data.body.measuregrps.forEach((element) => {
                  if (element) {
                    // Build map of measuregrps by withings device id
                    let measureList = mapOfMeasuresGrpsByWithingsDeviceId.get(element.deviceid);
                    if (!measureList) {
                      measureList = [];
                    }
                    measureList.push(element);
                    mapOfMeasuresGrpsByWithingsDeviceId.set(element.deviceid, measureList);
                  }
                });

                await mapOfMeasuresGrpsByWithingsDeviceId.forEach(function buildFeatureByGrps(value, key) {
                  value.forEach(function parseMeasureGrous(currentGroup) {
                    if (key) {
                      logger.debug('currentGroup: ', currentGroup);

                      currentGroup.measures.forEach((element) => {
                        // Build a feature state
                        const uniqueSateId = uuid.v4();
                        const createDate = new Date(currentGroup.created * 1000);
                        const featureState = {
                          id: uniqueSateId,
                          device_feature_id: feat.id,
                          value: element.value * 10 ** element.unit,
                          created_at: createDate,
                          updated_at: new Date(),
                        };
                        gladys.device.saveHistoricalState(device, feat, featureState);
                      });
                    }
                  });
                });
              }
            }

            // Update spcific feature battery

            if (withingsType === -1) {
              const userResult = await oauth2Manager.executeQuery(
                serviceId,
                user.id,
                this.integrationName,
                'get',
                `${this.withingsUrl}/v2/user`,
                'action=getdevice',
              );

              // logger.debug(userResult.data.body);
              if (userResult.data.body.devices) {
                await userResult.data.body.devices.forEach((element) => {
                  logger.debug('withingsDeviceId: ', withingsDeviceId);
                  logger.debug('featureBattery: ', featureBattery);
                  if (element.deviceid === withingsDeviceId) {
                    const currentDate = new Date();
                    let currentBatValueString = `${element.battery}`;
                    let currentBatValue = 100;
                    switch (currentBatValueString) {
                      case 'low':
                        currentBatValueString = `${currentBatValueString} (< 30%)`;
                        currentBatValue = 20;
                        break;
                      case 'medium':
                        currentBatValueString = `${currentBatValueString} (> 30%)`;
                        currentBatValue = 30;
                        break;
                      case 'high':
                        currentBatValueString = `${currentBatValueString} (> 75%)`;
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
                    const uniqueSateId = uuid.v4();
                    const featureState = {
                      id: uniqueSateId,
                      device_feature_id: feat.id,
                      value: currentBatValue,
                      created_at: currentDate,
                      updated_at: currentDate,
                    };
                    gladys.device.saveHistoricalState(device, featureBattery, featureState);
                  }
                });
              }
            }
          });
        }

        return null;
      },
      { concurrency: 2 },
    );
  }
}

module.exports = {
  poll,
};
