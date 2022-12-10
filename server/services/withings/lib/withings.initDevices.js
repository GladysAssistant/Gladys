const uuid = require('uuid');
const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const withingsBatUtils = require('./utils/withings.buildBatteryLevelValues');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_POLL_FREQUENCIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');

/**
 * @description Build a new gladys device from withings device.
 *
 * @param {Object} withingsDevice - Withings device to transform.
 * @param {string} serviceId - Withings service id.
 * @returns {Object} Return a gladys device.
 * @example
 * withings.buildNewDevice('7fdsf4s68r4gfr68f4r63csd7f6f4c3r85', '78v4f3df83g74v1fsd8375f63gvrf5c');
 */
function buildNewDevice(withingsDevice, serviceId) {
  // Build unique id for the device
  const uniqueId = uuid.v4();

  // Build features
  const newFeatures = [];
  // Feature allow in each device = battery
  const uniqueBatFeatureId = uuid.v4();
  const currentDate = new Date();

  const batteryValues = withingsBatUtils.buildBatteryLevelValues(withingsDevice.battery);
  const currentBatValue = batteryValues[0];
  const currentBatValueString = batteryValues[1];

  newFeatures.push({
    id: uniqueBatFeatureId,
    selector: `withings-${withingsDevice.model}-battery`,
    device_id: uniqueId,
    external_id: `withings:${withingsDevice.model}:${DEVICE_FEATURE_CATEGORIES.BATTERY}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`,
    category: DEVICE_FEATURE_CATEGORIES.BATTERY,
    type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    read_only: true,
    keep_history: false,
    has_feedback: false,
    min: 0,
    max: 0,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    last_value_changed: currentDate,
    last_value: currentBatValue,
    last_value_string: currentBatValueString,
    feature_state: [
      {
        id: uuid.v4(),
        device_feature_id: uniqueBatFeatureId,
        value: currentBatValue,
        created_at: currentDate,
        updated_at: currentDate,
      },
    ],
  });
  logger.trace('Battery feature: ', newFeatures);

  const newDevice = {
    id: uniqueId,
    external_id: withingsDevice.deviceid,
    selector: `withings-${withingsDevice.model}`,
    name: `Withings - ${withingsDevice.model}`,
    model: withingsDevice.model,
    room_id: null,
    service_id: serviceId,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_DAY,
    features: newFeatures,
  };

  return newDevice;
}

/**
 * @description  Build features of gladys device.
 * @param {Object} currentGroup - Withings measure groups to transform.
 * @param {Object} device - Current device.
 * @param {Array} currentFeatures - CurrentFeature array to update if exist.
 * @returns {Array} Return array of features.
 * @example
 * withings.buildFeature({...}, {....}, null);
 */
function buildFeature(currentGroup, device, currentFeatures) {
  // Build (or get) feature corresponding to the measure
  const features = currentFeatures || [];

  // Consider only real measures (not user objectives) => category = 1
  if (currentGroup.category === 1) {
    currentGroup.measures.forEach((element) => {
      const gladysDeviceId = device.id;

      // Choose type of feature
      // (cf: https://developer.withings.com/api-reference#operation/measure-getmeas )
      let featureType;
      let featureUnit = '';
      switch (element.type) {
        case 1:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.WEIGHT;
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 4:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.HEIGHT;
          featureUnit = DEVICE_FEATURE_UNITS.CENTIMETER;
          break;
        case 5:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.FAT_FREE_MASS;
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 6:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.FAT_RATIO;
          featureUnit = DEVICE_FEATURE_UNITS.PERCENT;
          break;
        case 8:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.FAT_MASS_WEIGHT;
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 9:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.DIASTOLIC_BLOOD_PRESSURE;
          featureUnit = DEVICE_FEATURE_UNITS.MERCURE_MILIMETER;
          break;
        case 10:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.SYSTOLIC_BLOOD_PRESSURE;
          featureUnit = DEVICE_FEATURE_UNITS.MERCURE_MILIMETER;
          break;
        case 11:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.HEARTH_PULSE;
          featureUnit = DEVICE_FEATURE_UNITS.BEATS_PER_MINUTE;
          break;
        case 12:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.TEMPERATURE;
          featureUnit = DEVICE_FEATURE_UNITS.CELSIUS;
          break;
        case 54:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.SPO2;
          featureUnit = DEVICE_FEATURE_UNITS.PERCENT;
          break;
        case 71:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.BODY_TEMPERATURE;
          featureUnit = DEVICE_FEATURE_UNITS.CELSIUS;
          break;
        case 73:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.SKIN_TEMPERATURE;
          featureUnit = DEVICE_FEATURE_UNITS.CELSIUS;
          break;
        case 76:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.MUSCLE_MASS;
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 77:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.HYDRATION;
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 88:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.BONE_MASS;
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 91:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.PULSE_WAVE_VELOCITY;
          featureUnit = DEVICE_FEATURE_UNITS.METER_PER_SECOND;
          break;
        case 123:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.VO2_MAX;
          featureUnit = DEVICE_FEATURE_UNITS.MILILITTER_PER_MINUTE_PER_KILOGRAM;
          break;
        case 135:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.QRS_INERVAL;
          break;
        case 136:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.PR_INERVAL;
          break;
        case 137:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.QT_INERVAL;
          break;
        case 138:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.CORRECTED_QT_INERVAL;
          break;
        case 139:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.ATRIAL_FIBRILLATION;
          break;
        default:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.UNKNOWN;
          break;
      }

      if (featureType !== DEVICE_FEATURE_TYPES.HEALTH.UNKNOWN) {
        // Search existing feature
        let tmpFeature = features.find((feat) => feat.type === featureType);
        let isNewFeature = false;

        // if not exist build new
        if (!tmpFeature) {
          isNewFeature = true;
          const uniqueId = uuid.v4();
          tmpFeature = {
            id: uniqueId,
            selector: `${device.selector}-${featureType}`,
            device_id: gladysDeviceId,
            external_id: `withings:${device.model}:${DEVICE_FEATURE_CATEGORIES.HEALTH}:${featureType}`,
            category: DEVICE_FEATURE_CATEGORIES.HEALTH,
            type: featureType,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            unit: featureUnit,
            min: 0,
            max: 100000,
            feature_state: [],
          };
        }

        if (isNewFeature) {
          features.push(tmpFeature);
        }
      }
    });
  }

  return features;
}

/**
 * @description Build and save withings device and init feature values.
 * @param {string} userId - Gladys userId of current session.
 * @returns {Promise} Resolve with withings device added.
 * @example
 * withings.initDevices('b2f2c27f0bf3414e0fe3facfba7be9455109409a');
 */
async function initDevices(userId) {
  const { serviceId } = this;

  const userResult = await this.getDevices(userId);

  const devices = [];
  const devicesResult = [];
  const mapOfDeviceByWithingsDeviceId = new Map();

  if (userResult.data.body.devices) {
    await userResult.data.body.devices.forEach((element) => {
      if (element) {
        // Build one gladys device for each withings device found
        const newDevice = buildNewDevice(element, serviceId);
        devices.push(newDevice);
        mapOfDeviceByWithingsDeviceId.set(element.deviceid, newDevice);
      }
    });

    const measureResult = await this.getMeasures(userId, null);

    const mapOfMeasuresGrpsByWithingsDeviceId = this.buildMapOfMeasures(measureResult.data.body.measuregrps);

    // Build map of feature (based on withings measures)
    const mapOfFeatureByWithingsDeviceId = new Map();
    await Promise.map(
      mapOfMeasuresGrpsByWithingsDeviceId.entries(),
      async (entrie) => {
        const key = entrie[0];
        const value = entrie[1];
        value.forEach((currentGroup) => {
          if (key) {
            const currentFeatures = mapOfFeatureByWithingsDeviceId.get(key);
            const features = buildFeature(currentGroup, mapOfDeviceByWithingsDeviceId.get(key), currentFeatures);
            if (features) {
              mapOfFeatureByWithingsDeviceId.set(key, features);
            }
          }
        });
      },
      { concurrency: 0 },
    );
    
    logger.trace('measureResult: ', measureResult);
    logger.trace('mapOfDeviceByWithingsDeviceId: ', mapOfDeviceByWithingsDeviceId);
    logger.trace('mapOfFeatureByWithingsDeviceId: ', mapOfFeatureByWithingsDeviceId);

    // Build list of device to display
    await Promise.map(
      mapOfDeviceByWithingsDeviceId.entries(),
      async (entrie) => {
        const key = entrie[0];
        const value = entrie[1];
        if (key) {
          const matchDeviceInDB = await this.matchDeviceInDB(value);

          if (matchDeviceInDB) {
            matchDeviceInDB.inDB = true;
            devicesResult.push(matchDeviceInDB);
          } else {
            const arrayOfFeatures = mapOfFeatureByWithingsDeviceId.get(key);
            // Assign features to device
            value.features = value.features.concat(arrayOfFeatures);
            devicesResult.push(value);
          }
        }
      },
      { concurrency: 0 },
    );
  }

  logger.debug(devicesResult);
  devicesResult.forEach((device) => logger.debug(device.features));

  return devicesResult;
}

module.exports = {
  initDevices,
};
