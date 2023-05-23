const { TuyaContext } = require('@tuya/tuya-connector-nodejs');

const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

const { STATUS } = require('./utils/tuya.constants');

/**
 * @description Connect to Tuya cloud.
 * @param {object} configuration - Tuya configuration properties.
 * @example
 * connect({baseUrl, accessKey, secretKey});
 */
async function connect(configuration) {
  const { baseUrl, accessKey, secretKey } = configuration;

  if (!baseUrl || !accessKey || !secretKey) {
    this.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError('Tuya is not configured.');
  }

  this.status = STATUS.CONNECTING;
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
    this.connector.client.init();
    this.status = STATUS.CONNECTED;
    logger.debug('Connected to Tuya');
  } catch (e) {
    this.status = STATUS.ERROR;
    logger.error('Error connecting to Tuya:', e);
  }

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
    payload: { status: this.status },
  });
}

module.exports = {
  connect,
};
