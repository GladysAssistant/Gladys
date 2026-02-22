const { BadParameters } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { readValues } = require('./device/tuya.deviceMapping');
const { API, DEVICE_PARAM_NAME, STATUS } = require('./utils/tuya.constants');
const { EVENTS } = require('../../../utils/constants');
const { normalizeBoolean } = require('./utils/tuya.normalize');
const { getParamValue } = require('./utils/tuya.deviceParams');
const { localPoll } = require('./tuya.localPoll');
const { getLocalDpsFromCode } = require('./device/tuya.localMapping');

const emitFeatureState = (gladys, deviceFeature, transformedValue) => {
  if (deviceFeature.last_value !== transformedValue) {
    if (transformedValue !== null && transformedValue !== undefined) {
      gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: deviceFeature.external_id,
        state: transformedValue,
      });
    }
  }
};

/**
 *
 * @description Poll values of an Tuya device.
 * @param {object} device - The device to poll.
 * @returns {Promise} Promise of nothing.
 * @example
 * poll(device);
 */
async function poll(device) {
  const externalId = device.external_id;
  const [prefix, topic] = device.external_id.split(':');

  if (prefix !== 'tuya') {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" should starts with "tuya:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" have no network indicator`);
  }

  const params = device.params || [];
  const ipAddress = getParamValue(params, DEVICE_PARAM_NAME.IP_ADDRESS);
  const localKey = getParamValue(params, DEVICE_PARAM_NAME.LOCAL_KEY);
  const protocolVersion = getParamValue(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const localOverride = normalizeBoolean(getParamValue(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE));
  const hasLocalConfig = ipAddress && localKey && protocolVersion && localOverride === true;

  if (hasLocalConfig) {
    const localResult = await localPoll({
      deviceId: topic,
      ip: ipAddress,
      localKey,
      protocolVersion,
      timeoutMs: 3000,
      fastScan: true,
    });
    const dps = localResult && localResult.dps ? localResult.dps : {};
    device.features.forEach((deviceFeature) => {
      const [, , code] = deviceFeature.external_id.split(':');
      const dpsKey = getLocalDpsFromCode(code);
      if (dpsKey === null || !(dpsKey in dps)) {
        return;
      }
      const reader = readValues[deviceFeature.category] && readValues[deviceFeature.category][deviceFeature.type];
      if (!reader) {
        return;
      }
      const transformedValue = reader(dps[dpsKey]);
      emitFeatureState(this.gladys, deviceFeature, transformedValue);
    });
    return;
  }

  if (this.status !== STATUS.CONNECTED) {
    logger.debug(`[Tuya][poll] Skip cloud poll for ${topic} (service not connected).`);
    return;
  }

  const response = await this.connector.request({
    method: 'GET',
    path: `${API.VERSION_1_0}/devices/${topic}/status`,
  });

  const values = {};
  (response.result || []).forEach((feature) => {
    values[feature.code] = feature.value;
  });

  device.features.forEach((deviceFeature) => {
    const [, , code] = deviceFeature.external_id.split(':');

    const value = values[code];
    const transformedValue = readValues[deviceFeature.category][deviceFeature.type](value);

    emitFeatureState(this.gladys, deviceFeature, transformedValue);
  });
}

module.exports = {
  poll,
};
