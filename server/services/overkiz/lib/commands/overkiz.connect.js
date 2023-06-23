const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');
const { OVERKIZ_SERVER_PARAM, SUPPORTED_SERVERS } = require('../overkiz.constants');
const { CozytouchLoginHandler } = require('../client/overkiz.cozytouch');
const { DefaultLoginHandler } = require('../client/overkiz.default');
const { API } = require('../client/overkiz.api');

/**
 * @description Connect to OverKiz server.
 * @returns {Promise<object>} Return Object of informations.
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
      platformLoginHandler = new CozytouchLoginHandler(overkizServer, overkizUsername, overkizUserpassword);
      break;
    default:
      platformLoginHandler = new DefaultLoginHandler(overkizServer, overkizUsername, overkizUserpassword);
  }
  this.overkizServerAPI = new API({
    host: overkizServer.endpoint,
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
