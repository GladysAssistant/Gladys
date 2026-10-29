const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, THERMOSTAT_ACTIVE_PRESET } = require('../utils/constants');
const { buildUniqueSelector } = require('../utils/addSelector');

// Give every existing thermostat the "active preset" feature (spec
// docs/specs/thermostat.md B.4). The preset feature keeps reading `schedule`
// while a programme runs, so a scene could not start when the programme moved
// from one preset to the next; this feature carries the preset in force instead.
// A thermostat would only get it on its next save from the edit form: this adds
// it to all of them, with the same external_id as the one createDevice builds,
// so that save matches it rather than adding a second one. It is created without
// a value, and the regulation loop writes it within the minute.
module.exports = {
  up: async () => {
    const service = await db.Service.findOne({
      attributes: ['id'],
      where: {
        name: 'thermostat',
      },
    });
    if (service === null) {
      logger.info('Thermostat active preset migration: thermostat service not found, nothing to do.');
      return;
    }
    const devices = await db.Device.findAll({
      attributes: ['id', 'selector', 'external_id'],
      where: {
        service_id: service.id,
      },
      include: [
        {
          model: db.DeviceFeature,
          as: 'features',
          attributes: ['id', 'category', 'type'],
        },
      ],
    });
    logger.info(`Thermostat active preset migration: found ${devices.length} thermostats.`);
    await Promise.each(devices, async (device) => {
      const alreadyMigrated = device.features.some(
        (feature) =>
          feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
          feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.ACTIVE_PRESET,
      );
      if (alreadyMigrated) {
        return;
      }
      // createDevice keys its features on the external_id, never the selector.
      const selector = await buildUniqueSelector(db.DeviceFeature, `${device.external_id}:active-preset`);
      await db.DeviceFeature.create({
        device_id: device.id,
        name: 'Active preset',
        selector,
        external_id: `${device.external_id}:active-preset`,
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.ACTIVE_PRESET,
        read_only: true,
        keep_history: true,
        has_feedback: false,
        min: THERMOSTAT_ACTIVE_PRESET.OFF,
        max: THERMOSTAT_ACTIVE_PRESET.COMFORT,
      });
      logger.info(`Thermostat active preset migration: added the active preset feature to ${device.selector}.`);
    });
  },
  down: async () => {},
};
