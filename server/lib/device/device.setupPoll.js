const { DEVICE_POLL_FREQUENCIES } = require('../../utils/constants');

/**
 * @description Setup poll setInterval.
 * @example
 * setupPoll();
 */
function setupPoll() {
  // poll devices who need to be polled every minutes
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES.EVERY_MINUTES), DEVICE_POLL_FREQUENCIES.EVERY_MINUTES);
  // poll devices who need to be polled every 30 seconds
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS), DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS);
  // poll devices who need to be polled every 15 seconds
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES.EVERY_15_SECONDS), DEVICE_POLL_FREQUENCIES.EVERY_15_SECONDS);
  // poll devices who need to be polled every 10 seconds
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS), DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS);
  // poll devices who need to be polled every 2 seconds
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES.EVERY_2_SECONDS), DEVICE_POLL_FREQUENCIES.EVERY_2_SECONDS);
  // poll devices who need to be polled every 1 seconds
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES.EVERY_SECONDS), DEVICE_POLL_FREQUENCIES.EVERY_SECONDS);
}

module.exports = {
  setupPoll,
};
