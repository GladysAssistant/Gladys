/**
 * @description Init energy monitoring scheduled sync.
 * @returns {null} Return when scheduled.
 * @example
 * init();
 */
function init() {
  if (!this.calculateEnergyMonitoringEvery30MinutesJob) {
    // Scheduling energy monitoring every 30 minutes
    this.calculateEnergyMonitoringEvery30MinutesJob = this.gladys.scheduler.scheduleJob(`0 */30 * * * *`, () =>
      this.calculateCostEveryThirtyMinutes(),
    );
  }

  return null;
}

module.exports = {
  init,
};
