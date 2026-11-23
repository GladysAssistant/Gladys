const { Op } = require('sequelize');
const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

// On a three-phase ZLinky_TIC, the UMOY3 expose was mapped to the UMOY2 feature
// type, so existing "Tension moyenne Phase 3" features carry an external_id of
// `zigbee2mqtt:<device>:teleinformation:umoy2:UMOY3`. Once the expose maps UMOY3
// to its own type, the next poll no longer matches those rows and device.create
// destroys each of them before inserting a new feature: history is lost and
// dashboard/scene bindings on the old selector break. Rewriting the external_id
// (and the type) in place keeps the same row. Selectors are left untouched, so
// existing scene and dashboard references keep working.
const OLD_SUFFIX = ':teleinformation:umoy2:UMOY3';
const NEW_SUFFIX = ':teleinformation:umoy3:UMOY3';

module.exports = {
  up: async () => {
    const features = await db.DeviceFeature.findAll({
      attributes: ['id', 'external_id'],
      where: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2,
        external_id: {
          [Op.like]: `zigbee2mqtt:%${OLD_SUFFIX}`,
        },
      },
    });
    if (features.length === 0) {
      return;
    }
    logger.info(`Retyping ${features.length} ZLinky UMOY3 feature(s) wrongly typed as UMOY2`);
    await Promise.each(features, async (feature) => {
      const { external_id: externalId } = feature;
      const newExternalId = `${externalId.slice(0, externalId.length - OLD_SUFFIX.length)}${NEW_SUFFIX}`;
      logger.info(`Device feature ${feature.id}: "${externalId}" -> "${newExternalId}"`);
      await feature.update({
        external_id: newExternalId,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY3,
      });
    });
  },

  down: async () => {},
};
