const fs = require('fs/promises');
const path = require('path');

const logger = require('../../../utils/logger');
const { CONFIGURATION, INSTALLATION_STATE, getIdlePrefetch } = require('./constants');

const ALL_CONFIGURATION_KEYS = [
  CONFIGURATION.Z2M_DRIVER_PATH,
  CONFIGURATION.Z2M_BACKUP,
  CONFIGURATION.ZIGBEE_DONGLE_NAME,
  CONFIGURATION.Z2M_MQTT_MODE,
  CONFIGURATION.Z2M_TCP_PORT,
  CONFIGURATION.Z2M_ADAPTER_MODE,
  CONFIGURATION.Z2M_NETWORK_ADAPTER_URL,
  CONFIGURATION.Z2M_NETWORK_ADAPTER_TYPE,
  CONFIGURATION.MQTT_URL_KEY,
  CONFIGURATION.Z2M_MQTT_USERNAME_KEY,
  CONFIGURATION.Z2M_MQTT_PASSWORD_KEY,
  CONFIGURATION.GLADYS_MQTT_USERNAME_KEY,
  CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY,
  CONFIGURATION.DOCKER_MQTT_VERSION,
  CONFIGURATION.DOCKER_Z2M_VERSION,
];

/**
 * @description Reset Zigbee2mqtt integration to factory defaults.
 * @example
 * await this.reset();
 */
async function reset() {
  logger.info('Zigbee2mqtt: resetting integration...');

  // 1. Disconnect (stop containers + disconnect MQTT)
  await this.disconnect();

  // 2. Destroy all configuration variables in database
  await Promise.all(ALL_CONFIGURATION_KEYS.map((key) => this.gladys.variable.destroy(key, this.serviceId)));

  // 3. Delete zigbee2mqtt folder on disk
  const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();
  const zigbee2mqttFolderPath = path.join(basePathOnContainer, 'zigbee2mqtt');
  await fs.rm(zigbee2mqttFolderPath, { recursive: true, force: true });
  logger.info('Zigbee2mqtt: folder deleted successfully');

  // 4. Reset in-memory state
  this.discoveredDevices = {};
  this.lastBridgeDevices = null;
  this.topicBinds = {};
  this.usbConfigured = false;
  this.networkAdapterConfigured = false;
  this.mqttExist = false;
  this.mqttRunning = false;
  this.mqttContainerRunning = false;
  this.zigbee2mqttExist = false;
  this.zigbee2mqttRunning = false;
  this.gladysConnected = false;
  this.zigbee2mqttConnected = false;
  clearTimeout(this.healthCheckTimer);
  this.healthCheckTimer = null;
  clearTimeout(this.startingTimer);
  this.startingTimer = null;
  this.zigbee2mqttStarting = false;
  this.z2mPermitJoin = false;
  this.coordinatorFirmware = null;
  this.z2mContainerError = null;
  this.mqttConnectionError = null;
  // Done by disconnect already, unless an installation finished since
  this.clearInstallation();
  // A running prefetch goes on, and tells its own outcome
  const { state: prefetchState } = this.prefetch;
  if (prefetchState === INSTALLATION_STATE.DONE || prefetchState === INSTALLATION_STATE.FAILED) {
    this.prefetch = getIdlePrefetch();
    this.emitInstallProgress();
  }

  // 5. Emit status event
  this.emitStatusEvent();
  // A send left waiting goes at once: its timer would outlive the reset
  if (this.installProgressTimer !== null) {
    this.emitInstallProgress(true);
  }

  logger.info('Zigbee2mqtt: integration reset complete');
}

module.exports = {
  reset,
};
