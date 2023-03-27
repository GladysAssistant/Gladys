/**
 * @description Init Enedis scheduled sync.
 * @returns {null} Return when scheduled.
 * @example
 * init();
 */
function init() {
  // We sync a first time at 8:50AM to check if new daily data are ready.
  // We do it at 50 because at 00 the aggregation is running, so data will be ready for hourly aggregate
  if (!this.syncEnedisFirstJob) {
    this.syncEnedisFirstJob = this.gladys.scheduler.scheduleJob('0 50 8 * * *', () => this.sync());
  }

  // We sync a second time at 10:50, in case the data were only available later in the morning.
  if (!this.syncEnedisSecondJob) {
    this.syncEnedisSecondJob = this.gladys.scheduler.scheduleJob('0 50 10 * * *', () => this.sync());
  }

  return null;
}

module.exports = {
  init,
};
