const db = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // add secret column to device param
    await queryInterface.addColumn('t_device_param', 'secret', {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    // add secret column to variables
    await queryInterface.addColumn('t_variable', 'secret', {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await db.Variable.update({ secret: true }, { where: { name: 'MQTT_PASSWORD' } });
  },
  down: async (queryInterface, Sequelize) => {
    // remove secret column from device param
    await queryInterface.removeColumn('t_device_param', 'secret');
    // remove secret column from variables
    await queryInterface.removeColumn('t_variable', 'secret');
  },
};
