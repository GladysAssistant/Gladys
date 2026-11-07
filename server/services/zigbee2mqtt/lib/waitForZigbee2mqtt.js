const { INSTALLATION_PHASE, INSTALLATION_PHASE_STATE, INSTALLATION_ERROR, MQTT_MODE } = require('./constants');

// Often enough for the setup page to tell at once that Zigbee2mqtt answers
const CHECK_INTERVAL_IN_MS = 500;

/**
 * @description Build the error of a Zigbee2mqtt that failed to start, carrying what the setup page shows.
 * @param {object} installationError - Code and message of the failure, like z2mContainerError.
 * @returns {Error} The error, with the code and message in its installationError property.
 * @example
 * throw buildStartupError({ code: 'NO_ANSWER', message: null });
 */
function buildStartupError(installationError) {
  const { code, message } = installationError;
  const error = new Error(`Zigbee2mqtt failed to start: ${code || message}`);
  error.installationError = { code, message };
  return error;
}

/**
 * @description Wait for Zigbee2mqtt to answer once installed: the last phase of an installation, as Zigbee2mqtt
 * answers only once connected to its coordinator.
 * @returns {Promise} Resolve once Zigbee2mqtt answers. Reject at once when nothing was started, as soon as the logs
 * of its container tell why it does not start or Gladys fails to connect to the broker, or once its startup window
 * is over without an answer.
 * @example
 * await this.waitForZigbee2mqtt();
 */
async function waitForZigbee2mqtt() {
  this.updateInstallationPhase(INSTALLATION_PHASE.CONNECT_ADAPTER, { state: INSTALLATION_PHASE_STATE.RUNNING });
  // Neither a coordinator found nor an external broker: init started nothing, nothing would ever answer. The stored
  // mode tells the external broker, not the MQTT client: the one of a previous run stays connected, to a Zigbee2mqtt
  // that may even answer
  if (!this.usbConfigured && !this.networkAdapterConfigured) {
    const { mqttMode } = await this.getConfiguration();
    if (mqttMode !== MQTT_MODE.EXTERNAL) {
      throw buildStartupError({ code: INSTALLATION_ERROR.DONGLE_NOT_FOUND, message: null });
    }
  }
  const startedAt = Date.now();
  await new Promise((resolve, reject) => {
    const check = () => {
      if (this.zigbee2mqttConnected) {
        resolve();
        return;
      }
      if (this.z2mContainerError) {
        reject(buildStartupError(this.z2mContainerError));
        return;
      }
      // Gladys cannot reach the broker, or is refused by it (set only for authentication failures on the broker
      // of Gladys, see connect): the answer of Zigbee2mqtt would never reach Gladys
      if (this.mqttConnectionError) {
        reject(buildStartupError(this.mqttConnectionError));
        return;
      }
      // Not only the delay: the ezsp fallback restarts Zigbee2mqtt and opens a new startup window, the wait goes on
      if (Date.now() - startedAt >= this.zigbee2mqttStartingTimeoutInMs && !this.zigbee2mqttStarting) {
        reject(buildStartupError({ code: INSTALLATION_ERROR.NO_ANSWER, message: null }));
        return;
      }
      setTimeout(check, CHECK_INTERVAL_IN_MS);
    };
    check();
  });
  this.updateInstallationPhase(INSTALLATION_PHASE.CONNECT_ADAPTER, { state: INSTALLATION_PHASE_STATE.DONE });
}

module.exports = {
  waitForZigbee2mqtt,
};
