/**
 * @description Init Enedis scheduled sync.
 * @returns {null} Return when scheduled.
 * @example
 * init();
 */
function init() {
  // We sync a first time at 9AM to check if new daily data are ready.
  if (!this.syncEnedisFirstJob) {
    this.syncEnedisFirstJob = this.gladys.scheduler.scheduleJob('0 0 9 * * *', () => this.sync());
  }
  // We sync a second time at 11AM, in case the data were only available later in the morning.
  if (!this.syncEnedisSecondJob) {
    this.syncEnedisSecondJob = this.gladys.scheduler.scheduleJob('0 0 11 * * *', () => this.sync());
  }

  return null;
}

module.exports = {
  init,
};
