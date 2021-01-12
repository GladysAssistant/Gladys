const axios = require('axios');
const querystring = require('querystring');
const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
/**
 * @description Connect.
 * @example
 * netatmo.connect();
 */
async function connect() {
  // get value save by gladys front to connect to Netatmo
  const netatmoClientId = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_CLIENT_ID, this.serviceId);
  const netatmoCientSecret = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_CLIENT_SECRET, this.serviceId);
  const netatmoUsername = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_USERNAME, this.serviceId);
  const netatmoPassword = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_PASSWORD, this.serviceId);
  const variablesFound = netatmoClientId;

  // if no variable message
  if (!variablesFound) {
    this.configured = false;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR,
    });
    logger.debug('NETATMO is not configured.');
  } else {
    // else is configured send websocket ok
    this.configured = true;

    // connect to netatmo API with specific (scope) rights
    const authentificationForm = {
      grant_type: 'password',
      client_id: netatmoClientId,
      client_secret: netatmoCientSecret,
      username: netatmoUsername,
      password: netatmoPassword,
      scope:
        'read_station read_thermostat write_thermostat read_camera write_camera access_camera read_presence access_presence read_homecoach read_smokedetector',
    };
    // connect to netatmo api
    try {
      const response = await axios({
        url: `${this.baseUrl}/oauth2/token`,
        method: 'post',
        data: querystring.stringify(authentificationForm),
      });
      this.token = response.data.access_token;
      setInterval(
        () => {
          const form = {
            grant_type: 'refresh_token',
            refresh_token: response.data.refresh_token,
            client_id: netatmoClientId,
            client_secret: netatmoPassword,
          };
          axios({
            url: `${this.baseUrl}/oauth2/token`,
            method: 'post',
            data: querystring.stringify(form),
          }).then((token) => {
            this.token = token.data.access_token;
          });
        },
        response.data.expires_in * 1000,
        response.data.refresh_token,
      );
    } catch (e) {
      logger.info(e.response.data);
    }

    this.getDevices();
    this.pollManual();

    setInterval(() => {
      this.pollManual();
    }, 60 * 1000);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.CONNECTED,
    });
  }
}

module.exports = {
  connect,
};
