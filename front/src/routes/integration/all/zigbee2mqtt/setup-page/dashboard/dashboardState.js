import get from 'get-value';

import { MQTT_MODE, ADAPTER_MODE } from '../constants';

// What the status card of the dashboard tells, from the status of the server (docs/specs/zigbee2mqtt-installation.md, N)
export const DASHBOARD_STATE = {
  INSTALLING: 'installing',
  STOPPED: 'stopped',
  STOPPING: 'stopping',
  DONGLE_MISSING: 'dongleMissing',
  FAILED: 'failed',
  MQTT_ERROR: 'mqttError',
  ONLINE: 'online',
  STARTING: 'starting',
  NOT_ANSWERING: 'notAnswering'
};

export const isExternal = configuration => configuration.mqttMode === MQTT_MODE.EXTERNAL;

export const isNetworkCoordinator = configuration => configuration.z2mAdapterMode === ADAPTER_MODE.NETWORK;

const hasError = error => Boolean(error && (error.code || error.message));

/**
 * @description The error that explains why Zigbee2mqtt does not run: the failure of the last installation, else the
 * startup error read in its logs. None once it answers.
 * @param {object} status - Status of the server.
 * @returns {object|null} `{ code, message }`, or null.
 */
export const getStartupError = status => {
  if (status.zigbee2mqttConnected) {
    return null;
  }
  if (get(status, 'installation.state') === 'failed' && hasError(status.installation.error)) {
    return status.installation.error;
  }
  return hasError(status.z2mContainerError) ? status.z2mContainerError : null;
};

/**
 * @description The state the status card shows, the most urgent first: an installation in progress, a stop of the
 * user, a missing dongle, a failure, a broker out of reach, then running or not.
 * @param {object} status - Status of the server.
 * @param {object} configuration - Saved configuration.
 * @returns {string} A DASHBOARD_STATE.
 */
export const getDashboardState = (status, configuration) => {
  if (get(status, 'installation.state') === 'running') {
    return DASHBOARD_STATE.INSTALLING;
  }
  if (status.stopped) {
    return DASHBOARD_STATE.STOPPED;
  }
  if (status.dongleMissing) {
    return DASHBOARD_STATE.DONGLE_MISSING;
  }
  if (getStartupError(status)) {
    return DASHBOARD_STATE.FAILED;
  }
  if (!status.gladysConnected && hasError(status.mqttConnectionError)) {
    return DASHBOARD_STATE.MQTT_ERROR;
  }
  // With an external broker, Gladys connected is what Gladys runs; Zigbee2mqtt answers or not on its side
  if (status.zigbee2mqttConnected || (isExternal(configuration) && status.gladysConnected)) {
    return DASHBOARD_STATE.ONLINE;
  }
  if (status.zigbee2mqttStarting) {
    return DASHBOARD_STATE.STARTING;
  }
  return DASHBOARD_STATE.NOT_ANSWERING;
};

// The main action of the status card, by state
export const getPrimaryAction = (state, configuration) => {
  if (state === DASHBOARD_STATE.ONLINE) {
    return 'pair';
  }
  if (state === DASHBOARD_STATE.STOPPED) {
    return 'start';
  }
  if (isExternal(configuration)) {
    return null;
  }
  if ([DASHBOARD_STATE.FAILED, DASHBOARD_STATE.MQTT_ERROR, DASHBOARD_STATE.NOT_ANSWERING].includes(state)) {
    return 'restart';
  }
  return null;
};

// The tiles under the cards: restart (not without the dongle: Zigbee2mqtt starts again once it is plugged back), stop,
// the interface of Zigbee2mqtt; none during an installation, a stop, or once stopped
export const getTiles = (state, configuration, z2mUrl) => {
  if ([DASHBOARD_STATE.INSTALLING, DASHBOARD_STATE.STOPPING, DASHBOARD_STATE.STOPPED].includes(state)) {
    return [];
  }
  const tiles = [];
  if (!isExternal(configuration) && state !== DASHBOARD_STATE.DONGLE_MISSING) {
    tiles.push('restart');
  }
  tiles.push('stop');
  if (z2mUrl) {
    tiles.push('interface');
  }
  return tiles;
};

// Devices of the network not added to Gladys yet (as the Discover tab tells them)
export const countNewDevices = discoveredDevices =>
  (discoveredDevices || []).filter(device => device.id === undefined).length;
