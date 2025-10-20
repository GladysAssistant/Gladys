/**
 * @description Init energy monitoring scheduled sync.
 * @returns {null} Return when scheduled.
 * @example
 * init();
 */
function init() {
  if (!this.calculateConsumptionAndCostEvery30MinutesJob) {
    // Scheduling consumption and cost calculation every 30 minutes
    this.calculateConsumptionAndCostEvery30MinutesJob = this.gladys.scheduler.scheduleJob(
      `0 0,30 * * * *`,
      async () => {
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

        await this.calculateConsumptionFromIndexWithJobWrapper(thirtyMinuteWindow);
        await this.calculateCostEveryThirtyMinutes();
      },
    );
  }

  return null;
}

module.exports = {
  init,
};
