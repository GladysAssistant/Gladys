const nodeMachineId = require('node-machine-id');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { CONFIGURATION } = require('../utils/ecovacs.constants');
const logger = require('../../../../utils/logger');

/**
 * @description Connect to ecoVacs cloud account and get access token and api key.
 * @example
 * connect();
 */
async function connect() {
  logger.debug(`Ecovacs: connect`);

  if (!this.connected) {
    const { EcoVacsAPI } = this.ecovacsLibrary;

    // The accountId is your Ecovacs ID or email address.
    const { login, password, countryCode } = await this.getConfiguration();
    const accountId = login;
    const deviceID = 0; // The first vacuum from your account
    // Leave blank or use 'ecovacs.com' for Ecovacs login
    // or use 'yeedi.com' for yeedi login (available since version 0.8.3-alpha.2)
    const authDomain = '';

    if (!accountId || !password || !countryCode) {
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ECOVACS.ERROR,
        payload: 'Service is not configured',
      });
      this.configured = false;
      throw new ServiceNotConfiguredError('Ecovacs: Error, service is not configured');
    }
    logger.debug(
      `Ecovacs: connect with config ${CONFIGURATION.ECOVACS_LOGIN_KEY}=${accountId},${CONFIGURATION.ECOVACS_PASSWORD_KEY}=${password}, ${CONFIGURATION.ECOVACS_COUNTRY_KEY}=${countryCode}`,
    );

    // You need to provide a device ID uniquely identifying the
    // machine you're using to connect, the country you're in.
    // The module exports a countries object which contains a mapping
    // between country codes and continent codes.
    const continent = this.ecovacsLibrary.countries[countryCode.toUpperCase()].continent.toLowerCase();
    const deviceId = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync(), deviceID);

    logger.debug(`Ecovacs client params : ${deviceId}, ${countryCode}, ${continent}, ${authDomain}`);
    this.ecovacsClient = new EcoVacsAPI(deviceId, countryCode, continent, authDomain);
    try {
      await this.ecovacsClient.connect(accountId, password);
      logger.debug(`Ecovacs: successful connected`);
      this.connected = true;
      this.configured = true;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ECOVACS.CONNECTED,
      });
    } catch (e) {
      this.connected = false;
      logger.error(`Failure in connecting: ${e.message}`);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ECOVACS.ERROR,
        payload: `Ecovacs: Authentication error`,
      });
    }
  }
}

module.exports = {
  connect,
};
