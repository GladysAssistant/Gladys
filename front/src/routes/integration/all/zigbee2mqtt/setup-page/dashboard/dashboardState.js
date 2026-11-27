import get from 'get-value';

import { MQTT_MODE, ADAPTER_MODE } from '../constants';
import { ZIGBEE2MQTT_SUPPORT, getSupport } from '../../utils/support';

// What the status card of the dashboard tells, from the status of the server (docs/specs/zigbee2mqtt-installation.md, N)
export const DASHBOARD_STATE = {
  INSTALLING: 'installing',
  STOPPED: 'stopped',
  STOPPING: 'stopping',
  DONGLE_MISSING: 'dongleMissing',
  FAILED: 'failed',
  INACTIVE: 'inactive',
  PENDING: 'pending',
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
 * @description Why Gladys is not connected to the broker: the error of its MQTT client, else (an external broker) the
 * failure of the installation that tried to connect to it.
 * @param {object} status - Status of the server.
 * @returns {object|null} `{ code, message }`, or null.
 */
export const getBrokerError = status => {
  if (hasError(status.mqttConnectionError)) {
    return status.mqttConnectionError;
  }
  if (get(status, 'installation.state') === 'failed' && hasError(status.installation.error)) {
    return status.installation.error;
  }
  return null;
};

/**
 * @description The state the status card shows, the most urgent first: an installation in progress, the service not
 * started (Gladys starts its services one after the other, or it was stopped in the settings), its configuration not
 * read yet, a stop of the user, a missing dongle, a failure, a broker out of reach, then running or not. With an
 * external broker, Gladys runs nothing: the broker out of reach (whatever the last connection told), then Zigbee2mqtt
 * answering on it or not, as the wizard tells it.
 * @param {object} status - Status of the server.
 * @param {object} configuration - Saved configuration.
 * @returns {string} A DASHBOARD_STATE.
 */
export const getDashboardState = (status, configuration) => {
  if (get(status, 'installation.state') === 'running') {
    return DASHBOARD_STATE.INSTALLING;
  }
  // The service not started: nothing else runs, even a stop of the user waits for it. Settings > Services starts it
  if (status.serviceStarted === false) {
    return DASHBOARD_STATE.INACTIVE;
  }
  // Started, but init has not read the configuration yet: what it tells (a stop, a failure) is not known meanwhile
  if (status.configured === null) {
    return DASHBOARD_STATE.PENDING;
  }
  if (status.stopped) {
    return DASHBOARD_STATE.STOPPED;
  }
  if (isExternal(configuration)) {
    if (!status.gladysConnected) {
      return DASHBOARD_STATE.MQTT_ERROR;
    }
    return status.zigbee2mqttConnected ? DASHBOARD_STATE.ONLINE : DASHBOARD_STATE.NOT_ANSWERING;
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
  if (status.zigbee2mqttConnected) {
    return DASHBOARD_STATE.ONLINE;
  }
  if (status.zigbee2mqttStarting) {
    return DASHBOARD_STATE.STARTING;
  }
  return DASHBOARD_STATE.NOT_ANSWERING;
};

// The main action of the status card, by state. The service not started: started by Settings > Services, only. With
// an external broker out of reach, its connection is edited (the advanced settings)
export const getPrimaryAction = (state, configuration) => {
  if (state === DASHBOARD_STATE.ONLINE) {
    return 'pair';
  }
  if (state === DASHBOARD_STATE.STOPPED) {
    return 'start';
  }
  if ([DASHBOARD_STATE.INACTIVE, DASHBOARD_STATE.PENDING].includes(state)) {
    return null;
  }
  if (isExternal(configuration)) {
    return state === DASHBOARD_STATE.MQTT_ERROR ? 'editConnection' : null;
  }
  if ([DASHBOARD_STATE.FAILED, DASHBOARD_STATE.MQTT_ERROR, DASHBOARD_STATE.NOT_ANSWERING].includes(state)) {
    return 'restart';
  }
  return null;
};

// The tiles under the cards: restart (not without the dongle: Zigbee2mqtt starts again once it is plugged back, nor
// when it is already the main action), stop, the interface of Zigbee2mqtt; none during an installation, a stop, once
// stopped, or while the service is not started or its configuration not read yet, except the stop again while a
// container of ours still runs (Docker refused to stop it). With an external broker out of reach, nothing to
// disconnect
export const getTiles = (state, configuration, z2mUrl, status = {}) => {
  if (state === DASHBOARD_STATE.STOPPED && !isExternal(configuration)) {
    return status.zigbee2mqttRunning || status.mqttRunning ? ['stop'] : [];
  }
  if (
    [
      DASHBOARD_STATE.INSTALLING,
      DASHBOARD_STATE.STOPPING,
      DASHBOARD_STATE.STOPPED,
      DASHBOARD_STATE.INACTIVE,
      DASHBOARD_STATE.PENDING
    ].includes(state)
  ) {
    return [];
  }
  const tiles = [];
  const external = isExternal(configuration);
  if (!external && state !== DASHBOARD_STATE.DONGLE_MISSING && getPrimaryAction(state, configuration) !== 'restart') {
    tiles.push('restart');
  }
  if (!external || state !== DASHBOARD_STATE.MQTT_ERROR) {
    tiles.push('stop');
  }
  if (z2mUrl) {
    tiles.push('interface');
  }
  return tiles;
};

// The words of a stop: with an external broker it only disconnects Gladys, Zigbee2mqtt runs on (relative to
// integration.zigbee2mqtt.setup.dashboard)
export const getStopKeys = configuration =>
  isExternal(configuration)
    ? { label: 'actions.disconnect', confirm: 'confirmStopExternal' }
    : { label: 'actions.stop', confirm: 'confirmStop' };

// Devices of the network not added to Gladys yet (as the Discover tab tells them), the ones Zigbee2mqtt supports
// only: the others wait in a section of their own of the Discover tab (docs/specs/zigbee2mqtt-pairing.md, E.5)
export const countNewDevices = discoveredDevices =>
  (discoveredDevices || []).filter(
    device => device.id === undefined && getSupport(device) === ZIGBEE2MQTT_SUPPORT.NATIVE
  ).length;
