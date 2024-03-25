const { getExternalId } = require('./ecovacs.externalId');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  DEVICE_POLL_FREQUENCIES,
  VACBOT_MODE,
} = require('../../../../utils/constants');

const WRITE_VALUE_MAPPING = {};
const READ_VALUE_MAPPING = {};

const addMapping = (exposeName, gladysValue, ecovacsValue) => {
  const writeExposeMapping = WRITE_VALUE_MAPPING[exposeName] || {};
  writeExposeMapping[gladysValue] = ecovacsValue;
  WRITE_VALUE_MAPPING[exposeName] = writeExposeMapping;

  const readExposeMapping = READ_VALUE_MAPPING[exposeName] || {};
  readExposeMapping[ecovacsValue] = gladysValue;
  READ_VALUE_MAPPING[exposeName] = readExposeMapping;
};

addMapping('state', VACBOT_MODE.CLEAN, 'CLEAN');
addMapping('state', VACBOT_MODE.PAUSE, 'PAUSE');
addMapping('state', VACBOT_MODE.STOP, 'STOP');
addMapping('state', VACBOT_MODE.CHARGE, 'CHARGE');

const convertToGladysDevice = (serviceId, device) => {
  return {
    service_id: serviceId,
    name: `${device.name}`,
    external_id: `${getExternalId(device)}`,
    selector: `${getExternalId(device)}`,
    model: `${device.model}`,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    params: [],
    features: [
      {
        name: 'power',
        selector: `ecovacs:${device.pid}:${DEVICE_FEATURE_TYPES.VACBOT.STATE}:${device.deviceNumber}`,
        external_id: `ecovacs:${device.pid}:${DEVICE_FEATURE_TYPES.VACBOT.STATE}:${device.deviceNumber}`,
        category: DEVICE_FEATURE_CATEGORIES.VACBOT,
        type: DEVICE_FEATURE_TYPES.VACBOT.STATE,
        read_only: false,
        keep_history: false,
        has_feedback: true,
        min: 0,
        max: 1,
      },
      {
        name: 'battery',
        selector: `ecovacs:${device.pid}:battery:${device.deviceNumber}`,
        external_id: `ecovacs:${device.pid}:battery:${device.deviceNumber}`,
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.VACBOT.INTEGER,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100,
      },
      {
        name: 'report',
        selector: `ecovacs:${device.pid}:${DEVICE_FEATURE_TYPES.VACBOT.CLEAN_REPORT}:${device.deviceNumber}`,
        external_id: `ecovacs:${device.pid}:${DEVICE_FEATURE_TYPES.VACBOT.CLEAN_REPORT}:${device.deviceNumber}`,
        category: DEVICE_FEATURE_CATEGORIES.VACBOT,
        type: DEVICE_FEATURE_TYPES.VACBOT.CLEAN_REPORT,
        read_only: true,
        keep_history: false,
        has_feedback: false,
        min: 0,
        max: 1,
      },
    ],
  };
};

module.exports = {
  convertToGladysDevice,
};
