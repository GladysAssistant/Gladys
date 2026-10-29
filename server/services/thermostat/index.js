const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const ThermostatHandler = require('./lib');
const ThermostatController = require('./api/thermostat.controller');

module.exports = function ThermostatService(gladys, serviceId) {
  const thermostatHandler = new ThermostatHandler(gladys, serviceId);
  let scheduleInterval = null;
  let newStateListener = null;
  // Which start() is the current one. A stop(), or another start(), while a start() waits
  // on the references made that one stale: resuming, it still attached the listener and
  // ran a regulation pass on a stopped service.
  let startGeneration = 0;

  /**
   * @description Clear the interval, the event listener and the debounce timer.
   * Shared by stop() and by start(), which must be idempotent.
   * @returns {undefined}
   * @example
   * clearHandles();
   */
  function clearHandles() {
    // Whatever was in flight belongs to the run that ends here (see `lifecycle`).
    thermostatHandler.lifecycle += 1;
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
    thermostatHandler.windowTimers.forEach(({ timer }) => clearTimeout(timer));
    thermostatHandler.windowTimers.clear();
    // A window may close and open again while the service is stopped: an opening
    // kept from before would cut the heating early on the first pass after a start.
    // Forgotten, it is read again from the sensor's own `last_value_changed`.
    thermostatHandler.windowOpenedAt.clear();
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
    startGeneration += 1;
    const generation = startGeneration;
    thermostatHandler.running = true;
    // Apply schedules every minute
    scheduleInterval = setInterval(async () => {
      await thermostatHandler.applySchedules();
    }, 60 * 1000);
    // The reference for "a setpoint changed on the device" comes from what the
    // database already knows, and has to be in place before the listener can
    // receive anything: a setpoint turned on the thermostat seconds after a
    // restart would otherwise be read as the report that merely establishes the
    // reference, and the next regulation pass would overwrite it.
    await thermostatHandler.primeObservedSetpoints();
    if (generation !== startGeneration) {
      return;
    }
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
    startGeneration += 1;
    thermostatHandler.running = false;
    clearHandles();
  }

  return Object.freeze({
    start,
    stop,
    device: thermostatHandler,
    controllers: ThermostatController(thermostatHandler),
  });
};
