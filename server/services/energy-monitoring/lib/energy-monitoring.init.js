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

        // Add to queue
        await this.calculateConsumptionFromIndexThirtyMinutes(now);
        await this.calculateCostEveryThirtyMinutes(now);
      },
    );
  }

  return null;
}

module.exports = {
  init,
};
