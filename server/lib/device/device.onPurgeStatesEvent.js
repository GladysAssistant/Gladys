const { JOB_TYPES } = require('../../utils/constants');

/**
 * @description It's time to do the daily purge of state events.
 * @example
 * onPurgeStatesEvent()
 */
async function onPurgeStatesEvent() {
  const purgeAllStates = this.job.wrapper(JOB_TYPES.DEVICE_STATES_PURGE, async () => {
    await this.purgeStates();
    await this.purgeAggregateStates();
  });
  await purgeAllStates();
}

module.exports = {
  onPurgeStatesEvent,
};
