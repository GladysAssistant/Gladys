const uuid = require('uuid');
const OAuth2Manager = require('../../../lib/oauth2');
const logger = require('../../../utils/logger');
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

  // Build params for all device
  const newParams = [
    {
      name: 'withingsDeviceId',
      value: withingsDevice.deviceid,
    },
  ];

  // Build features
  const newFeatures = [];
  // Feature allow in each device = battery
  const uniqueBatFeatureId = uuid.v4();
  const currentDate = new Date();
  let currentBatValueString = `${withingsDevice.battery}`;
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
  newFeatures.push({
    id: uniqueBatFeatureId,
    name: 'Battery',
    selector: `withings-battery-${uniqueId}`,
    device_id: uniqueId,
    external_id: uniqueId,
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
    external_id: uniqueId,
    selector: `withings-${withingsDevice.model}-${uniqueId}`,
    name: `Withings - ${withingsDevice.model}`,
    model: withingsDevice.model,
    room_id: null,
    service_id: serviceId,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_DAY,
    features: newFeatures,
    params: newParams,
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
  let features = currentFeatures;
  if (!features) {
    features = [];
  }

  // Consider only real measures (not user objectives) => category = 1
  if (currentGroup.category === 1) {
    currentGroup.measures.forEach((element) => {
      const gladysDeviceId = device.id;

      // Choose type of feature
      // (cf: https://developer.withings.com/oauth2/#tag/measure )
      let featureType;
      let featureName;
      let featureUnit;
      switch (element.type) {
        case 1:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.WEIGHT;
          featureName = 'Weight';
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 4:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.HEIGHT;
          featureName = 'Height';
          featureUnit = DEVICE_FEATURE_UNITS.CENTIMETER;
          break;
        case 5:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.FAT_FREE_MASS;
          featureName = 'Fat Free Mass';
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 6:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.FAT_RATIO;
          featureName = 'Fat Ratio';
          featureUnit = DEVICE_FEATURE_UNITS.PERCENT;
          break;
        case 8:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.FAT_MASS_WEIGHT;
          featureName = 'Fat Mass Weight';
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 9:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.DIASTOLIC_BLOOD_PRESSURE;
          featureName = 'Diastolic Blood Pressure';
          featureUnit = DEVICE_FEATURE_UNITS.MERCURE_MILIMETER;
          break;
        case 10:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.SYSTOLIC_BLOOD_PRESSURE;
          featureName = 'Systolic Blood Pressure';
          featureUnit = DEVICE_FEATURE_UNITS.MERCURE_MILIMETER;
          break;
        case 11:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.HEARTH_PULSE;
          featureName = 'Heart Pulse';
          featureUnit = DEVICE_FEATURE_UNITS.BEATS_PER_MINUTE;
          break;
        case 12:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.TEMPERATURE;
          featureName = 'Temperature';
          featureUnit = DEVICE_FEATURE_UNITS.CELSIUS;
          break;
        case 54:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.SPO2;
          featureName = 'SpO2';
          featureUnit = DEVICE_FEATURE_UNITS.PERCENT;
          break;
        case 71:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.BODY_TEMPERATURE;
          featureName = 'Body Temperature';
          featureUnit = DEVICE_FEATURE_UNITS.CELSIUS;
          break;
        case 73:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.SKIN_TEMPERATURE;
          featureName = 'Skin Temperature';
          featureUnit = DEVICE_FEATURE_UNITS.CELSIUS;
          break;
        case 76:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.MUSCLE_MASS;
          featureName = 'Muscle Mass';
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 77:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.HYDRATION;
          featureName = 'Hydration';
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 88:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.BONE_MASS;
          featureName = 'Bone Mass';
          featureUnit = DEVICE_FEATURE_UNITS.KILOGRAM;
          break;
        case 91:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.PULSE_WAVE_VELOCITY;
          featureName = 'Pulse Wave Velocity';
          featureUnit = DEVICE_FEATURE_UNITS.METER_PER_SECOND;
          break;
        default:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.UNKNOWN;
          featureName = 'Unknown';
          featureUnit = '';
          break;
      }

      // Search existing feature
      let tmpFeature = features.find((feat) => feat.type === featureType);
      let isNewFeature = false;

      // if not exist build new
      if (!tmpFeature) {
        isNewFeature = true;
        const uniqueId = uuid.v4();
        tmpFeature = {
          id: uniqueId,
          name: featureName,
          selector: `withings-${featureName}-${gladysDeviceId}`,
          device_id: gladysDeviceId,
          external_id: `withings-${featureName}:${gladysDeviceId}:${uniqueId}`,
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

      // Build a feature state
      const uniqueSateId = uuid.v4();
      const createDate = new Date(currentGroup.created * 1000);
      const featureState = {
        id: uniqueSateId,
        device_feature_id: tmpFeature.id,
        value: element.value * 10 ** element.unit,
        // created_at: `${createDate.getFullYear()}-${createDate.getMonth() + 1}-${createDate.getDate()}
        // ${createDate.getHours()}:${createDate.getMinutes()}:${createDate.getSeconds()}`,
        created_at: createDate,
        updated_at: new Date(),
      };

      tmpFeature.feature_state.push(featureState);

      if (!tmpFeature.last_value || tmpFeature.last_value_changed < createDate) {
        tmpFeature.last_value_changed = createDate;
        tmpFeature.last_value = featureState.value;
        tmpFeature.last_value_string = `${featureState.value}`;
      }

      if (isNewFeature) {
        features.push(tmpFeature);
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
 * withings.init('b2f2c27f0bf3414e0fe3facfba7be9455109409a');
 */
async function init(userId) {
  const { serviceId } = this;
  const oauth2Manager = new OAuth2Manager(this.gladys);

  const userResult = await oauth2Manager.executeQuery(
    serviceId,
    userId,
    this.integrationName,
    'get',
    `${this.withingsUrl}/v2/user`,
    'action=getdevice',
  );

  const devices = [];
  const mapOfDeviceByWithingsDeviceId = new Map();
  await userResult.data.body.devices.forEach((element) => {
    if (element) {
      // Build one gladys device for each withings device found
      const newDevice = buildNewDevice(element, serviceId);
      devices.push(newDevice);
      mapOfDeviceByWithingsDeviceId.set(element.deviceid, newDevice);
    }
  });

  const measureResult = await oauth2Manager.executeQuery(
    serviceId,
    userId,
    this.integrationName,
    'get',
    `${this.withingsUrl}/measure`,
    'action=getmeas',
  );

  // logger.warn(measureResult.data.body);
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

  const mapOfFeatureByWithingsDeviceId = new Map();
  await mapOfMeasuresGrpsByWithingsDeviceId.forEach(function buildFeatureByGrps(value, key) {
    value.forEach(function parseMeasureGroups(currentGroup) {
      if (key) {
        const currentFeatures = mapOfFeatureByWithingsDeviceId.get(key);
        const features = buildFeature(currentGroup, mapOfDeviceByWithingsDeviceId.get(key), currentFeatures);
        if (features) {
          mapOfFeatureByWithingsDeviceId.delete(key);
          mapOfFeatureByWithingsDeviceId.set(key, features);
        }
      }
    });
  });

  // Save device with feature
  const { gladys } = this;
  await mapOfDeviceByWithingsDeviceId.forEach(function saveDevice(value, key) {
    if (key) {
      const arrayOfFeatures = mapOfFeatureByWithingsDeviceId.get(key);
      // Assign features to device
      value.features = value.features.concat(arrayOfFeatures);
      // Save all device (with feature)
      gladys.device.create(value);
    }
  });

  return mapOfDeviceByWithingsDeviceId.values();
}

module.exports = {
  init,
};
