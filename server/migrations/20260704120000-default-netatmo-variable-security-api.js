const db = require('../models');
const { GLADYS_VARIABLES } = require('../services/netatmo/lib/utils/netatmo.constants');
const logger = require('../utils/logger');

module.exports = {
  up: async () => {
    const netatmoVariableSecurityApi = await db.Variable.findOne({
      where: {
        name: GLADYS_VARIABLES.SECURITY_API,
      },
    });
    if (netatmoVariableSecurityApi) {
      logger.info('Netatmo variable security api already exists.');
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

    await db.Variable.upsert({
      service_id: netatmoService.id,
      name: GLADYS_VARIABLES.SECURITY_API,
      value: '0', // default: false
    });
    logger.info(`Netatmo migration: Add SECURITY_API variable for the Netatmo service = ${netatmoService.id}`);
  },

  down: async () => {},
};
