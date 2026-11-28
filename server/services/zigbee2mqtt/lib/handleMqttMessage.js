const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { formatDuration } = require('../utils/formatDuration');
const { CONFIGURATION, INSTALLATION_STATE } = require('./constants');

// Zigbee2mqtt answers bridge/request/health_check since 1.21
const HEALTH_CHECK_MIN_MAJOR = 1;
const HEALTH_CHECK_MIN_MINOR = 21;
// A version as Zigbee2mqtt publishes it ("2.6.1", "2.6.1-dev"): anything else, from whoever can publish on the broker,
// is not kept, the setup page shows it
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {object} message - The message sent.
 * @returns {Promise} Null.
 * @example
 * handleMqttMessage('stat/zigbee2mqtt/POWER', 'ON');
 */
async function handleMqttMessage(topic, message) {
  switch (topic) {
    case 'zigbee2mqtt/bridge/state': {
      // Zigbee2mqtt publishes "online" (retained) once connected to the broker, and "offline" when it stops; the
      // broker publishes "offline" in its place (last will) when it crashes. Neither proves the current state: a
      // retained "online" can be left by a Zigbee2mqtt that no longer runs (it exits before connecting to the
      // broker when its adapter fails), and the "offline" of a previous run can come after the "online" of the
      // new one. Any announcement only means that the run changed: Gladys asks again until Zigbee2mqtt answers.
      logger.debug(`Zigbee2mqtt bridge state is ${message}, checking its health...`);
      // Broadcast only a change: an announcement often follows another one (the last will of the previous run)
      if (this.zigbee2mqttConnected || this.zigbee2mqttRunning) {
        this.zigbee2mqttConnected = false;
        this.zigbee2mqttRunning = false;
        this.emitStatusEvent();
      }
      // Joining is left as it is: replayed on each reconnection, the announcement proves no new run, and a new run
      // tells joining closed in its own bridge/info
      this.requestHealthCheck();
      break;
    }
    case 'zigbee2mqtt/bridge/response/health_check': {
      // Only Zigbee2mqtt answers on this topic: any answer, even an error, proves that it runs and listens
      logger.debug('Zigbee2mqtt answered the health check');
      if (this.zigbee2mqttStarting) {
        const answeredIn = formatDuration(Date.now() - this.zigbee2mqttStartingSince);
        logger.info(`Zigbee2mqtt answered ${answeredIn} after the restart of its container`);
      }
      clearTimeout(this.healthCheckTimer);
      this.healthCheckTimer = null;
      this.zigbee2mqttConnected = true;
      this.zigbee2mqttRunning = true;
      this.zigbee2mqttExist = true;
      // The startup ends only on an answer, or after its timeout (see installZ2mContainer)
      clearTimeout(this.startingTimer);
      this.startingTimer = null;
      this.zigbee2mqttStarting = false;
      // An error read in the logs of the container did not prevent Zigbee2mqtt from running
      this.z2mContainerError = null;
      // The first setup reached its end: the setup page no longer opens the wizard
      if (this.setupPending) {
        this.setupPending = false;
        // eslint-disable-next-line promise/prefer-await-to-then
        this.gladys.variable.destroy(CONFIGURATION.Z2M_SETUP_PENDING, this.serviceId).catch((e) => {
          logger.warn('Zigbee2mqtt: end of the first setup not saved:', e);
        });
      }
      this.emitStatusEvent();
      // Nor did the failure of the last installation, which no longer describes Zigbee2mqtt: the setup page stops
      // showing it. A running installation ends on this answer (see waitForZigbee2mqtt).
      if (this.installation.state === INSTALLATION_STATE.FAILED) {
        this.clearInstallation();
      }
      break;
    }
    case 'zigbee2mqtt/bridge/devices': {
      logger.debug('Getting config devices from Zigbee2mqtt');
      const devices = JSON.parse(message);

      this.discoveredDevices = {};

      // Told by the status only when it changes
      const deviceCount = devices.filter((d) => d.type !== 'Coordinator').length;
      if (deviceCount !== this.deviceCount) {
        this.deviceCount = deviceCount;
        this.emitStatusEvent();
      }

      devices
        // Remove Coordinator. The devices Zigbee2mqtt does not support are kept: added with their generic features,
        // they are controlled like the others (docs/specs/zigbee2mqtt-pairing.md, E.2)
        .filter((d) => d.type !== 'Coordinator')
        .forEach((device) => {
          this.discoveredDevices[device.friendly_name] = device;
        });

      // Forget the last values of the devices that left the network
      const discoveredAddresses = Object.values(this.discoveredDevices).map((d) => d.ieee_address);
      Object.keys(this.lastReceivedStates).forEach((ieeeAddress) => {
        if (!discoveredAddresses.includes(ieeeAddress)) {
          delete this.lastReceivedStates[ieeeAddress];
        }
      });

      // The devices being paired, before the await: a name told meanwhile is more recent
      const pairingChanged = this.updatePairingFromList(devices);

      // Re-attach Gladys devices renamed in Zigbee2mqtt (matched by IEEE address)
      // before publishing the discovered devices, so they merge with the right device.
      await this.syncRenamedDevices(devices);

      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
        payload: this.getDiscoveredDevices(),
      });
      this.emitPairingDevicesAfterList(pairingChanged);
      break;
    }
    case 'zigbee2mqtt/bridge/event': {
      this.handleBridgeEvent(JSON.parse(message));
      break;
    }
    case 'zigbee2mqtt/bridge/response/permit_join': {
      const response = JSON.parse(message);
      // A refused request changes nothing, nor an answer that tells nothing
      const { time, value } = (response.status === 'ok' && response.data) || {};
      // `time` for Zigbee2mqtt 2, `value` alone for Zigbee2mqtt 1 asked by another client (its interface)
      if (typeof time === 'number' ? time > 0 : value === true) {
        // An estimate: the end bridge/info tells (before or after this answer) is the exact one, and kept. Told even
        // when nothing changes: the window waits for the answer of its request (an Extend within the same end)
        this.updatePermitJoin(true, typeof time === 'number' ? Date.now() + time * 1000 : null, {
          estimated: true,
          answered: true,
        });
      } else if (typeof time === 'number' || value === false) {
        this.updatePermitJoin(false, undefined, { answered: true });
      }
      break;
    }
    case 'zigbee2mqtt/bridge/info': {
      const info = JSON.parse(message);
      const { coordinator, version } = info;
      const [major, minor] = `${version}`.split('.').map((part) => parseInt(part, 10));
      if (major < HEALTH_CHECK_MIN_MAJOR || (major === HEALTH_CHECK_MIN_MAJOR && minor < HEALTH_CHECK_MIN_MINOR)) {
        // Gladys shows Zigbee2mqtt running only once it answers the health check: say why it never will
        logger.warn(
          `Zigbee2mqtt ${version} does not answer the health check, Gladys needs Zigbee2mqtt ${HEALTH_CHECK_MIN_MAJOR}.${HEALTH_CHECK_MIN_MINOR} or later`,
        );
      }
      this.z2mVersion = typeof version === 'string' && VERSION_PATTERN.test(version) ? version : null;
      // Whether joining is permitted and until when: Zigbee2mqtt 2 publishes its info again when joining opens and
      // when it closes (after 254 s), and has no other message for the closing
      if (typeof info.permit_join === 'boolean') {
        this.updatePermitJoin(info.permit_join, info.permit_join_end);
      }
      if (coordinator && coordinator.meta) {
        this.coordinatorFirmware = {
          ...coordinator.meta,
          type: coordinator.type,
        };
      } else {
        this.coordinatorFirmware = null;
      }
      this.emitStatusEvent();
      break;
    }
    case 'zigbee2mqtt/bridge/response/backup': {
      const payload = JSON.parse(message);
      await this.saveZ2mBackup(payload);
      break;
    }
    default: {
      // The device name is everything after the base topic: a Zigbee2mqtt friendly
      // name can contain "/" (e.g. "salon/lampe"). Device sub-topics ("<name>/set",
      // "<name>/availability"...) end with a segment that is not part of the name,
      // so a topic is a device state only when its remainder names a known device.
      const deviceName = topic.substring(topic.indexOf('/') + 1);
      if (!message) {
        logger.warn(`Zigbee2mqtt topic ${topic} empty message.`);
        break;
      }
      // Fetch device from name
      const device = this.gladys.stateManager.get('deviceByExternalId', `zigbee2mqtt:${deviceName}`);
      const discoveredDevice = this.discoveredDevices[deviceName];
      if (!device && !discoveredDevice) {
        logger.debug(`Zigbee2mqtt topic ${topic} not handled.`);
        break;
      }
      let incomingFeatures;
      try {
        incomingFeatures = JSON.parse(message);
      } catch (e) {
        incomingFeatures = null;
      }
      // A device state is a JSON object of its properties
      if (incomingFeatures === null || typeof incomingFeatures !== 'object' || Array.isArray(incomingFeatures)) {
        logger.warn(`Zigbee2mqtt device ${deviceName} sent a message that is not a state: ${message}`);
        break;
      }
      if (device) {
        Object.keys(incomingFeatures).forEach((property) => {
          this.emitDeviceState(device, deviceName, property, incomingFeatures[property]);
        });
      } else {
        // Keep the last value of each property, replayed when the device is created in Gladys (see postCreate):
        // the device may not report again for hours. By IEEE address, which survives a rename and changes when
        // another device takes the name.
        const receivedAt = new Date().toISOString();
        const lastStates = this.lastReceivedStates[discoveredDevice.ieee_address] || {};
        Object.keys(incomingFeatures).forEach((property) => {
          lastStates[property] = { value: incomingFeatures[property], receivedAt };
        });
        this.lastReceivedStates[discoveredDevice.ieee_address] = lastStates;
        // A device Zigbee2mqtt does not support is often never added: not worth a warning at each state
        logger[discoveredDevice.supported ? 'warn' : 'debug'](
          `Zigbee2mqtt device ${deviceName} not configured in Gladys.`,
        );
      }
    }
  }
  return null;
}

module.exports = {
  handleMqttMessage,
};
