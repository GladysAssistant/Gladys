const uuid = require('uuid');
const { OAUTH2 } = require('../../../utils/constants.js');
const logger = require('../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_POLL_FREQUENCIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');

const withingsDeviceIdName = 'WITHINGS_DEVICE_ID';

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
      name: withingsDeviceIdName,
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
    name: 'deviceFeatureCategory.battery.shortCategoryName',
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
  const features = currentFeatures || [];

  // Consider only real measures (not user objectives) => category = 1
  if (currentGroup.category === 1) {
    currentGroup.measures.forEach((element) => {
      const gladysDeviceId = device.id;

      // Choose type of feature
      // (cf: https://developer.withings.com/api-reference#operation/measure-getmeas )
      let featureType;
      let featureUnit;
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
        default:
          featureType = DEVICE_FEATURE_TYPES.HEALTH.UNKNOWN;
          featureUnit = '';
          break;
      }
      const featureName = `deviceFeatureCategory.${DEVICE_FEATURE_CATEGORIES.HEALTH}.${featureType}`;

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

  // check if variable necessary to oauth2 connection is in variable table
  const tokenHost = this.gladys.variable.getValue(OAUTH2.VARIABLE.TOKEN_HOST, serviceId);
  if (!tokenHost) {
    // Init variable in db
    this.gladys.variable.setValue(OAUTH2.VARIABLE.TOKEN_HOST, 'https://wbsapi.withings.net', serviceId);
    this.gladys.variable.setValue(OAUTH2.VARIABLE.TOKEN_PATH, '/v2/oauth2', serviceId);
    this.gladys.variable.setValue(OAUTH2.VARIABLE.AUTHORIZE_HOST, 'https://account.withings.com', serviceId);
    this.gladys.variable.setValue(OAUTH2.VARIABLE.AUTHORIZE_PATH, '/oauth2_user/authorize2', serviceId);
    this.gladys.variable.setValue(
      OAUTH2.VARIABLE.ADDITIONAL_ACCESS_TOKEN_REQUEST_ACTION_PARAM,
      'requesttoken',
      serviceId,
    );
    this.gladys.variable.setValue(
      OAUTH2.VARIABLE.INTEGRATION_SCOPE,
      'user.info,user.metrics,user.activity,user.sleepevents',
      serviceId,
    );
    this.gladys.variable.setValue(OAUTH2.VARIABLE.GRANT_TYPE, 'authorization_code', serviceId);
    this.gladys.variable.setValue(
      OAUTH2.VARIABLE.REDIRECT_URI_SUFFIX,
      'dashboard/integration/health/withings/settings',
      serviceId,
    );
  }

  const userResult = await this.gladys.oauth2Client.executeOauth2HTTPQuery(
    serviceId,
    userId,
    'get',
    `${this.withingsUrl}/v2/user`,
    'action=getdevice',
  );

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

    const measureResult = await this.gladys.oauth2Client.executeOauth2HTTPQuery(
      serviceId,
      userId,
      'get',
      `${this.withingsUrl}/measure`,
      'action=getmeas',
    );

    const mapOfMeasuresGrpsByWithingsDeviceId = new Map();
    await measureResult.data.body.measuregrps.forEach((element) => {
      if (element) {
        // Build map of measuregrps by withings device id
        const measureList = mapOfMeasuresGrpsByWithingsDeviceId.get(element.deviceid) || [];
        measureList.push(element);
        mapOfMeasuresGrpsByWithingsDeviceId.set(element.deviceid, measureList);
      }
    });

    const mapOfFeatureByWithingsDeviceId = new Map();
    await mapOfMeasuresGrpsByWithingsDeviceId.forEach((value, key) => {
      value.forEach((currentGroup) => {
        if (key) {
          const currentFeatures = mapOfFeatureByWithingsDeviceId.get(key);
          const features = buildFeature(currentGroup, mapOfDeviceByWithingsDeviceId.get(key), currentFeatures);
          if (features) {
            mapOfFeatureByWithingsDeviceId.set(key, features);
          }
        }
      });
    });

    // get device in db to know device already connected
    const { gladys } = this;
    const devicesInDB = await gladys.device.get({ service: 'withings' });
    // Save device with feature
    await mapOfDeviceByWithingsDeviceId.forEach((value, key) => {
      if (key) {
        let matchDeviceInDB;
        if (devicesInDB) {
          const currentDeviceParam = value.params.filter((element) => element.name === withingsDeviceIdName);
          if (currentDeviceParam && currentDeviceParam.length > 0) {
            const currentWithingsDeviceId = currentDeviceParam[0].value;

            matchDeviceInDB = devicesInDB.find((element) =>
              element.params.find(
                (param) => param.name === withingsDeviceIdName && param.value === currentWithingsDeviceId,
              ),
            );
          }
        }

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
    });
  }
  return devicesResult;
}

module.exports = {
  init,
};
