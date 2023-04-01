const { API, CozytouchLoginHandler, DefaultLoginHandler } = require('overkiz-api');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { OVERKIZ_SERVER_PARAM, SUPPORTED_SERVERS } = require('../utils/overkiz.constants');

/**
 * @description Connect to OverKiz server.
 * @returns {Promise<Object>} Return Object of informations.
 * @example
 * overkiz.connect();
 */
async function connect() {
  logger.info(`Overkiz : Connecting server...`);

  const overkizType = await this.gladys.variable.getValue(OVERKIZ_SERVER_PARAM.OVERKIZ_TYPE, this.serviceId);
  if (!overkizType) {
    throw new ServiceNotConfiguredError(OVERKIZ_SERVER_PARAM.OVERKIZ_TYPE);
  }

  const overkizUsername = await this.gladys.variable.getValue(
    OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_USERNAME,
    this.serviceId,
  );
  if (!overkizUsername) {
    throw new ServiceNotConfiguredError(OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_USERNAME);
  }

  const overkizUserpassword = await this.gladys.variable.getValue(
    OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_PASSWORD,
    this.serviceId,
  );
  if (!overkizUserpassword) {
    throw new ServiceNotConfiguredError(OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_PASSWORD);
  }

  const overkizServer = SUPPORTED_SERVERS[overkizType];
  let platformLoginHandler;
  switch (overkizType) {
    case 'atlantic_cozytouch':
      platformLoginHandler = new CozytouchLoginHandler(overkizUsername, overkizUserpassword);
      break;
    default:
      platformLoginHandler = new DefaultLoginHandler(overkizUsername, overkizUserpassword);
  }
  this.overkizServerAPI = new API({
    host: overkizServer.host,
    platformLoginHandler,
    polling: {
      always: false,
      interval: 1000,
    },
  });
  this.connected = true;

  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.OVERKIZ.CONNECTED,
    payload: {},
  });

  this.syncOverkizDevices();
}

module.exports = {
  connect,
};
