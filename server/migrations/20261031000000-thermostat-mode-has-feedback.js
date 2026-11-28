const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

// Mark the mode feature of every existing thermostat as having feedback (spec
// docs/specs/thermostat.md A.4). The thermostat service saves the mode itself,
// and on a stopped reversible heat pump told to heat or cool it only switches
// the use, leaving the thermostat stopped. Without feedback, the core saved the
// value written once the service had returned, and the next regulation pass
// started the unit. createDevice builds the feature this way from now on; this
// fixes the thermostats saved before.
module.exports = {
  up: async () => {
    const service = await db.Service.findOne({
      attributes: ['id'],
      where: {
        name: 'thermostat',
      },
    });
    if (service === null) {
      logger.info('Thermostat mode feedback migration: thermostat service not found, nothing to do.');
      return;
    }
    const devices = await db.Device.findAll({
      attributes: ['id'],
      where: {
        service_id: service.id,
      },
    });
    if (devices.length === 0) {
      return;
    }
    const [updated] = await db.DeviceFeature.update(
      { has_feedback: true },
      {
        where: {
          device_id: devices.map((device) => device.id),
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
          has_feedback: false,
        },
      },
    );
    logger.info(`Thermostat mode feedback migration: ${updated} mode features now have feedback.`);
  },
  down: async () => {},
};
