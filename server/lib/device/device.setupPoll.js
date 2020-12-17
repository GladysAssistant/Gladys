const { DEVICE_POLL_FREQUENCIES, DEVICE_POLL_FREQUENCIES_SPECIF } = require('../../utils/constants');

/**
 * @description Setup poll setInterval
 * @example
 * setupPoll();
 */
function setupPoll() {
  // poll devices who need to be polled every minutes
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_HOURS), DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_HOURS);
  // poll devices who need to be polled every minutes
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_30_MINUTES), 
    DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_30_MINUTES
  );
  // poll devices who need to be polled every minutes
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_10_MINUTES), 
    DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_10_MINUTES
  );
  // poll devices who need to be polled every minutes
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_5_MINUTES), 
    DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_5_MINUTES);
  // poll devices who need to be polled every minutes
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_2_MINUTES), 
    DEVICE_POLL_FREQUENCIES_SPECIF.EVERY_2_MINUTES
  );
  // poll devices who need to be polled every minutes
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES.EVERY_MINUTES), DEVICE_POLL_FREQUENCIES.EVERY_MINUTES);
  // poll devices who need to be polled every 30 seconds
  setInterval(this.pollAll(DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS), DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS);
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
