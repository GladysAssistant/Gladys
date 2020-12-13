module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('t_device_feature_state', ['created_at']);
  },
  down: async (queryInterface, Sequelize) => {},
};
