module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_device_feature', 'step', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });
  },
  down: async () => {},
};
