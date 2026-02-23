const TuyAPI = require('tuyapi');
const TuyAPINewGen = require('@demirdeniz/tuyapi-newgen');
const logger = require('../../../utils/logger');
const { API } = require('./utils/tuya.constants');
const { BadParameters } = require('../../../utils/coreErrors');
const { writeValues } = require('./device/tuya.deviceMapping');
const { DEVICE_PARAM_NAME } = require('./utils/tuya.constants');
const { DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { celsiusToFahrenheit, fahrenheitToCelsius } = require('../../../utils/units');
const { normalizeBoolean, normalizeTemperatureUnit } = require('./utils/tuya.normalize');
const { getParamValue } = require('./utils/tuya.deviceParams');
const { getLocalDpsFromCode } = require('./device/tuya.localMapping');

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

  const params = device.params || [];
  const deviceTemperatureUnit = normalizeTemperatureUnit(getParamValue(params, DEVICE_PARAM_NAME.TEMPERATURE_UNIT));

  let valueToSend = value;
  if (
    command === 'temp_set' &&
    deviceFeature.unit &&
    deviceTemperatureUnit &&
    deviceFeature.unit !== deviceTemperatureUnit
  ) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      if (
        deviceFeature.unit === DEVICE_FEATURE_UNITS.CELSIUS &&
        deviceTemperatureUnit === DEVICE_FEATURE_UNITS.FAHRENHEIT
      ) {
        valueToSend = celsiusToFahrenheit(numericValue);
      } else if (
        deviceFeature.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT &&
        deviceTemperatureUnit === DEVICE_FEATURE_UNITS.CELSIUS
      ) {
        valueToSend = fahrenheitToCelsius(numericValue);
      }
      if (Number.isFinite(valueToSend)) {
        valueToSend = Math.round(valueToSend);
      }
    }
  }

  const writeCategory = writeValues[deviceFeature.category];
  const writeFn = writeCategory ? writeCategory[deviceFeature.type] : null;
  const transformedValue = writeFn ? writeFn(valueToSend, deviceFeature) : valueToSend;
  logger.debug(`Change value for devices ${topic}/${command} to value ${transformedValue}...`);

  const ipAddress = getParamValue(params, DEVICE_PARAM_NAME.IP_ADDRESS);
  const localKey = getParamValue(params, DEVICE_PARAM_NAME.LOCAL_KEY);
  const protocolVersionRaw = getParamValue(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const protocolVersion =
    protocolVersionRaw !== null && protocolVersionRaw !== undefined ? String(protocolVersionRaw).trim() : undefined;
  const localOverride = normalizeBoolean(getParamValue(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE));

  const hasLocalConfig = ipAddress && localKey && protocolVersion && localOverride === true;

  const localDps = getLocalDpsFromCode(command, device);

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
      tuyaOptions.KeepAlive = false;
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
      return;
    }
  }

  logger.debug(`[Tuya][setValue][cloud] device=${topic} command=${command} value=${transformedValue}`);
  const response = await this.connector.request({
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
}

module.exports = {
  setValue,
};
