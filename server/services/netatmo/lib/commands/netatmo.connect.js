const axios = require('axios');
const querystring = require('querystring');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
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
  const netatmoIsConnect = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_IS_CONNECT, this.serviceId);
  if (!netatmoIsConnect) {
    this.gladys.variable.setValue(CONFIGURATION.NETATMO_IS_CONNECT, '', this.serviceId);
  }
  const variablesFound = netatmoClientId;
  // if no variable message
  if (!variablesFound) {
    this.configured = false;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR,
      payload: 'Service is not configured',
    });
    throw new ServiceNotConfiguredError('NETATMO: Error, service is not configured');
  } else if (netatmoIsConnect === 'connect') {
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
    let response;
    try {
      response = await axios({
        url: `${this.baseUrl}/oauth2/token`,
        method: 'post',
        data: querystring.stringify(authentificationForm),
      });
    } catch (error) {
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR,
        payload: 'Service is not configured',
      });
      throw new ServiceNotConfiguredError(`NETATMO: Service is not connected with error ${error.response.status}`);
    }
    this.connected = true;
    this.token = response.data.access_token;
    setInterval(() => {
      axios({
        url: `${this.baseUrl}/oauth2/token`,
        method: 'post',
        data: querystring.stringify(authentificationForm),
      }).then((token) => {
        this.token = token.data.access_token;
      });
    }, response.data.expires_in * 1000);

    await this.getDevices();
    await this.pollManual();

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.CONNECTED,
    });
  }
}

module.exports = {
  connect,
};
