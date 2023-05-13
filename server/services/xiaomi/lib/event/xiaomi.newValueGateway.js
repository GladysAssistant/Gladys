const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description Add Xiaomi Gateway.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueGateway({ sid: 34344 }, {
 *    status: 1
 * });
 */
function newValueGateway(message, data) {
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
          name: 'Color',
          selector: `xiaomi:${sid}:gateway:color`,
          external_id: `xiaomi:${sid}:gateway:color`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
          read_only: false,
          keep_history: false,
          has_feedback: false,
          min: 0,
          max: 0,
        },
        {
          name: 'Luminosity',
          selector: `xiaomi:${sid}:luminosity`,
          external_id: `xiaomi:${sid}:luminosity`,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.LUX,
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 1200,
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
    this.gatewayTokenByIp.set(data.ip, message.token);
    this.addDevice(sid, newSensor);
  }

  if (data && data.illumination) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:luminosity`,
      state: data.illumination,
    });
  }
}

module.exports = {
  newValueGateway,
};
