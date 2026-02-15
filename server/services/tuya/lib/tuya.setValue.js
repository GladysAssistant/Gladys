const logger = require('../../../utils/logger');
const { API } = require('./utils/tuya.constants');
const { BadParameters } = require('../../../utils/coreErrors');
const { writeValues } = require('./device/tuya.deviceMapping');
const { DEVICE_PARAM_NAME } = require('./utils/tuya.constants');
const { getDpsMappingForDevice } = require('./models');
const TuyAPI = require('tuyapi');

const getParamValue = (params, name) => {
  const found = (params || []).find((param) => param.name === name);
  return found ? found.value : undefined;
};

const normalizeBoolean = (value) => {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
};

const getLocalDpsFromCode = (code) => {
  if (!code) {
    return null;
  }
  if (code === 'switch') {
    return 1;
  }
  const match = code.match(/_(\\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

const findDpsEntry = (dpsMapping, code) => {
  if (!dpsMapping || !Array.isArray(dpsMapping.dps)) {
    return null;
  }
  return dpsMapping.dps.find((entry) => entry.code === code) || null;
};

const mapValueForDps = (entry, value) => {
  let mappedValue = value;
  if (entry.map && typeof entry.map === 'object') {
    const inverse = Object.keys(entry.map).reduce((acc, key) => {
      acc[entry.map[key]] = key;
      return acc;
    }, {});
    if (inverse[mappedValue] !== undefined) {
      mappedValue = inverse[mappedValue];
    }
  }
  if (entry.type === 'integer' && typeof mappedValue === 'string') {
    const parsed = parseFloat(mappedValue);
    if (!Number.isNaN(parsed)) {
      mappedValue = parsed;
    }
  }
  if (entry.scale && typeof mappedValue === 'number') {
    mappedValue = Math.round(mappedValue / entry.scale);
    if (entry.raw && typeof entry.raw.step === 'number') {
      const step = entry.raw.step;
      mappedValue = Math.round(mappedValue / step) * step;
    }
  }
  if (entry.type === 'boolean' && typeof mappedValue === 'number') {
    mappedValue = mappedValue === 1;
  }
  return mappedValue;
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

  const writeCategory = writeValues[deviceFeature.category];
  const writeFn = writeCategory ? writeCategory[deviceFeature.type] : null;
  const transformedValue = writeFn ? writeFn(value) : value;
  logger.debug(`Change value for devices ${topic}/${command} to value ${transformedValue}...`);

  const params = device.params || [];
  const dpsMapping = getDpsMappingForDevice(device);
  const dpsEntry = findDpsEntry(dpsMapping, command);
  const mappedValue = dpsEntry ? mapValueForDps(dpsEntry, transformedValue) : transformedValue;
  const ipAddress = getParamValue(params, DEVICE_PARAM_NAME.IP_ADDRESS);
  const localKey = getParamValue(params, DEVICE_PARAM_NAME.LOCAL_KEY);
  const protocolVersion = getParamValue(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const cloudIp = getParamValue(params, DEVICE_PARAM_NAME.CLOUD_IP);
  const localOverride = normalizeBoolean(getParamValue(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE));

  const hasLocalConfig =
    ipAddress && localKey && protocolVersion && (localOverride === true || (cloudIp && ipAddress !== cloudIp));

  const localDps = dpsEntry ? dpsEntry.id : getLocalDpsFromCode(command);

  if (hasLocalConfig && localDps !== null) {
    try {
      const tuyaLocal = new TuyAPI({
        id: topic,
        key: localKey,
        ip: ipAddress,
        version: protocolVersion,
      });
      await tuyaLocal.connect();
      await tuyaLocal.set({ dps: localDps, set: mappedValue });
      await tuyaLocal.disconnect();
      logger.debug(`[Tuya][setValue][local] device=${topic} dps=${localDps} value=${mappedValue}`);
      return;
    } catch (e) {
      logger.warn(`[Tuya][setValue][local] failed, fallback to cloud`, e);
    }
  }

  const response = await this.connector.request({
    method: 'POST',
    path: `${API.VERSION_1_0}/devices/${topic}/commands`,
    body: {
      commands: [
        {
          code: command,
          value: mappedValue,
        },
      ],
    },
  });
  logger.debug(`[Tuya][setValue] ${JSON.stringify(response)}`);
}

module.exports = {
  setValue,
};
