const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
/**
 * @description Connect.
 * @example
 * netatmo.connect();
 */
async function connect() {
  const netatmoClientId = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_CLIENT_ID, this.serviceId);
  const netatmoCientSecret = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_CLIENT_SECRET, this.serviceId);
  const netatmoUsername = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_USERNAME, this.serviceId);
  const netatmoPassword = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_PASSWORD, this.serviceId);
  const variablesFound = netatmoClientId;
  if (!variablesFound) {
    this.configured = false;
    logger.debug('NETATMO is not configured.');
  } else {
    this.configured = true;
    const auth = {
      client_id: netatmoClientId,
      client_secret: netatmoCientSecret,
      username: netatmoUsername,
      password: netatmoPassword,
      scope:
        'read_station read_thermostat write_thermostat read_camera write_camera access_camera read_presence access_presence read_homecoach',
    };
    this.api = new this.Netatmo(auth);
    this.api.on('error', function ErrorOnApi(error) {
      logger.error(`NETATMO threw an error: ${error}`);
    });
    this.getDevices();
  }
}

module.exports = {
  connect,
};
