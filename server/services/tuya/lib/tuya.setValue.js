const TuyAPI = require('tuyapi');
const TuyAPINewGen = require('@demirdeniz/tuyapi-newgen');
const logger = require('../../../utils/logger');
const { API } = require('./utils/tuya.constants');
const { BadParameters } = require('../../../utils/coreErrors');
const { writeValues } = require('./device/tuya.deviceMapping');
const { DEVICE_PARAM_NAME } = require('./utils/tuya.constants');
const { normalizeBoolean } = require('./utils/tuya.normalize');
const { getParamValue } = require('./utils/tuya.deviceParams');
const { getLocalDpsFromCode } = require('./device/tuya.localMapping');
const { isLocalSkipNeeded, recordLocalFailure, recordLocalSuccess } = require('./utils/tuya.degraded');

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

  const writeCategory = writeValues[deviceFeature.category];
  const writeFn = writeCategory ? writeCategory[deviceFeature.type] : null;
  const transformedValue = writeFn ? writeFn(value) : value;
  logger.debug(`Change value for devices ${topic}/${command} to value ${transformedValue}...`);

  const params = device.params || [];
  const ipAddress = getParamValue(params, DEVICE_PARAM_NAME.IP_ADDRESS);
  const localKey = getParamValue(params, DEVICE_PARAM_NAME.LOCAL_KEY);
  const protocolVersionRaw = getParamValue(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const protocolVersion =
    protocolVersionRaw !== null && protocolVersionRaw !== undefined ? String(protocolVersionRaw).trim() : undefined;
  const localOverride = normalizeBoolean(getParamValue(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE));

  const hasLocalConfig = ipAddress && localKey && protocolVersion && localOverride === true;

  const localDps = getLocalDpsFromCode(command, device);
  const localSkipped = hasLocalConfig && isLocalSkipNeeded(this.degradedDevices, topic);
  if (localSkipped) {
    logger.debug(`[Tuya][setValue] device=${topic} skipping local (degraded backoff active), using cloud`);
  }

  if (hasLocalConfig && localDps !== null && !localSkipped) {
    // Prefer the already-open persistent connection: a Tuya device accepts only one local session at a
    // time, so opening a dedicated write connection here would contend with the persistent socket
    // (several seconds of delay). Reusing it makes local writes instant.
    if (typeof this.sendCommandViaPersistentConnection === 'function') {
      try {
        const sentViaPersistent = await this.sendCommandViaPersistentConnection(topic, localDps, transformedValue);
        if (sentViaPersistent) {
          logger.debug(`[Tuya][setValue][persistent] device=${topic} dps=${localDps} value=${transformedValue}`);
          recordLocalSuccess(this.degradedDevices, topic);
          return;
        }
      } catch (e) {
        logger.warn(
          `[Tuya][setValue][persistent] set via persistent connection failed for device=${topic}, using a dedicated local connection`,
          e,
        );
      }
    }

    const isProtocol34 = protocolVersion === '3.4';
    const isProtocol35 = protocolVersion === '3.5';
    const isNewGenProtocol = isProtocol34 || isProtocol35;
    const TuyaLocalApi = isNewGenProtocol ? TuyAPINewGen : TuyAPI;
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
    const { degradedDevices } = this;
    const runLocalSet = async () => {
      const tuyaLocal = new TuyaLocalApi(tuyaOptions);
      // Absorb async socket errors so they do not bubble up as uncaughtException
      // when the device drops the connection mid-command. The stub-friendly
      // guard keeps tests working when their TuyAPI stub does not implement on().
      if (typeof tuyaLocal.on === 'function') {
        tuyaLocal.on('error', (err) => {
          logger.info(
            `[Tuya][setValue][local] socket error for device=${topic}: ${err && err.message ? err.message : err}`,
          );
        });
      }
      try {
        await tuyaLocal.connect();
        await tuyaLocal.set({ dps: localDps, set: transformedValue });
        logger.debug(`[Tuya][setValue][local] device=${topic} dps=${localDps} value=${transformedValue}`);
        recordLocalSuccess(degradedDevices, topic);
        return true;
      } catch (e) {
        logger.warn(`[Tuya][setValue][local] failed, fallback to cloud`, e);
        recordLocalFailure(degradedDevices, topic, e);
        return false;
      } finally {
        // Always close the socket — even if connect() failed — so the device
        // does not refuse subsequent local connections (cascading ECONNRESET).
        try {
          await tuyaLocal.disconnect();
        } catch (disconnectError) {
          logger.warn('[Tuya][setValue][local] disconnect failed', disconnectError);
        }
      }
    };

    const localSuccess = await runLocalSet();
    if (localSuccess) {
      return;
    }
  }

  if (!this.connector || typeof this.connector.request !== 'function') {
    logger.warn(
      `[Tuya][setValue][cloud] connector unavailable for device=${topic} (cloud disconnected); local set did not succeed and no fallback is possible`,
    );
    return;
  }

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
