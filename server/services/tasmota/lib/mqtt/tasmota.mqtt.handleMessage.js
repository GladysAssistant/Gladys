const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { featureStatus } = require('../utils/tasmota.featureStatus');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @example
 * handleMessage('stat/tasmota/POWER', 'ON');
 */
function handleMessage(topic, message) {
  const splittedTopic = topic.split('/');
  const eventType = splittedTopic[2];
  const deviceExternalId = splittedTopic[1];
  const events = [];

  switch (eventType) {
    // Sensor status
    case 'SENSOR': {
      featureStatus(deviceExternalId, message, this.tasmotaHandler.gladys.event, 'StatusSNS');
      break;
    }
    // Device global status
    case 'STATUS': {
      delete this.discoveredDevices[deviceExternalId];
      const device = this.status(deviceExternalId, message);
      this.pendingDevices[deviceExternalId] = device;
      this.mqttService.device.publish(`cmnd/${deviceExternalId}/STATUS`, '11');
      break;
    }
    // Device secondary features
    case 'STATUS8': {
      let device = this.pendingDevices[deviceExternalId];
      if (device) {
        this.subStatus(device, message);
        device = this.tasmotaHandler.mergeWithExistingDevice(device);

        this.discoveredDevices[deviceExternalId] = device;
        delete this.pendingDevices[deviceExternalId];

        this.tasmotaHandler.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_MQTT_DEVICE);
      }
      break;
    }
    // Device primary features
    case 'STATUS11': {
      const device = this.pendingDevices[deviceExternalId];
      if (device) {
        this.subStatus(device, message);
        // Ask for secondary features
        this.mqttService.device.publish(`cmnd/${deviceExternalId}/STATUS`, '8');
      }
      break;
    }
    case 'RESULT':
    case 'STATE': {
      featureStatus(deviceExternalId, message, this.tasmotaHandler.gladys.event, 'StatusSTS');
      break;
    }
    // Online status
    case 'LWT': {
      this.mqttService.device.publish(`cmnd/${deviceExternalId}/status`);
      break;
    }
    default: {
      logger.debug(`MQTT : Tasmota topic "${topic}" not handled.`);
    }
  }

  events.forEach((event) => this.tasmotaHandler.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, event));
  return null;
}

module.exports = {
  handleMessage,
};
