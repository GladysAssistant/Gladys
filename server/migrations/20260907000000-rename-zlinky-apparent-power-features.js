const { Op } = require('sequelize');
const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

// On a three-phase ZLinky_TIC, the SINSTS label carries the three-phase total
// and the SMAXSN / SMAXSN-1 labels only exist on single-phase meters, so the
// "Phase 1" suffix of their default names was wrong. Only features still
// carrying the exact old default name are renamed: a name chosen by the user
// is kept as is.
const RENAMED_FEATURES = [
  {
    type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS,
    oldName: 'Puissance apparente instantanée soutirée Phase 1',
    newName: 'Puissance apparente instantanée soutirée',
  },
  {
    type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN,
    oldName: 'Puissance apparente maximale soutirée n Phase 1',
    newName: 'Puissance apparente maximale soutirée n',
  },
  {
    type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1,
    oldName: 'Puissance apparente maximale soutirée n-1 Phase 1',
    newName: 'Puissance apparente maximale soutirée n-1',
  },
];

module.exports = {
  up: async () => {
    const features = await db.DeviceFeature.findAll({
      attributes: ['id', 'name', 'type'],
      where: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        [Op.or]: RENAMED_FEATURES.map(({ type, oldName }) => ({ type, name: oldName })),
      },
    });
    if (features.length === 0) {
      return;
    }
    logger.info(`Renaming ${features.length} ZLinky_TIC apparent power feature(s) wrongly named "Phase 1"`);
    await Promise.each(features, async (feature) => {
      const { newName } = RENAMED_FEATURES.find(({ type }) => type === feature.type);
      logger.info(`Device feature ${feature.id}: "${feature.name}" -> "${newName}"`);
      await feature.update({ name: newName });
    });
  },

  down: async () => {},
};
