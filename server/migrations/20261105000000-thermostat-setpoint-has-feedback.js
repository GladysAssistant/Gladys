const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

// A virtual thermostat's setpoint is saved by the thermostat service itself,
// clamped to the thermostat's range (spec docs/specs/thermostat.md D.0). With
// `has_feedback: false` the core saved the value as requested right after the
// service, undoing the clamp and writing a second history row. createDevice
// now builds the feature with `has_feedback: true`; this gives the setpoint of
// every existing thermostat the same flag, without waiting for its next save.
// An external thermostat carries no setpoint feature of its own: the real
// device's feature belongs to another service and is not touched.
module.exports = {
  up: async () => {
    const service = await db.Service.findOne({
      attributes: ['id'],
      where: {
        name: 'thermostat',
      },
    });
    if (service === null) {
      logger.info('Thermostat setpoint feedback migration: thermostat service not found, nothing to do.');
      return;
    }
    const devices = await db.Device.findAll({
      attributes: ['id'],
      where: {
        service_id: service.id,
      },
    });
    if (devices.length === 0) {
      logger.info('Thermostat setpoint feedback migration: no thermostat, nothing to do.');
      return;
    }
    const [updated] = await db.DeviceFeature.update(
      { has_feedback: true },
      {
        where: {
          device_id: devices.map((device) => device.id),
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        },
      },
    );
    logger.info(`Thermostat setpoint feedback migration: ${updated} setpoint feature(s) updated.`);
  },
  down: async () => {},
};
