module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('t_device_feature_state', ['device_feature_id', 'created_at']);
  },
  down: async (queryInterface, Sequelize) => {},
};
