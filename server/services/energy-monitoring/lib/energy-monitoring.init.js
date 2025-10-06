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

  if (!this.calculateConsumptionFromIndexEvery30MinutesJob) {
    // Scheduling consumption calculation from index every 30 minutes at exact 00:00 or 00:30
    this.calculateConsumptionFromIndexEvery30MinutesJob = this.gladys.scheduler.scheduleJob(`0 0,30 * * * *`, () => {
      // Calculate the exact 30-minute window time (current time rounded to 00:00 or 00:30)
      const now = new Date();
      const minutes = now.getMinutes();
      const thirtyMinuteWindow = new Date(now);
      
      // Round to the nearest 30-minute mark (00:00 or 00:30)
      if (minutes < 30) {
        thirtyMinuteWindow.setMinutes(0, 0, 0);
      } else {
        thirtyMinuteWindow.setMinutes(30, 0, 0);
      }
      
      this.calculateConsumptionFromIndex(null, thirtyMinuteWindow);
    });
  }

  return null;
}

module.exports = {
  init,
};
