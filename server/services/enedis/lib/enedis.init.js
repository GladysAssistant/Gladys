const randomIntFromInterval = (min, max) => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * @description Init Enedis scheduled sync.
 * @returns {null} Return when scheduled.
 * @example
 * init();
 */
function init() {
  // We sync every hour at HH:50
  // We do it at 50 because at 00 the aggregation is running, so data will be ready for hourly aggregate
  // We take a random seconds to avoid overloading the API if all clients calls at the same seconds
  if (!this.syncEnedisJob) {
    const randomSeconds = randomIntFromInterval(0, 59);
    this.syncEnedisJob = this.gladys.scheduler.scheduleJob(`${randomSeconds} 50 * * * *`, () => this.sync());
  }

  return null;
}

module.exports = {
  init,
};
