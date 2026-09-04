const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const ThermostatHandler = require('./lib');
const ThermostatController = require('./api/thermostat.controller');

module.exports = function ThermostatService(gladys, serviceId) {
  const thermostatHandler = new ThermostatHandler(gladys, serviceId);
  let scheduleInterval = null;
  let newStateListener = null;

  /**
   * @description Clear the interval, the event listener and the debounce timer.
   * Shared by stop() and by start(), which must be idempotent.
   * @returns {undefined}
   * @example
   * clearHandles();
   */
  function clearHandles() {
    if (scheduleInterval) {
      clearInterval(scheduleInterval);
      scheduleInterval = null;
    }
    if (newStateListener) {
      gladys.event.removeListener(EVENTS.DEVICE.NEW_STATE, newStateListener);
      newStateListener = null;
    }
    if (thermostatHandler.applyTimer) {
      clearTimeout(thermostatHandler.applyTimer);
      thermostatHandler.applyTimer = null;
    }
  }

  /**
   * @public
   * @description This function starts the Thermostat service.
   * @example
   * gladys.services.thermostat.start();
   */
  async function start() {
    logger.info('Starting thermostat service');
    // Idempotent: a second start() without a stop() would otherwise leave the
    // previous interval and listener running, and the house would get two
    // regulation loops actuating the same heaters.
    clearHandles();
    // Apply schedules every minute
    scheduleInterval = setInterval(async () => {
      await thermostatHandler.applySchedules();
    }, 60 * 1000);
    // React immediately when a device feature changes (e.g. window opens)
    newStateListener = (event) => thermostatHandler.onDeviceNewState(event);
    gladys.event.on(EVENTS.DEVICE.NEW_STATE, newStateListener);
    // Run once immediately on start (non-blocking — errors must not prevent Gladys startup)
    (async () => {
      try {
        await thermostatHandler.applySchedules();
      } catch (e) {
        logger.warn(`Thermostat applySchedules startup error: ${e.message}`);
      }
    })();
  }

  /**
   * @public
   * @description This function stops the Thermostat service.
   * @example
   * gladys.services.thermostat.stop();
   */
  async function stop() {
    logger.info('Stopping thermostat service');
    clearHandles();
  }

  return Object.freeze({
    start,
    stop,
    device: thermostatHandler,
    controllers: ThermostatController(thermostatHandler),
  });
};
