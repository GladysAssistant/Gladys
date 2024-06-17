const { Op } = require('sequelize');
const db = require('../models');
const { GLADYS_VARIABLES } = require('../services/netatmo/lib/utils/netatmo.constants');
const logger = require('../utils/logger');

module.exports = {
  up: async () => {
    const netatmoVariableEnergyApi = await db.Variable.findOne({
      where: {
        name: GLADYS_VARIABLES.ENERGY_API,
      },
    });
    if (netatmoVariableEnergyApi) {
      logger.info('Netatmo variable energy api already exists.');
      return;
    }
    const netatmoService = await db.Service.findOne({
      where: {
        name: 'netatmo',
      },
    });
    if (!netatmoService) {
      logger.info('Netatmo service not found.');
      return;
    }
    logger.info(`Netatmo migration: Found service netatmo = ${netatmoService.id}`);

    const netatmoDevice = await db.Device.findOne({
      where: {
        service_id: netatmoService.id,
        model: {
          [Op.in]: ['NAPlug', 'NATherm1', 'NRV'],
        },
      },
    });
    const energyApiValue = netatmoDevice ? '1' : '0'; // true: '1', false: '0'
    logger.info(`Netatmo migration: Found at least 1 netatmo device`);

    await db.Variable.upsert({
      service_id: netatmoService.id,
      name: GLADYS_VARIABLES.ENERGY_API,
      value: energyApiValue,
    });
    await db.Variable.upsert({
      service_id: netatmoService.id,
      name: GLADYS_VARIABLES.WEATHER_API,
      value: '0', // default: false
    });
  },

  down: async () => {},
};
