const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { convertFeature } = require('../utils/convertFeature');

// Zigbee2mqtt announces itself online before it listens to its requests: a health check sent right away
// is lost, so it is sent again until Zigbee2mqtt answers
const HEALTH_CHECK_INTERVAL_IN_MS = 3000;

/**
 * @description Ask Zigbee2mqtt to prove that it runs, again and again until it answers, reports itself
 * offline, or Gladys loses the broker.
 * @param {object} manager - The Zigbee2mqtt manager.
 * @example
 * requestHealthCheck(this);
 */
function requestHealthCheck(manager) {
  clearTimeout(manager.healthCheckTimer);
  manager.healthCheckTimer = null;
  // Without the broker, the MQTT client would queue the requests and send them all at once on reconnection.
  // On reconnection, the retained "online" starts asking again.
  if (!manager.mqttClient || !manager.gladysConnected) {
    return;
  }
  manager.mqttClient.publish('zigbee2mqtt/bridge/request/health_check', '{}');
  manager.healthCheckTimer = setTimeout(() => requestHealthCheck(manager), HEALTH_CHECK_INTERVAL_IN_MS);
}

/**
 * @description Read the state published by Zigbee2mqtt on its bridge/state topic.
 * @param {string} message - The bridge/state message: {"state":"online"}, or "online" as plain text
 * for older Zigbee2mqtt versions.
 * @returns {string} The state, "online" or "offline".
 * @example
 * getBridgeState('{"state":"online"}');
 */
function getBridgeState(message) {
  try {
    const payload = JSON.parse(message);
    return payload && payload.state;
  } catch (e) {
    return message;
  }
}

/**
 * @description Store whether Zigbee2mqtt runs, and tell the UI.
 * @param {object} manager - The Zigbee2mqtt manager.
 * @param {boolean} online - Is Zigbee2mqtt online?
 * @example
 * updateBridgeState(this, true);
 */
function updateBridgeState(manager, online) {
  // The state is known: no need to ask Zigbee2mqtt again
  clearTimeout(manager.healthCheckTimer);
  manager.healthCheckTimer = null;
  manager.zigbee2mqttConnected = online;
  manager.zigbee2mqttRunning = online;
  if (online) {
    // Only an answer ends the startup: an "offline" can come from the previous run of the container, sent
    // live when Gladys restarts it, or retained by the broker
    clearTimeout(manager.startingTimer);
    manager.startingTimer = null;
    manager.zigbee2mqttStarting = false;
    manager.zigbee2mqttExist = true;
    // Zigbee2mqtt started: an error read in its startup logs did not prevent it from running
    manager.z2mContainerError = null;
  }
  manager.emitStatusEvent();
}

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
      // Zigbee2mqtt publishes "online" (retained) once connected to the broker, and "offline" when it
      // stops; the broker publishes "offline" in its place (last will) when it crashes.
      if (getBridgeState(message) === 'online') {
        // A retained "online" can be outdated: left by a Zigbee2mqtt that was running when the broker
        // stopped first (host reboot). A Zigbee2mqtt whose adapter fails to start exits before
        // connecting to the broker, so it never replaces it. Only an answer from Zigbee2mqtt proves it runs.
        logger.debug('Zigbee2mqtt bridge announced online, checking its health...');
        // A new run announces itself: the answer of the previous one no longer proves anything, and the
        // "offline" of a crashed run may only come after this "online"
        this.zigbee2mqttConnected = false;
        this.zigbee2mqttRunning = false;
        this.emitStatusEvent();
        requestHealthCheck(this);
      } else {
        logger.debug('Zigbee2mqtt bridge is offline');
        updateBridgeState(this, false);
      }
      break;
    }
    case 'zigbee2mqtt/bridge/response/health_check': {
      // Only Zigbee2mqtt answers on this topic: any answer, even an error, proves that it runs and listens
      logger.debug('Zigbee2mqtt answered the health check');
      updateBridgeState(this, true);
      break;
    }
    case 'zigbee2mqtt/bridge/devices': {
      logger.debug('Getting config devices from Zigbee2mqtt');
      const devices = JSON.parse(message);

      this.discoveredDevices = {};

      devices
        // Remove Coordinator
        .filter((d) => d.type !== 'Coordinator')
        // Keep only supported devices from zigbee2mqtt library
        .filter((d) => d.supported)
        .forEach((device) => {
          this.discoveredDevices[device.friendly_name] = device;
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
      const { coordinator } = info;
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
      if (device) {
        const incomingFeatures = JSON.parse(message);
        Object.keys(incomingFeatures).forEach((zigbeeFeatureField) => {
          // Find the feature regarding the field name
          const value = incomingFeatures[zigbeeFeatureField];
          const feature = convertFeature(device.features, zigbeeFeatureField, value);
          if (feature) {
            try {
              const newState = {
                device_feature_external_id: `${feature.external_id}`,
                state: this.readValue(deviceName, zigbeeFeatureField, value),
              };
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, newState);
            } catch (e) {
              logger.error(`Failed to convert value for device ${deviceName}:`, e);
            }
          } else {
            logger.debug(`Zigbee2mqtt device ${deviceName}, feature ${zigbeeFeatureField} not configured in Gladys.`);
          }
        });
      } else if (this.discoveredDevices[deviceName]) {
        logger.warn(`Zigbee2mqtt device ${deviceName} not configured in Gladys.`);
      } else {
        logger.debug(`Zigbee2mqtt topic ${topic} not handled.`);
      }
    }
  }
  return null;
}

module.exports = {
  handleMqttMessage,
};
