const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

const { STATUS, GLADYS_VARIABLES, API } = require('./utils/tuya.constants');
const { buildConfigHash } = require('./utils/tuya.config');

/**
 * @description Map Tuya errors to user-facing i18n keys and retry policy.
 * @param {Error} error - Error thrown during connection.
 * @returns {object|null} Mapping info or null when unknown.
 * @example
 * const mapped = mapConnectionError(new Error('GET_TOKEN_FAILED 2009, clientId is invalid'));
 */
const mapConnectionError = (error) => {
  const rawMessage = error && error.message ? error.message : '';
  const message = rawMessage.toLowerCase();
  const code = error && error.code ? String(error.code).toLowerCase() : '';

  if (code === '2009' || message.includes('clientid is invalid') || message.includes('get_token_failed 2009')) {
    return { key: 'integration.tuya.setup.errorInvalidClientId', disableAutoReconnect: true };
  }

  if (code === '1004' || message.includes('sign invalid') || message.includes('get_token_failed 1004')) {
    return { key: 'integration.tuya.setup.errorInvalidClientSecret', disableAutoReconnect: true };
  }

  if (code === '28841107' || message.includes('data center is suspended') || message.includes('data center')) {
    return { key: 'integration.tuya.setup.errorInvalidEndpoint', disableAutoReconnect: true };
  }

  if (
    code === '1106' ||
    message.includes('permission deny') ||
    code === 'tuya_app_account_uid_missing' ||
    code === 'tuya_app_account_uid_invalid'
  ) {
    return { key: 'integration.tuya.setup.errorInvalidAppAccountUid', disableAutoReconnect: true };
  }

  return null;
};

/**
 * @description Validate Tuya app account UID by calling the devices endpoint.
 * @param {object} connector - Tuya connector instance.
 * @param {string} appAccountId - Tuya app account UID.
 * @returns {Promise<void>} Resolves when valid.
 * @example
 * await validateAppAccount(connector, 'uid');
 */
const validateAppAccount = async (connector, appAccountId) => {
  if (!appAccountId) {
    const error = new Error('TUYA_APP_ACCOUNT_UID_MISSING');
    error.code = 'TUYA_APP_ACCOUNT_UID_MISSING';
    throw error;
  }
  const response = await connector.request({
    method: 'GET',
    path: `${API.PUBLIC_VERSION_1_0}/users/${appAccountId}/devices`,
    query: {
      page_no: 1,
      page_size: 1,
    },
  });
  if (!response) {
    const error = new Error('TUYA_APP_ACCOUNT_UID_INVALID');
    error.code = 'TUYA_APP_ACCOUNT_UID_INVALID';
    throw error;
  }
  if (response && response.success === false) {
    const error = new Error(response.msg || response.message || 'TUYA_APP_ACCOUNT_UID_INVALID');
    error.code = response.code || 'TUYA_APP_ACCOUNT_UID_INVALID';
    throw error;
  }
};

/**
 * @description Connect to Tuya cloud.
 * @param {object} configuration - Tuya configuration properties.
 * @example
 * connect({baseUrl, accessKey, secretKey});
 */
async function connect(configuration) {
  const { baseUrl, accessKey, secretKey, appAccountId } = configuration;

  if (!baseUrl || !accessKey || !secretKey) {
    this.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError('Tuya is not configured.');
  }

  this.status = STATUS.CONNECTING;
  this.lastError = null;
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
    payload: { status: STATUS.CONNECTING },
  });

  logger.debug('Connecting to Tuya...');
  this.connector = new TuyaContext({
    baseUrl,
    accessKey,
    secretKey,
    store: this,
  });

  try {
    await this.connector.client.init();
    await validateAppAccount(this.connector, appAccountId);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.MANUAL_DISCONNECT, 'false', this.serviceId);
    const configHash = buildConfigHash(configuration);
    await this.gladys.variable.setValue(GLADYS_VARIABLES.LAST_CONNECTED_CONFIG_HASH, configHash, this.serviceId);
    this.autoReconnectAllowed = true;
    this.status = STATUS.CONNECTED;
    logger.debug('Connected to Tuya');
  } catch (e) {
    this.status = STATUS.ERROR;
    const mapped = mapConnectionError(e);
    let message = 'Unknown error';
    if (mapped) {
      message = mapped.key;
    } else if (e && e.message) {
      message = e.message;
    }
    this.lastError = message;
    if (mapped && mapped.disableAutoReconnect) {
      this.autoReconnectAllowed = false;
    }
    logger.error('Error connecting to Tuya:', e);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.ERROR,
      payload: { message },
    });
  }

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
    payload: { status: this.status, error: this.lastError },
  });
}

module.exports = {
  connect,
};
