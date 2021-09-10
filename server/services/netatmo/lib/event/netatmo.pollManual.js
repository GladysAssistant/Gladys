const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

/**
 * @description Poll value of a Netatmo devices
 * @example
 * pollManual();
 */
async function pollManual() {
  this.pollHomeCoachWeather = setInterval(async () => {
    await this.getHealthyHomeCoachData();
    await this.getStationsData();
    await this.updateNetatmo('HomeCoach_Weather');
  }, DEVICE_POLL_FREQUENCIES.EVERY_5_MINUTES);
  this.pollEnergy = setInterval(async () => {
    await this.getHomeStatusData();
    await this.updateNetatmo('Energy');
  }, DEVICE_POLL_FREQUENCIES.EVERY_2_MINUTES);
  this.pollSecurity = setInterval(async () => {
    await this.getHomeData();
    await this.updateNetatmo('Security');
  }, DEVICE_POLL_FREQUENCIES.EVERY_MINUTES);
}

module.exports = {
  pollManual,
};
