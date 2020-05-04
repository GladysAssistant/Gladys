module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('t_device', 'subservice', {
        type: Sequelize.STRING,
      }),
      queryInterface.addColumn('t_device', 'data_pin', {
        type: Sequelize.STRING,
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('t_device', 'subservice'),
      queryInterface.removeColumn('t_device', 'data_pin'),
    ]);
  },
};
