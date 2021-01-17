/**
 * @description Poll value of a Netatmo devices
 * @example
 * pollManual();
 */
async function pollManual() {
 
  await setInterval(async () => {
    await this.getHealthyHomeCoachData();
    await this.getStationsData();
    await this.updateNetatmo('HomeCoach_Weather');
  }, 5 * 60 * 1000);
  await setInterval(async () => {
    await this.getThermostatsData();
    await this.getHomeStatusData();
    await this.updateNetatmo('Energy');
  }, 2 * 60 * 1000);
  await setInterval(async () => {
    await this.getHomeData();
    await this.updateNetatmo('Security');
  }, 60 * 1000);
}

module.exports = {
  pollManual,
};