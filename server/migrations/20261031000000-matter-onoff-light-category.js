const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

// External id suffix of the Matter OnOff cluster (cluster id 6), see convertToGladysDevice.
const MATTER_ON_OFF_EXTERNAL_ID_SUFFIX = ':6';

// The Matter integration created the OnOff cluster of a light as a generic switch, so the
// dashboard could not group it with the brightness of the same lamp, and the light scenes did not
// reach it (forum 11462). New pairings now create it as a light on/off; this moves the already
// paired lights, the Matter devices which also carry a light feature (brightness or color).
// An on/off-only Matter light has no such feature and keeps its switch until it is paired again.
module.exports = {
  up: async () => {
    const service = await db.Service.findOne({
      attributes: ['id'],
      where: {
        name: 'matter',
      },
    });
    if (service === null) {
      logger.info('Matter on/off light migration: matter service not found, nothing to do.');
      return;
    }
    const devices = await db.Device.findAll({
      attributes: ['id', 'selector'],
      where: {
        service_id: service.id,
      },
      include: [
        {
          model: db.DeviceFeature,
          as: 'features',
          attributes: ['id', 'category', 'type', 'external_id'],
        },
      ],
    });
    await Promise.each(devices, async (device) => {
      const isLight = device.features.some((feature) => feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT);
      if (!isLight) {
        return;
      }
      const onOffFeatures = device.features.filter(
        (feature) =>
          feature.category === DEVICE_FEATURE_CATEGORIES.SWITCH &&
          feature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY &&
          feature.external_id.endsWith(MATTER_ON_OFF_EXTERNAL_ID_SUFFIX),
      );
      await Promise.each(onOffFeatures, async (feature) => {
        await db.DeviceFeature.update(
          {
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
          },
          {
            where: {
              id: feature.id,
            },
          },
        );
        logger.info(`Matter on/off light migration: ${device.selector} on/off is now a light.`);
      });
    });
  },
  down: async () => {},
};
