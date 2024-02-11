const db = require('../models');
const { GLADYS_VARIABLES } = require('../services/netatmo/lib/utils/netatmo.constants');

module.exports = {
  up: async () => {
    const netatmoVariableEnergyApi = await db.Variable.findOne({
      where: {
        name: GLADYS_VARIABLES.ENERGY_API,
      },
    });
    if (netatmoVariableEnergyApi) {
      console.log('Netatmo variable energy api already exists.');
      return;
    }
    const netatmoService = await db.Service.findOne({
      where: {
        name: 'netatmo',
      },
    });
    if (!netatmoService) {
      console.log('Netatmo service not found.');
      return;
    }

    const netatmoDevice = await db.Device.findOne({
      where: {
        service_id: netatmoService.id,
      },
    });
    const energyApiValue = netatmoDevice ? '1' : '0'; // true: '1', false: '0'

    await db.Variable.upsert({
      name: GLADYS_VARIABLES.ENERGY_API,
      value: energyApiValue,
    });
    await db.Variable.upsert({
      name: GLADYS_VARIABLES.WEATHER_API,
      value: '0', // default: false
    });
  },

  down: async () => { },
};