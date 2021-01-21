/**
 * @description Poll value of a Netatmo devices
 * @example
 * pollManual();
 */
async function pollManual() {
  setInterval(async () => {
    await this.getHealthyHomeCoachData();
    await this.getStationsData();
    await this.updateNetatmo('HomeCoach_Weather');
  }, this.pollFrequencies.EVERY_5_MINUTES);
  setInterval(async () => {
    await this.getThermostatsData();
    await this.getHomeStatusData();
    await this.updateNetatmo('Energy');
  }, this.pollFrequencies.EVERY_2_MINUTES);
  setInterval(async () => {
    await this.getHomeData();
    await this.updateNetatmo('Security');
  }, this.pollFrequencies.EVERY_2_MINUTES);
}

module.exports = {
  pollManual,
};
