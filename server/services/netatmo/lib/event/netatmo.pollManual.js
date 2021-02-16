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
  }, this.pollFrequencies.EVERY_5_MINUTES);
  this.pollEnergy = setInterval(async () => {
    await this.getHomeStatusData();
    await this.updateNetatmo('Energy');
  }, this.pollFrequencies.EVERY_2_MINUTES);
  this.pollSecurity = setInterval(async () => {
    await this.getHomeData();
    await this.updateNetatmo('Security');
  }, this.pollFrequencies.EVERY_MINUTES);
}

module.exports = {
  pollManual,
};
