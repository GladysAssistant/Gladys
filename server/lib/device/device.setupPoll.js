const { DEVICE_POLL_FREQUENCIES_LIST } = require('../../utils/constants');

/**
 * @description Setup poll setInterval.
 * @example
 * setupPoll();
 */
function setupPoll() {
  DEVICE_POLL_FREQUENCIES_LIST.forEach((pollFrequency) => {
    setInterval(this.pollAll(pollFrequency), pollFrequency);
  });
}

module.exports = {
  setupPoll,
};
