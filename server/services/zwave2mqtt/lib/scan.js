const logger = require('../../../utils/logger');
const { ZWAVE_GATEWAY_PARAM_NAME } = require('./constants');
const { convertDevice } = require('./utils/convertDevice');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Handle getNodes response from zwave2mqtt
 * @param {String} topic - response topic used to scan.
 * @param {Object} message - getNodes response.
 * @example handleGetNodesMessage('zwave2mqtt/zwave2mqtt:device/POWER', {});
 */
async function handleGetNodesMessage(topic, message) {
  const getNodes = JSON.parse(message);
  if (getNodes.success) {
    // Add features
    const convertedDevices = getNodes.result.forEach((element) => {
      this.nodes[`nodeId_${element.id}`] = convertDevice(element, this.serviceId);
    });
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZWAVE2MQTT.SCAN_COMPLETE,
      payload: convertedDevices,
    });
  }

  this.scanInProgress = false;
  logger.info('Scanning ZWave done!');
}

/**
 * @description Force scanning for devices.
 * @param {Object} options - Options used to scan.
 * @example scan(options);
 */
async function scan(options) {
  logger.info('Start ZWave scan...');
  this.scanInProgress = true;

  // Subscribe to Zwave2mqtt GetNodes
  this.mqttService.device.subscribe(ZWAVE_GATEWAY_PARAM_NAME.GET_NODES_TOPIC, handleGetNodesMessage.bind(this));
  this.mqttService.device.publish(ZWAVE_GATEWAY_PARAM_NAME.GET_NODES_REQUEST_TOPIC, JSON.stringify({ args: [] }));
}

module.exports = {
  scan,
  handleGetNodesMessage,
};
