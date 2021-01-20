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
  }, this.valueSetInterval.fiveMinute);
  setInterval(async () => {
    await this.getThermostatsData();
    await this.getHomeStatusData();
    await this.updateNetatmo('Energy');
  }, this.valueSetInterval.twoMinute);
  setInterval(async () => {
    await this.getHomeData();
    await this.updateNetatmo('Security');
  }, this.valueSetInterval.oneMinute);
}

module.exports = {
  pollManual,
};
