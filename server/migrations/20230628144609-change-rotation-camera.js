const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const service = await db.Service.findOne({
      where: {
        name: 'rtsp-camera',
      },
    });
    if (service === null) {
      return;
    }
    logger.info(`RstpCamera migration: Found service rtsp-camera = ${service.id}`);
    const cameraDevices = await db.Device.findAll({
      where: {
        service_id: service.id,
      },
    });
    logger.info(`RstpCamera migration: Found ${cameraDevices.length} devices`);
    await Promise.each(cameraDevices, async (enedisDevice) => {
      const deviceParam = await db.DeviceParam.findOne({
        where: {
          device_id: enedisDevice.id,
          name: 'CAMERA_ROTATION',
        },
      });
      if (deviceParam === null) {
        return;
      }
      if (deviceParam.value === '1') {
        logger.info(`RstpCamera migration: Updating device_params ${deviceParam.id} with 180°`);
        deviceParam.set({
          value: '180',
        });
        await deviceParam.save();
      }
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
