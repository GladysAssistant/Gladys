const { CONFIGURATION } = require('../constants');

/**
 * @description Disconnect netatmo.
 * @example
 * netatmo.disconnect();
 */
async function disconnect() {
  const netatmoIsConnect = await this.gladys.variable.getValue(CONFIGURATION.NETATMO_IS_CONNECT, this.serviceId);

  if (netatmoIsConnect === 'connect') {
    this.gladys.variable.setValue(CONFIGURATION.NETATMO_IS_CONNECT, 'disconnect', this.serviceId);
    this.connected = false;
    clearInterval(this.pollHomeCoachWeather);
    clearInterval(this.pollEnergy);
    clearInterval(this.pollSecurity);
  }
}

module.exports = {
  disconnect,
};
