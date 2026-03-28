const Promise = require('bluebird');

const db = require('../models');
const logger = require('../utils/logger');

const OLD_PARAM_NAME = 'CLOUD_READ_STRATEGY';
const NEW_PARAM_NAME = 'CLOUD_STRATEGY';

module.exports = {
  up: async () => {
    const service = await db.Service.findOne({
      where: {
        name: 'tuya',
      },
    });
    if (service === null) {
      return;
    }

    logger.info(`Tuya migration: Found service tuya = ${service.id}`);
    const tuyaDevices = await db.Device.findAll({
      where: {
        service_id: service.id,
      },
    });
    logger.info(`Tuya migration: Found ${tuyaDevices.length} devices`);

    await Promise.each(tuyaDevices, async (device) => {
      const oldParam = await db.DeviceParam.findOne({
        where: {
          device_id: device.id,
          name: OLD_PARAM_NAME,
        },
      });
      if (oldParam === null) {
        return;
      }

      const existingNewParam = await db.DeviceParam.findOne({
        where: {
          device_id: device.id,
          name: NEW_PARAM_NAME,
        },
      });

      if (existingNewParam === null) {
        logger.info(`Tuya migration: Creating ${NEW_PARAM_NAME} for device ${device.id}`);
        await db.DeviceParam.create({
          device_id: device.id,
          name: NEW_PARAM_NAME,
          value: oldParam.value,
        });
      }

      logger.info(`Tuya migration: Removing ${OLD_PARAM_NAME} for device ${device.id}`);
      await oldParam.destroy();
    });
  },
  down: async () => {},
};
