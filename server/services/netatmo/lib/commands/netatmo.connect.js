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
    logger.debug('NETATMO is not configured.');
  } else {
    // else is configured send websocket ok
    this.configured = true;

    // connect to netatmo API with specific (scope) rights
    const auth = {
      client_id: netatmoClientId,
      client_secret: netatmoCientSecret,
      username: netatmoUsername,
      password: netatmoPassword,
      scope:
        'read_station read_thermostat write_thermostat read_camera write_camera access_camera read_presence access_presence read_homecoach read_smokedetector',
    };
    this.api = new this.Netatmo(auth);

    // socket listening on error event
    await this.errorHandler()

    this.getDevices();
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.CONNECTED,
    });
  }
}

module.exports = {
  connect,
};
