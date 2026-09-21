const { Op } = require('sequelize');
const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

// On a three-phase ZLinky_TIC, the SINSTS label carries the three-phase total,
// and the SMAXSN / SMAXSN-1 (standard mode) and IMAX / IINST (historic mode)
// labels only exist on single-phase meters, so the "Phase 1" suffix of their
// default names was wrong. Only features still carrying the exact old default
// name are renamed: a name chosen by the user is kept as is.
const RENAMED_FEATURES = [
  {
    category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
    type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS,
    oldName: 'Puissance apparente instantanée soutirée Phase 1',
    newName: 'Puissance apparente instantanée soutirée',
  },
  {
    category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
    type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN,
    oldName: 'Puissance apparente maximale soutirée n Phase 1',
    newName: 'Puissance apparente maximale soutirée n',
  },
  {
    category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
    type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1,
    oldName: 'Puissance apparente maximale soutirée n-1 Phase 1',
    newName: 'Puissance apparente maximale soutirée n-1',
  },
  {
    category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
    type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX,
    oldName: 'Intensité maximale Phase 1',
    newName: 'Intensité maximale',
  },
  {
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
    oldName: 'Intensité instantanée Phase 1',
    newName: 'Intensité instantanée',
  },
];

module.exports = {
  up: async () => {
    const zlinkyDevices = await db.Device.findAll({
      attributes: ['id'],
      where: {
        model: 'ZLinky_TIC',
      },
    });
    if (zlinkyDevices.length === 0) {
      return;
    }
    const features = await db.DeviceFeature.findAll({
      attributes: ['id', 'name', 'category', 'type'],
      where: {
        device_id: zlinkyDevices.map((device) => device.id),
        [Op.or]: RENAMED_FEATURES.map(({ category, type, oldName }) => ({ category, type, name: oldName })),
      },
    });
    if (features.length === 0) {
      return;
    }
    logger.info(`Renaming ${features.length} ZLinky_TIC feature(s) wrongly named "Phase 1"`);
    await Promise.each(features, async (feature) => {
      const { newName } = RENAMED_FEATURES.find(
        ({ category, type }) => category === feature.category && type === feature.type,
      );
      logger.info(`Device feature ${feature.id}: "${feature.name}" -> "${newName}"`);
      await feature.update({ name: newName });
    });
  },

  down: async () => {},
};
