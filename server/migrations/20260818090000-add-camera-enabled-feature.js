const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');
const { buildUniqueSelector } = require('../utils/addSelector');

// Give every existing RTSP camera the "enabled" feature (spec docs/specs/camera-enable-disable.md)
// so users can turn a camera off from the dashboard or a scene without re-creating it. The feature
// is created enabled (last_value = 1), so nothing changes until the user turns it off.
// Only the RTSP cameras are migrated: the feature is created by the integration that owns the
// device, and rtsp-camera is the only camera integration shipped inside Gladys.
module.exports = {
  up: async () => {
    const service = await db.Service.findOne({
      attributes: ['id'],
      where: {
        name: 'rtsp-camera',
      },
    });
    if (service === null) {
      logger.info('Camera enabled migration: rtsp-camera service not found, nothing to do.');
      return;
    }
    const devices = await db.Device.findAll({
      attributes: ['id', 'name', 'selector', 'external_id'],
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
    logger.info(`Camera enabled migration: found ${devices.length} RTSP cameras.`);
    await Promise.each(devices, async (device) => {
      const alreadyMigrated = device.features.some(
        (feature) =>
          feature.category === DEVICE_FEATURE_CATEGORIES.CAMERA && feature.type === DEVICE_FEATURE_TYPES.CAMERA.ENABLED,
      );
      if (alreadyMigrated) {
        return;
      }
      const selector = await buildUniqueSelector(db.DeviceFeature, `${device.selector}-enabled`);
      await db.DeviceFeature.create({
        device_id: device.id,
        name: device.name,
        selector,
        external_id: `${device.external_id}:enabled`,
        category: DEVICE_FEATURE_CATEGORIES.CAMERA,
        type: DEVICE_FEATURE_TYPES.CAMERA.ENABLED,
        read_only: false,
        keep_history: false,
        has_feedback: false,
        min: 0,
        max: 1,
        last_value: 1,
        last_value_changed: new Date(),
      });
      logger.info(`Camera enabled migration: added the enabled feature to camera ${device.selector}.`);
    });
  },
  down: async () => {},
};
