const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');

const { STATUS } = require('./utils/melcloud.constants');

/**
 * @description Connect to MELCloud.
 * @param {object} configuration - MELCloud configuration properties.
 * @example
 * connect({baseUrl, accessKey, secretKey});
 */
async function connect(configuration) {
  const { username, password } = configuration;

  if (!username || !password) {
    this.status = STATUS.NOT_INITIALIZED;
    throw new ServiceNotConfiguredError('MELCloud is not configured.');
  }

  this.status = STATUS.CONNECTING;
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
    payload: { status: STATUS.CONNECTING },
  });

  logger.debug('Connecting to MELCloud...');

  try {
    const { data: response } = await this.client.post('Login/ClientLogin', {
      Email: username,
      Password: password,
      Language: 0,
      AppVersion: '1.19.1.1',
      Persist: true,
      CaptchaResponse: null,
    });
    if (!response.ErrorId) {
      this.contextKey = response.LoginData.ContextKey;
      this.status = STATUS.CONNECTED;
      logger.debug('Connected to Tuya');
    } else {
      this.status = STATUS.ERROR;
      logger.error('Error connecting to Tuya:', response.ErrorMessage);
    }
  } catch (e) {
    this.status = STATUS.ERROR;
    logger.error('Error connecting to Tuya:', e);
  }

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
    payload: { status: this.status },
  });
}

module.exports = {
  connect,
};
