const logger = require('../../../utils/logger');

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
  // We sync every hour at HH:30-50
  // We take a random minutes/seconds to avoid overloading the API if all clients calls at the same time
  if (!this.syncEnedisJob) {
    const rSecond = randomIntFromInterval(0, 60);
    const rMinute = randomIntFromInterval(30, 50);
    this.syncEnedisJob = this.gladys.scheduler.scheduleJob(`${rSecond} ${rMinute} * * * *`, () => {
      // Unpaid Gladys Plus subscription: the Enedis API would answer "payment
      // required" anyway. Skipping the hourly sync avoids a useless call to the
      // server and a failed job every hour; the sync catches up by itself once
      // the subscription is unlocked (it restarts from the last synced date).
      if (this.gladys.gateway && this.gladys.gateway.subscriptionActive === false) {
        logger.info('Enedis: Gladys Plus subscription is not paid, skipping scheduled sync.');
        return null;
      }
      return this.sync(false);
    });
  }

  return null;
}

module.exports = {
  init,
};
