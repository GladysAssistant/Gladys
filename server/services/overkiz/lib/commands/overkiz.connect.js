const axios = require('axios');
const url = require('url');
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

  this.overkizServer = SUPPORTED_SERVERS[overkizType];

  let payload;
  if (this.overkizServer.jwt) {
    const params = new url.URLSearchParams({
      username: overkizUsername,
      password: overkizUserpassword,
      grant_type: 'password',
    });
    let response = await axios
      .post(`${this.overkizServer.configuration.COZYTOUCH_ATLANTIC_API}/token`, params, {
        headers: {
          Authorization: `Basic ${this.overkizServer.configuration.COZYTOUCH_CLIENT_ID}`,
        },
      })
      .catch((error) => logger.error(error));
    logger.debug(`access_token: ${response.data.access_token}`);

    response = await axios.get(
      `${this.overkizServer.configuration.COZYTOUCH_ATLANTIC_API}/gacoma/gacomawcfservice/accounts/jwt`,
      {
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
        },
      },
    );
    logger.debug(`JWT: ${response.data}`);
    payload = {
      jwt: response.data,
    };
  } else {
    payload = {
      userId: overkizUsername,
      userPassword: overkizUserpassword,
    };
  }

  const response = await axios.post(`${this.overkizServer.endpoint}/login`, new url.URLSearchParams(payload));

  logger.info(`Overkiz : Server connection OK`);
  const cookie = response.headers['set-cookie'][0];
  this.sessionCookie = cookie.substring(cookie.indexOf('=') + 1, cookie.indexOf(';'));
  this.connected = true;

  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.OVERKIZ.CONNECTED,
    payload: {},
  });

  this.syncOverkizDevices();
  // this.updateDevicesJob = this.cron.schedule('0 */5 * * * *', this.syncOverkizDevices.bind(this));
}

module.exports = {
  connect,
};
