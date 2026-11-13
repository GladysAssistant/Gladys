const logger = require('../../../utils/logger');
const { INSTALLATION_STATE } = require('./constants');

// Zigbee2mqtt is back within this delay once its dongle is plugged back
const DONGLE_CHECK_INTERVAL_IN_MS = 10 * 1000;

/**
 * @description Tell whether the dongle check is left to what runs: an installation or an operation (init, disconnect,
 * reset, ezsp fallback) checks the dongle itself, or removes the containers.
 * @param {object} manager - Zigbee2mqtt manager.
 * @returns {boolean} True when something runs.
 * @example
 * if (isBusy(this)) return;
 */
function isBusy(manager) {
  return manager.installation.state === INSTALLATION_STATE.RUNNING || manager.runningOperations > 0;
}

/**
 * @description Check the configured USB dongle once: tell when it is unplugged, start Zigbee2mqtt again once it is
 * plugged back.
 * @param {object} watch - The watch this check belongs to, see watchDongle.
 * @returns {Promise} Resolve once checked.
 * @example
 * await checkDongle.call(this, watch);
 */
async function checkDongle(watch) {
  // Zigbee2mqtt answers: its dongle is there, no need to list the ports
  if (this.zigbee2mqttConnected || isBusy(this)) {
    return;
  }
  const dongle = await this.findDongle(watch.driverPath);
  // Stopped meanwhile (disconnect, reset, a new init), or an operation started: its outcome is not undone
  if (this.dongleWatch !== watch || isBusy(this)) {
    return;
  }
  if (!dongle) {
    // Told once, the status changes only then
    if (!this.dongleMissing) {
      logger.warn(`Zigbee2mqtt USB dongle unplugged from ${watch.driverPath}, waiting for it to be plugged back`);
      this.dongleMissing = true;
      this.usbConfigured = false;
      this.emitStatusEvent();
    }
    return;
  }
  if (this.dongleMissing) {
    logger.info(`Zigbee2mqtt USB dongle plugged back on ${watch.driverPath}, starting Zigbee2mqtt again`);
    // Creates or starts the containers, and connects Gladys, as on the start of Gladys; watches the dongle again
    await this.init();
  }
}

/**
 * @description Stop watching the configured USB dongle. A check in progress ends without any effect.
 * @example
 * this.stopWatchingDongle();
 */
function stopWatchingDongle() {
  clearTimeout(this.dongleWatchTimer);
  this.dongleWatchTimer = null;
  this.dongleWatch = null;
}

/**
 * @description Watch the configured USB dongle while Zigbee2mqtt does not answer, every 10 seconds: Zigbee2mqtt stops
 * when its dongle is unplugged, and Docker fails to start it again without the device, even once plugged back.
 * @param {string} driverPath - Stored path of the dongle.
 * @example
 * this.watchDongle('/dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_1-if00-port0');
 */
function watchDongle(driverPath) {
  this.stopWatchingDongle();
  const watch = { driverPath };
  this.dongleWatch = watch;
  const scheduleCheck = () => {
    this.dongleWatchTimer = setTimeout(async () => {
      this.dongleWatchTimer = null;
      try {
        await checkDongle.call(this, watch);
      } catch (e) {
        logger.warn('Zigbee2mqtt: failed to check the USB dongle:', e);
      }
      // Not after a stop, nor after the init started above, which watches again
      if (this.dongleWatch === watch) {
        scheduleCheck();
      }
    }, DONGLE_CHECK_INTERVAL_IN_MS);
  };
  scheduleCheck();
}

module.exports = {
  watchDongle,
  stopWatchingDongle,
};
