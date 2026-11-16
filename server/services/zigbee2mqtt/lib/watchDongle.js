const logger = require('../../../utils/logger');
const { findContainerByName, isManagedByGladys } = require('../../../utils/dockerContainers');
const { BY_ID_DIR } = require('../utils/donglePorts');
const { INSTALLATION_STATE } = require('./constants');

const z2mContainerDescriptor = require('../docker/gladys-z2m-zigbee2mqtt-container.json');

// Zigbee2mqtt is back within this delay once its dongle is plugged back
const DONGLE_CHECK_INTERVAL_IN_MS = 10 * 1000;

// Wait before each start of Zigbee2mqtt by the watch, from the previous one: none for the first, then longer and
// longer, then no more start until the dongle is found missing, Zigbee2mqtt answers or the integration is disabled
const RESTART_DELAYS_IN_MS = [0, 30 * 1000, 60 * 1000, 2 * 60 * 1000, 5 * 60 * 1000];

// States of a container that ran, or tried to: Docker starts it again by itself (restart policy "always") unless it
// was stopped by hand, or its start failed (the device of its dongle missing)
const STOPPED_CONTAINER_STATES = ['exited', 'dead'];

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
 * @description Forget the starts of Zigbee2mqtt made by the watch: the next one waits for nothing.
 * @example
 * this.resetDongleRestarts();
 */
function resetDongleRestarts() {
  this.dongleRestarts = { count: 0, lastAt: null };
}

/**
 * @description Tell whether the configured USB dongle is found: the status is sent only when it changes.
 * @param {object} manager - Zigbee2mqtt manager.
 * @param {boolean} missing - True when it is not found.
 * @example
 * setDongleMissing(this, true);
 */
function setDongleMissing(manager, missing) {
  if (manager.dongleMissing === missing) {
    return;
  }
  manager.dongleMissing = missing;
  manager.usbConfigured = !missing;
  manager.emitStatusEvent();
}

/**
 * @description Start Zigbee2mqtt again, when its last start by the watch is far enough: init creates or starts the
 * containers and connects Gladys, as on the start of Gladys, then watches the dongle again.
 * @param {object} watch - The watch of this check, see watchDongle.
 * @returns {Promise} Resolve once started, or failed.
 * @example
 * await restartZigbee2mqtt.call(this, watch);
 */
async function restartZigbee2mqtt(watch) {
  const { count, lastAt } = this.dongleRestarts;
  if (count >= RESTART_DELAYS_IN_MS.length || (lastAt !== null && Date.now() - lastAt < RESTART_DELAYS_IN_MS[count])) {
    return;
  }
  this.dongleRestarts = { count: count + 1, lastAt: Date.now() };
  logger.info(`Zigbee2mqtt USB dongle plugged in on ${watch.driverPath}, starting Zigbee2mqtt again`);
  try {
    await this.init();
  } catch (e) {
    logger.warn('Zigbee2mqtt: failed to start again once its USB dongle is plugged in:', e);
    // init stops the watch on its first lines, and watches again only once it checked the dongle
    if (this.dongleWatch === null) {
      this.watchDongle(watch.driverPath, watch.pnpId);
    }
  }
  if (this.dongleRestarts.count === RESTART_DELAYS_IN_MS.length) {
    logger.error(
      `Zigbee2mqtt: started ${RESTART_DELAYS_IN_MS.length} times since its USB dongle is plugged in, given up`,
    );
  }
}

/**
 * @description Tell whether the device found at the stored path is the dongle that init found there: a dongle stored
 * by its port leaves that port to another USB-serial adapter once unplugged. Its link names the dongle itself.
 * @param {object} port - The serial port found, see findDongle.
 * @param {object} watch - The watch, see watchDongle.
 * @returns {boolean} True when it is the same dongle, or when init did not find any to compare with.
 * @example
 * if (isWatchedDongle(dongle.port, watch)) { ... }
 */
function isWatchedDongle(port, watch) {
  return watch.driverPath.startsWith(BY_ID_DIR) || watch.pnpId === undefined || port.pnpId === watch.pnpId;
}

/**
 * @description Tell whether Zigbee2mqtt is to be started: its container is missing, never started, or Docker failed
 * to start it again (its dongle was missing). A container stopped by hand stays stopped (the dongle flashed from the
 * host), as Docker does, and a container of the user carrying our name is left to init, which tells about it.
 * @param {object} system - Gladys system module.
 * @returns {Promise<boolean>} True when Zigbee2mqtt is to be started.
 * @example
 * if (await isStartNeeded(this.gladys.system)) { ... }
 */
async function isStartNeeded(system) {
  const container = await findContainerByName(system, z2mContainerDescriptor.name);
  if (container === null) {
    return true;
  }
  if (!(await isManagedByGladys(system, container, z2mContainerDescriptor))) {
    return false;
  }
  if (container.state === 'created') {
    return true;
  }
  if (!STOPPED_CONTAINER_STATES.includes(container.state)) {
    return false;
  }
  // Cleared by each successful start: only a failed start leaves it
  const { State } = await system.inspectContainer(container.id);
  return Boolean(State.Error);
}

/**
 * @description Check the configured USB dongle once: tell when it is not found, start Zigbee2mqtt again when Docker
 * failed to start its container while its dongle is plugged in.
 * @param {object} watch - The watch this check belongs to, see watchDongle.
 * @returns {Promise} Resolve once checked.
 * @example
 * await checkDongle.call(this, watch);
 */
async function checkDongle(watch) {
  // Zigbee2mqtt answers: its dongle is there, no need to list the ports
  if (this.zigbee2mqttConnected) {
    this.resetDongleRestarts();
    setDongleMissing(this, false);
    return;
  }
  if (isBusy(this)) {
    return;
  }
  const found = await this.findDongle(watch.driverPath);
  // Stopped meanwhile (disconnect, reset, a new init), or an operation started: its outcome is not undone
  if (this.dongleWatch !== watch || isBusy(this)) {
    return;
  }
  const dongle = found && isWatchedDongle(found.port, watch) ? found : null;
  if (!dongle) {
    if (!this.dongleMissing) {
      logger.warn(`Zigbee2mqtt USB dongle not found on ${watch.driverPath}, waiting for it to be plugged in`);
    }
    setDongleMissing(this, true);
    // Plugged back, Zigbee2mqtt starts at once
    this.resetDongleRestarts();
    return;
  }
  setDongleMissing(this, false);
  // Unplugged and plugged back between two checks, the dongle may never be seen missing: the state of the container
  // tells
  const startNeeded = await isStartNeeded(this.gladys.system);
  if (this.dongleWatch !== watch || isBusy(this)) {
    return;
  }
  if (startNeeded) {
    await restartZigbee2mqtt.call(this, watch);
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
 * @param {string} [pnpId] - USB device name of the dongle found by init on this path, undefined when not found.
 * @example
 * this.watchDongle('/dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_1-if00-port0');
 */
function watchDongle(driverPath, pnpId) {
  this.stopWatchingDongle();
  const watch = { driverPath, pnpId };
  this.dongleWatch = watch;
  const scheduleCheck = () => {
    this.dongleWatchTimer = setTimeout(async () => {
      this.dongleWatchTimer = null;
      try {
        await checkDongle.call(this, watch);
      } catch (e) {
        logger.warn('Zigbee2mqtt: failed to check the USB dongle:', e);
      }
      // Not after a stop, nor after an init started above, which watches again
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
  resetDongleRestarts,
};
