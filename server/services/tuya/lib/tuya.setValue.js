const TuyAPI = require('tuyapi');
const TuyAPINewGen = require('@demirdeniz/tuyapi-newgen');
const logger = require('../../../utils/logger');
const { API } = require('./utils/tuya.constants');
const { BadParameters } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { celsiusToFahrenheit, fahrenheitToCelsius } = require('../../../utils/units');
const { writeValues } = require('./device/tuya.deviceMapping');
const { DEVICE_PARAM_NAME } = require('./utils/tuya.constants');
const { CLOUD_STRATEGY, getConfiguredCloudStrategy } = require('./utils/tuya.cloudStrategy');
const { normalizeBoolean, normalizeTemperatureUnit } = require('./utils/tuya.normalize');
const { getParamValue } = require('./utils/tuya.deviceParams');
const { getLocalDpsFromCode } = require('./device/tuya.localMapping');
const { getDeviceType, getFeatureMapping } = require('./mappings');

const FEEDBACK_POLL_DELAY_MS = 1000;

const sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

const getTemperatureUnitFromProperties = (device) => {
  if (!device || !device.properties || !Array.isArray(device.properties.properties)) {
    return null;
  }
  const unitProperty = device.properties.properties.find(
    (property) => property && (property.code === 'temp_unit_convert' || property.code === 'unit'),
  );
  return normalizeTemperatureUnit(unitProperty && unitProperty.value);
};

const getFeatureWithFallbackScale = (device, deviceFeature, command) => {
  if (!deviceFeature || deviceFeature.scale !== undefined) {
    return deviceFeature;
  }
  const deviceType = device && device.device_type ? device.device_type : getDeviceType(device);
  const mapping = getFeatureMapping(command, deviceType);
  if (!mapping || mapping.scale === undefined) {
    return deviceFeature;
  }
  return {
    ...deviceFeature,
    scale: mapping.scale,
  };
};

const convertTemperatureForDevice = (value, deviceFeature, deviceTemperatureUnit) => {
  if (
    !deviceFeature ||
    !deviceFeature.unit ||
    !deviceTemperatureUnit ||
    deviceFeature.unit === deviceTemperatureUnit ||
    deviceFeature.type !== 'target-temperature'
  ) {
    return value;
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return value;
  }
  if (
    deviceFeature.unit === DEVICE_FEATURE_UNITS.CELSIUS &&
    deviceTemperatureUnit === DEVICE_FEATURE_UNITS.FAHRENHEIT
  ) {
    return Math.round(celsiusToFahrenheit(numericValue));
  }
  if (
    deviceFeature.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT &&
    deviceTemperatureUnit === DEVICE_FEATURE_UNITS.CELSIUS
  ) {
    return Math.round(fahrenheitToCelsius(numericValue));
  }
  return value;
};

const pollFeedbackIfAvailable = async (context, device, topic, command, reason) => {
  if (typeof context.poll !== 'function' || !device || !device.external_id) {
    return;
  }
  try {
    const delayMs =
      context && Number.isFinite(context.feedbackPollDelayMs) ? context.feedbackPollDelayMs : FEEDBACK_POLL_DELAY_MS;
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    await context.poll(device);
  } catch (e) {
    logger.warn(`[Tuya][setValue] feedback poll failed after ${reason} for ${topic}/${command}`, e);
  }
};

/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;
  const [prefix, topic, command] = deviceFeature.external_id.split(':');

  if (prefix !== 'tuya') {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" should starts with "tuya:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" have no network indicator`);
  }
  if (!command || command.trim().length === 0) {
    throw new BadParameters(`Tuya device external_id is invalid: "${externalId}" have no command`);
  }

  const effectiveDevice = device;
  const effectiveFeature = getFeatureWithFallbackScale(effectiveDevice, deviceFeature, command);
  const deviceTemperatureUnit = getTemperatureUnitFromProperties(effectiveDevice);
  const convertedValue = convertTemperatureForDevice(value, effectiveFeature, deviceTemperatureUnit);
  const writeCategory = writeValues[deviceFeature.category];
  const writeFn = writeCategory ? writeCategory[deviceFeature.type] : null;
  const transformedValue = writeFn ? writeFn(convertedValue, effectiveFeature) : convertedValue;
  logger.debug(`Change value for devices ${topic}/${command} to value ${transformedValue}...`);

  const params = effectiveDevice.params || [];
  const ipAddress = getParamValue(params, DEVICE_PARAM_NAME.IP_ADDRESS);
  const localKey = getParamValue(params, DEVICE_PARAM_NAME.LOCAL_KEY);
  const protocolVersionRaw = getParamValue(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const protocolVersion =
    protocolVersionRaw !== null && protocolVersionRaw !== undefined ? String(protocolVersionRaw).trim() : undefined;
  const localOverride = normalizeBoolean(getParamValue(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE));

  const hasLocalConfig = ipAddress && localKey && protocolVersion && localOverride === true;

  const localDps = getLocalDpsFromCode(command, effectiveDevice);

  if (hasLocalConfig && localDps !== null) {
    const isProtocol35 = protocolVersion === '3.5';
    const TuyaLocalApi = isProtocol35 ? TuyAPINewGen : TuyAPI;
    const tuyaOptions = {
      id: topic,
      key: localKey,
      ip: ipAddress,
      version: protocolVersion,
      issueGetOnConnect: false,
      issueRefreshOnConnect: false,
      issueRefreshOnPing: false,
    };
    if (isProtocol35) {
      tuyaOptions.keepAlive = false;
    }
    const runLocalSet = async () => {
      const tuyaLocal = new TuyaLocalApi(tuyaOptions);
      let connected = false;
      try {
        await tuyaLocal.connect();
        connected = true;
        await tuyaLocal.set({ dps: localDps, set: transformedValue });
        logger.debug(`[Tuya][setValue][local] device=${topic} dps=${localDps} value=${transformedValue}`);
        return true;
      } catch (e) {
        logger.warn(`[Tuya][setValue][local] failed, fallback to cloud`, e);
        return false;
      } finally {
        if (connected) {
          try {
            await tuyaLocal.disconnect();
          } catch (disconnectError) {
            logger.warn('[Tuya][setValue][local] disconnect failed', disconnectError);
          }
        }
      }
    };

    const localSuccess = await runLocalSet();
    if (localSuccess) {
      await pollFeedbackIfAvailable(this, effectiveDevice, topic, command, 'local command');
      return;
    }
  }

  const cloudStrategy = getConfiguredCloudStrategy(effectiveDevice);

  const response =
    cloudStrategy === CLOUD_STRATEGY.SHADOW
      ? await this.connector.request({
          method: 'POST',
          path: `${API.VERSION_2_0}/thing/${topic}/shadow/properties/issue`,
          body: {
            properties: JSON.stringify({
              [command]: transformedValue,
            }),
          },
        })
      : await this.connector.request({
          method: 'POST',
          path: `${API.VERSION_1_0}/devices/${topic}/commands`,
          body: {
            commands: [
              {
                code: command,
                value: transformedValue,
              },
            ],
          },
        });
  logger.debug(`[Tuya][setValue] ${JSON.stringify(response)}`);
  if (!response || response.success === false) {
    await pollFeedbackIfAvailable(this, effectiveDevice, topic, command, 'rejected cloud command');
    throw new BadParameters(
      `[Tuya][setValue] command rejected for ${topic}/${command}: ${
        response && response.msg ? response.msg : 'unknown error'
      }`,
    );
  }
  await pollFeedbackIfAvailable(this, effectiveDevice, topic, command, 'cloud command');
}

module.exports = {
  setValue,
};
