const uuid = require('uuid');
const { DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const OAuth2Manager = require('../../../lib/oauth2');

/**
 * @description Poll value of a withings device.
 * @param {Object} device - The device to update value.
 * @returns {Promise} Resolve with withings device poll.
 * @example
 * poll(device);
 */
async function poll(device) {
  if (device.features) {
    const oauth2Manager = new OAuth2Manager();
    const accessToken = device.params.find((oneParam) => oneParam.name === 'accessToken');
    const refreshToken = device.params.find((oneParam) => oneParam.name === 'refreshToken');
    const tokenType = device.params.find((oneParam) => oneParam.name === 'tokenType');

    device.features.array.forEach(async (feat) => {
      // Convert type to int wihings
      // (cf https://developer.withings.com/oauth2/#tag/measure%2Fpaths%2Fhttps%3A~1~1wbsapi.withings.net~1measure%3Faction%3Dgetmeas%2Fget)
      let withingsType;
      switch (feat.type) {
        case DEVICE_FEATURE_TYPES.WITHINGS.WEIGHT:
          withingsType = 1;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.HEIGHT:
          withingsType = 4;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.FAT_FREE_MASS:
          withingsType = 5;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.FAT_RATIO:
          withingsType = 6;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.FAT_MASS_WEIGHT:
          withingsType = 8;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.DIASTOLIC_BLOOD_PRESSURE:
          withingsType = 9;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.SYSTOLIC_BLOOD_PRESSURE:
          withingsType = 10;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.HEARTH_PULSE:
          withingsType = 11;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.TEMPERATURE:
          withingsType = 12;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.SPO2:
          withingsType = 54;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.BODY_TEMPERATURE:
          withingsType = 71;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.SKIN_TEMPERATURE:
          withingsType = 73;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.MUSCLE_MASS:
          withingsType = 76;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.HYDRATION:
          withingsType = 77;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.BONE_MASS:
          withingsType = 88;
          break;
        case DEVICE_FEATURE_TYPES.WITHINGS.PULSE_WAVE_VELOCITY:
          withingsType = 91;
          break;
        default:
          withingsType = 0;
          break;
      }
      if (withingsType > 0) {
        const measureResult = await oauth2Manager.executeQuery(
          accessToken,
          refreshToken,
          tokenType,
          'get',
          `${this.withingsUrl}/measure`,
          `action=getmeas?meastype=${withingsType}&category=1&lastupdate${feat.last_valueChanged}`,
        );

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
          value.forEach(function(currentGroup) {
            if (key) {
              // Build a feature state
              const uniqueSateId = uuid.v4();
              const createDate = new Date(currentGroup.created * 1000);
              const featureState = {
                id: uniqueSateId,
                device_feature_id: feat.id,
                value: currentGroup.value * 10 ** currentGroup.unit,
                // created_at: `${createDate.getFullYear()}-${createDate.getMonth() + 1}-${createDate.getDate()}
                // ${createDate.getHours()}:${createDate.getMinutes()}:${createDate.getSeconds()}`,
                created_at: createDate,
                updated_at: new Date(),
              };
              this.gladys.device.saveHistoricalState(device, feat, featureState);
            }
          });
        });
      }
    });
  }
}

module.exports = {
  poll,
};
