module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('t_device_feature', 'last_downsampling', {
        type: Sequelize.DATE,
      }),
    ]);
  },
  down: (queryInterface, Sequelize) => queryInterface.dropTable('t_device_feature'),
};
