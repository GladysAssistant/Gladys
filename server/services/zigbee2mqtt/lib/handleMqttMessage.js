const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { formatDuration } = require('../utils/formatDuration');
const { INSTALLATION_STATE } = require('./constants');

// Zigbee2mqtt answers bridge/request/health_check since 1.21
const HEALTH_CHECK_MIN_MAJOR = 1;
const HEALTH_CHECK_MIN_MINOR = 21;

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
        // Remove Coordinator
        .filter((d) => d.type !== 'Coordinator')
        // Keep only supported devices from zigbee2mqtt library
        .filter((d) => d.supported)
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

      // Re-attach Gladys devices renamed in Zigbee2mqtt (matched by IEEE address)
      // before publishing the discovered devices, so they merge with the right device.
      await this.syncRenamedDevices(devices);

      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
        payload: this.getDiscoveredDevices(),
      });
      break;
    }
    case 'zigbee2mqtt/bridge/config': {
      // Keep only "permit_join" value
      const config = JSON.parse(message);
      this.z2mPermitJoin = config.permit_join;

      logger.debug('Getting config from Zigbee2mqtt : permit_joint =', this.z2mPermitJoin);

      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
        payload: this.z2mPermitJoin,
      });
      break;
    }
    case 'zigbee2mqtt/bridge/response/permit_join': {
      const config = JSON.parse(message);
      // If time is 0, permit join is disabled
      this.z2mPermitJoin = config.data.time !== undefined && config.data.time > 0;

      logger.debug('Getting permit_joint :', this.z2mPermitJoin);

      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
        payload: this.z2mPermitJoin,
      });
      break;
    }
    case 'zigbee2mqtt/bridge/config/permit_join': {
      const config = JSON.parse(message);
      this.z2mPermitJoin = config;

      logger.debug('Getting permit_joint :', this.z2mPermitJoin);

      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
        payload: this.z2mPermitJoin,
      });
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
      this.z2mVersion = version || null;
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
        logger.warn(`Zigbee2mqtt device ${deviceName} not configured in Gladys.`);
      }
    }
  }
  return null;
}

module.exports = {
  handleMqttMessage,
};
