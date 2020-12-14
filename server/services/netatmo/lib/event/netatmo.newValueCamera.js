const logger = require('../../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
} = require('../../../../utils/constants');

const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

/**
 * @description New value thermostat received.
 * @param {Object} data - Data received.
 * @example
 * newValueThermostat(122324, {
 * });
 */
function newValueCamera(data) {
  /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
  const sid = data.id;
  logger.debug(`Netatmo : New camera, sid = ${sid}`);
  this.devices[sid] = data;
  const newCamera = {
    id: `netatmo:${sid}`,
    name: data.name,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    external_id: `netatmo:${sid}`,
    service_id: this.serviceId,
    cameraUrl: {
      name: 'CAMERA_URL',
      value: data.vpn_url
    },
    features: [
      {
        name: data.name,
        selector: null,
        external_id: `netatmo:${sid}:camera`,
        category: DEVICE_FEATURE_CATEGORIES.CAMERA,
        type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
        read_only: false,
        keep_history: false,
        has_feedback: false,
        min: 0,
        max: 0
      }
    ],
    params: [
      {
        name: 'CAMERA_URL',
        value: data.vpn_url
      }
    ]
  };
  this.addSensor(sid, newCamera);
}

module.exports = {
  newValueCamera,
};
