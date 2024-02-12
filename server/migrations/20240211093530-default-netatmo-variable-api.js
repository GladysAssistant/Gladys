const { Op } = require('sequelize');
const db = require('../models');
const { GLADYS_VARIABLES } = require('../services/netatmo/lib/utils/netatmo.constants');

module.exports = {
  up: async () => {
    const netatmoVariableEnergyApi = await db.Variable.findOne({
      where: {
        name: GLADYS_VARIABLES.ENERGY_API,
      },
    });
    console.log('netatmoVariableEnergyApi: ', netatmoVariableEnergyApi);
    if (netatmoVariableEnergyApi) {
      console.log('Netatmo variable energy api already exists.');
      return;
    }
    const netatmoService = await db.Service.findOne({
      where: {
        name: 'netatmo',
      },
    });
    console.log('netatmoService: ', netatmoService);
    if (!netatmoService) {
      console.log('Netatmo service not found.');
      return;
    }

    console.log('model: ', {
      where: {
        service_id: netatmoService.id,
        model: {
          [Op.in]: ['NAPlug', 'NATherm1', 'NRV']
        }
      },
    });
    const netatmoDevice = await db.Device.findOne({
      where: {
        service_id: netatmoService.id,
        model: {
          [Op.in]: ['NAPlug', 'NATherm1', 'NRV']
        }
      },
    });
    console.log('netatmoDevice: ', netatmoDevice);
    const energyApiValue = netatmoDevice ? '1' : '0'; // true: '1', false: '0'

    console.log('energyApiValue: ', energyApiValue);
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

  down: async () => { },
};