const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description Add Xiaomi Gateway.
 * @param {Object} message - Message received.
 * @param {Object} data - Data received.
 * @example
 * newValueGateway({ sid: 34344 }, {
 *    status: 1
 * });
 */
async function newValueGateway(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value gateway, sid = ${sid}`);
  if (message.cmd === 'heartbeat' && message.token) {
    const newSensor = {
      service_id: this.serviceId,
      name: `Xiaomi Gateway`,
      selector: `xiaomi:${sid}`,
      external_id: `xiaomi:${sid}`,
      model: 'xiaomi-gateway',
      should_poll: false,
      features: [
        {
          name: 'On/Off',
          selector: `xiaomi:${sid}:gateway:binary`,
          external_id: `xiaomi:${sid}:gateway:binary`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 1,
        },
        {
          name: 'Hue',
          selector: `xiaomi:${sid}:gateway:hue`,
          external_id: `xiaomi:${sid}:gateway:hue`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.HUE,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 360,
        },
        {
          name: 'Saturation',
          selector: `xiaomi:${sid}:gateway:saturation`,
          external_id: `xiaomi:${sid}:gateway:saturation`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.SATURATION,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        },
        {
          name: 'Brightness',
          selector: `xiaomi:${sid}:gateway:brightness`,
          external_id: `xiaomi:${sid}:gateway:brightness`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        },
      ],
      params: [
        {
          name: 'GATEWAY_TOKEN',
          value: message.token,
        },
        {
          name: 'GATEWAY_IP',
          value: data.ip,
        },
      ],
    };
    this.addDevice(sid, newSensor);
  }
}

module.exports = {
  newValueGateway,
};
